// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Cipherquest is ReentrancyGuard, Ownable {
    struct Quest {
        uint256 questId; // The address of the user who created the quest
        address creator; // The address of the user who created the quest
        string question; // The question for the quest
        string hint; // The correct answer
        bytes32 answer; // The correct answer
        uint256 rewardAmount; // Reward for solving the quest
        bool isActive; // Whether the quest is still active
        address claimedBy;
    }

    mapping(uint256 => Quest) public quests; // Mapping to store quests by an ID
    mapping(address => mapping(uint256 => bool)) public hasClaimed; // Track who has claimed for a specific quest
    uint256 public questCount; // Count to assign unique IDs to quests
    uint256 public revenue; // Count to assign unique IDs to quests
    uint256 public revenueFees; // This can be updated by the admin

    event QuestCreated(
        uint256 questId,
        address creator,
        string question,
        uint256 rewardAmount
    );
    event AnswerSubmitted(
        address indexed user,
        uint256 questId,
        bool isCorrect
    );
    event RewardClaimed(address indexed user, uint256 questId, uint256 amount);
    event RevenueFeeUpdated(uint256 newFee);

    constructor(uint256 _revenueFees) Ownable() {
        revenueFees = _revenueFees;
    }

    // Function to create a new quest
    function createQuest(
        string memory _question,
        string memory _hint,
        bytes32 _answer
    ) public payable {
        require(msg.value >= revenueFees, "Insufficient funds to cover fees.");

        uint256 _rewardAmount = msg.value - revenueFees;
        revenue += revenueFees;
        questCount++; // Increment the quest ID
        quests[questCount] = Quest({
            questId: questCount,
            creator: msg.sender,
            question: _question,
            answer: _answer,
            hint: _hint,
            rewardAmount: _rewardAmount,
            isActive: true,
            claimedBy: address(0)
        });

        emit QuestCreated(questCount, msg.sender, _question, _rewardAmount);
    }

    // Function to submit an answer to a quest
    function submitAnswer(uint256 _questId, bytes32 _answer)
        public
        payable
        nonReentrant
    {
        require(msg.sender != quests[_questId].creator, "Creator cannot claim the reward.");

        require(quests[_questId].isActive, "Quest is no longer active.");

        require(_answer == quests[_questId].answer, "Wrong answer");

        // If the answer is correct, reward the user
        payable(msg.sender).transfer(quests[_questId].rewardAmount); // Reward the user with ETH
        hasClaimed[msg.sender][_questId] = true; // Mark as claimed
        quests[_questId].isActive = false;
        quests[_questId].claimedBy = msg.sender;
        emit RewardClaimed(msg.sender, _questId, quests[_questId].rewardAmount);
        emit AnswerSubmitted(msg.sender, _questId, true);
    }

    // Function for the admin to change the fee
    function setRevenueFee(uint256 newFee) external onlyOwner {
        revenueFees = newFee;
        emit RevenueFeeUpdated(newFee);
    }

    // Function to withdraw accumulated revenue (onlyOwner)
    function withdraw() public onlyOwner nonReentrant {
        uint256 amount = revenue;
        revenue = 0; // Reset revenue after withdrawal
        payable(msg.sender).transfer(amount);
    }

    // Get all quests with pagination (start, end)
    function getQuests(uint256 start, uint256 end)
        external
        view
        returns (Quest[] memory)
    {
        require(start < questCount, "Start index out of bounds");
        if (end > questCount) {
            end = questCount; // Clamp end to the total number of quests
        }

        require(start < end, "Invalid range");

        Quest[] memory result = new Quest[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = quests[i + 1]; // Offset by 1 because quest IDs are 1-based
        }
        return result;
    }

    // Get open (active) quests with pagination
    function getOpenQuests(uint256 start, uint256 end)
        external
        view
        returns (Quest[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= questCount; i++) {
            if (quests[i].isActive) {
                count++;
            }
        }

        require(start < count, "Start index out of bounds");
        if (end > count) {
            end = count; // Clamp end to the total number of active quests
        }

        require(start < end, "Invalid range");

        Quest[] memory result = new Quest[](end - start);
        uint256 index = 0;
        for (uint256 i = 1; i <= questCount; i++) {
            if (quests[i].isActive && index < end - start) {
                if (index >= start) {
                    result[index - start] = quests[i];
                }
                index++;
            }
        }

        return result;
    }

    // Get ended (inactive) quests with pagination
    function getEndedQuests(uint256 start, uint256 end)
        external
        view
        returns (Quest[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= questCount; i++) {
            if (!quests[i].isActive) {
                count++;
            }
        }

        require(start < count, "Start index out of bounds");
        if (end > count) {
            end = count; // Clamp end to the total number of inactive quests
        }

        require(start < end, "Invalid range");

        Quest[] memory result = new Quest[](end - start);
        uint256 index = 0;
        for (uint256 i = 1; i <= questCount; i++) {
            if (!quests[i].isActive && index < end - start) {
                if (index >= start) {
                    result[index - start] = quests[i];
                }
                index++;
            }
        }

        return result;
    }

    // Function to get the answer for a specific quest (only creator or user who submitted)
    function getQuest(uint256 _questId) external view returns (Quest memory) {
        return quests[_questId];
    }
    // Function to get the answer for a specific quest (only creator or user who submitted)
    function getAnswer(uint256 _questId) external view returns (bytes32) {
        return quests[_questId].answer;
    }

    //
    function renounceOwnership() public view override onlyOwner {
        revert("Renouncing ownership is disabled");
    }
}

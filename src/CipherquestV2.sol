// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Cipherquest
 * @author Victor_TheOracle
 * @notice A contract for creating and solving quiz-like quests with rewards
 * @dev Inherits ReentrancyGuard for protection against reentrancy attacks and Ownable for access control
 */
contract CipherquestV2 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    error Cipherquest__NotQuestCreator();
    error Cipherquest__ZeroAddress();
    error Cipherquest__TokenNotWhitelisted();
    error Cipherquest__InsufficientFunds();
    error Cipherquest__RewardMustBeGreaterThanZero();
    error Cipherquest__RequiredTokenNotWhitelisted();
    error Cipherquest__QuestInactive();
    error Cipherquest__AlreadyClaimed();
    error Cipherquest__ThirtyDaysNotPassed();
    error Cipherquest__CreatorCannotClaimReward();
    error Cipherquest__InsufficientRequiredTokenBalance();
    error Cipherquest__WrongAnswer();
    error Cipherquest__StartIndexOutOfBounds();
    error Cipherquest__InvalidRange();
    error Cipherquest__OwnershipRenounceDisabled();

    /**
     * @notice Structure defining a quest
     * @param questId Unique identifier for the quest
     * @param creator Address of the user who created the quest
     * @param question The question text for participants to solve
     * @param hint Optional hint provided for the question
     * @param answer Hashed correct answer to the question
     * @param rewardAmount Amount rewarded to the successful solver
     * @param isActive Boolean indicating if the quest is still active
     * @param rewardToken Address of the token used for reward (address(0) for native currency)
     * @param claimedBy Address of the user who successfully claimed the reward
     * @param createdAt Timestamp when the quest was created
     * @param requiredToken Token required to participate (address(0) if none)
     * @param requiredTokenAmount Minimum amount of tokens needed to participate
     */
    struct Quest {
        uint256 questId;
        address creator;
        string question;
        string hint;
        bytes32 answer;
        uint256 rewardAmount;
        bool isActive;
        address rewardToken;
        address claimedBy;
        uint256 createdAt;
        address requiredToken;
        uint256 requiredTokenAmount;
    }

    mapping(uint256 => Quest) public s_quests; // Mapping to store quests by an ID
    mapping(address => mapping(uint256 => bool)) public s_hasClaimed; // Track who has claimed for a specific quest
    mapping(address => bool) public s_tokenWhitelist;
    uint256 public s_questCount; // Count to assign unique IDs to quests
    uint256 public s_revenue; // Count to assign unique IDs to quests
    uint256 public s_revenueFees; // This can be updated by the admin

    event TokenWhitelisted(address indexed token);
    event TokenRemovedFromWhitelist(address indexed token);
    event QuestCancelled(uint256 indexed questId, address indexed cancelledBy);

     event QuestCreated(uint256 indexed questId, address indexed creator, string indexed question, uint256 rewardAmount, address requiredToken, uint256 requiredTokenAmount);
    event AnswerSubmitted(address indexed user, uint256 indexed questId, bool indexed isCorrect);
    event RewardClaimed(address indexed user, uint256 indexed questId, uint256 indexed amount);
    event RevenueFeeUpdated(uint256 indexed newFee);

    /**
     * @notice Modifier to restrict function access to the quest creator
     * @param _address Address to check
     * @param _questId ID of the quest
     */
    modifier onlyCreator(address _address, uint256 _questId) {
        if (_address != s_quests[_questId].creator) {
            revert Cipherquest__NotQuestCreator();
        }
        _;
    }

    /**
     * @notice Contract constructor
     * @dev Sets initial revenue fees and ownership
     * @param _revenueFees Initial fee charged for creating quests
     */
    constructor(uint256 _revenueFees) Ownable(msg.sender) {
        s_revenueFees = _revenueFees;
    }

    /**
     * @notice Adds a token to the whitelist of accepted tokens
     * @dev Only callable by the contract owner
     * @param token Address of the token to whitelist
     */
    function addTokenToWhitelist(address token) external onlyOwner {
        if (token == address(0)) {
            revert Cipherquest__ZeroAddress();
        }
        s_tokenWhitelist[token] = true;
        emit TokenWhitelisted(token);
    }

    /**
     * @notice Removes a token from the whitelist
     * @dev Only callable by the contract owner
     * @param token Address of the token to remove from whitelist
     */
    function removeTokenFromWhitelist(address token) external onlyOwner {
        if (!s_tokenWhitelist[token]) {
            revert Cipherquest__TokenNotWhitelisted();
        }
        s_tokenWhitelist[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }

    /**
     * @notice Creates a new quest with a reward
     * @dev Requires payment of platform fee in native currency (ETH)
     * @param _question The question for participants to solve
     * @param _hint Optional hint for the question
     * @param _answer Hashed correct answer to the question
     * @param _rewardAmount Amount to reward the successful solver
     * @param _rewardToken Address of the token used for reward (address(0) for native currency)
     * @param _requiredToken Token required to participate (address(0) if none)
     * @param _requiredTokenAmount Minimum amount of tokens needed to participate
     */
    function createQuest(
        string memory _question,
        string memory _hint,
        bytes32 _answer,
        uint256 _rewardAmount,
        address _rewardToken,
        address _requiredToken,
        uint256 _requiredTokenAmount
    ) external payable {
        if (msg.value < s_revenueFees) {
            revert Cipherquest__InsufficientFunds();
        }
        uint256 _main_RewardAmount;

        // If it's an ERC20 token, transfer it from the sender to this contract
        if (_rewardToken != address(0)) {
            if (!s_tokenWhitelist[_rewardToken]) {
                revert Cipherquest__TokenNotWhitelisted();
            }
            if (_rewardAmount <= 0) {
                revert Cipherquest__RewardMustBeGreaterThanZero();
            }
            IERC20(_rewardToken).safeTransferFrom(msg.sender, address(this), _rewardAmount);
            _main_RewardAmount = _rewardAmount; // Set the reward amount for tokens
        } else {
            _main_RewardAmount = msg.value - s_revenueFees;
        }

        // Validate the required token and amount if specified
        if (_requiredToken != address(0)) {
            if (!s_tokenWhitelist[_requiredToken]) {
                revert Cipherquest__RequiredTokenNotWhitelisted();
            }
        }

        s_revenue += s_revenueFees;
        s_questCount++; // Increment the quest ID
        s_quests[s_questCount] = Quest({
            questId: s_questCount,
            creator: msg.sender,
            question: _question,
            answer: _answer,
            hint: _hint,
            rewardAmount: _main_RewardAmount,
            isActive: true,
            rewardToken: _rewardToken,
            claimedBy: address(0),
            createdAt: block.timestamp,
            requiredToken: _requiredToken,
            requiredTokenAmount: _requiredTokenAmount
        });

        emit QuestCreated(s_questCount, msg.sender, _question, _main_RewardAmount, _requiredToken, _requiredTokenAmount);
    }

    /**
     * @notice Allows quest creator to cancel their quest after 30 days
     * @dev Only the original creator can cancel after 30 days and if no one has claimed
     * @param questId The ID of the quest to cancel
     */
    function cancelQuest(uint256 questId) external nonReentrant onlyCreator(msg.sender, questId) {
        Quest storage quest = s_quests[questId];
        if (!quest.isActive) {
            revert Cipherquest__QuestInactive();
        }
        if (quest.claimedBy != address(0)) {
            revert Cipherquest__AlreadyClaimed();
        }
        if (block.timestamp < quest.createdAt + 30 days) {
            revert Cipherquest__ThirtyDaysNotPassed();
        }

        quest.isActive = false;

        if (quest.rewardToken == address(0)) {
            payable(msg.sender).transfer(quest.rewardAmount);
        } else {
            // SafeERC20 call
            IERC20(quest.rewardToken).safeTransfer(msg.sender, quest.rewardAmount);
        }

        emit QuestCancelled(questId, msg.sender);
    }

    /**
     * @notice Submit an answer to a quest and claim reward if correct
     * @dev Verifies token requirements and transfers reward if answer is correct
     * @param _questId ID of the quest being answered
     * @param _answer The submitted answer (must match the stored answer hash)
     */
    function submitAnswer(uint256 _questId, bytes32 _answer) external payable nonReentrant {
        Quest storage quest = s_quests[_questId];

        if (msg.sender == quest.creator) {
            revert Cipherquest__CreatorCannotClaimReward();
        }
        if (!quest.isActive) {
            revert Cipherquest__QuestInactive();
        }

        // Check if the user meets the token requirement
        if (quest.requiredToken != address(0) && quest.requiredTokenAmount > 0) {
            uint256 userBalance = IERC20(quest.requiredToken).balanceOf(msg.sender);
            if (userBalance < quest.requiredTokenAmount) {
                revert Cipherquest__InsufficientRequiredTokenBalance();
            }
        }

        if (_answer != quest.answer) {
            revert Cipherquest__WrongAnswer();
        }

        quest.isActive = false;
        quest.claimedBy = msg.sender;
        s_hasClaimed[msg.sender][_questId] = true;

        // Transfer reward
        if (quest.rewardToken == address(0)) {
            payable(msg.sender).transfer(quest.rewardAmount);
        } else {
            IERC20(quest.rewardToken).safeTransfer(msg.sender, quest.rewardAmount);
        }

        emit RewardClaimed(msg.sender, _questId, quest.rewardAmount);
        emit AnswerSubmitted(msg.sender, _questId, true);
    }

    /**
     * @notice Updates the platform fee for creating quests
     * @dev Only callable by contract owner
     * @param newFee New fee amount in native currency
     */
    function setRevenueFee(uint256 newFee) external onlyOwner {
        s_revenueFees = newFee;
        emit RevenueFeeUpdated(newFee);
    }

    /**
     * @notice Allows owner to withdraw accumulated platform fees
     * @dev Only callable by contract owner, protected against reentrancy
     */
    function withdraw() external nonReentrant onlyOwner {
        uint256 amount = s_revenue;
        s_revenue = 0; // Reset revenue after withdrawal
        payable(msg.sender).transfer(amount);
    }

    /**
     * @notice Retrieves a paginated list of all quests
     * @dev Returns quests within the specified range
     * @param start Starting index for pagination (0-based)
     * @param end Ending index for pagination (exclusive)
     * @return Array of Quest structs within the requested range
     */
    function getQuests(uint256 start, uint256 end) external view returns (Quest[] memory) {
        if (start >= s_questCount) {
            revert Cipherquest__StartIndexOutOfBounds();
        }
        if (end > s_questCount) {
            end = s_questCount; // Clamp end to the total number of quests
        }

        if (start >= end) {
            revert Cipherquest__InvalidRange();
        }

        Quest[] memory result = new Quest[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = s_quests[i + 1]; // Offset by 1 because quest IDs are 1-based
        }
        return result;
    }

    /**
     * @notice Retrieves a paginated list of active quests
     * @dev Returns only quests with isActive set to true
     * @param start Starting index for pagination (0-based)
     * @param end Ending index for pagination (exclusive)
     * @return Array of active Quest structs within the requested range
     */
    function getOpenQuests(uint256 start, uint256 end) external view returns (Quest[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= s_questCount; i++) {
            if (s_quests[i].isActive) {
                count++;
            }
        }

        if (start >= count) {
            revert Cipherquest__StartIndexOutOfBounds();
        }
        if (end > count) {
            end = count; // Clamp end to the total number of active quests
        }

        if (start >= end) {
            revert Cipherquest__InvalidRange();
        }

        Quest[] memory result = new Quest[](end - start);
        uint256 index = 0;
        for (uint256 i = 1; i <= s_questCount; i++) {
            if (s_quests[i].isActive && index < end - start) {
                if (index >= start) {
                    result[index - start] = s_quests[i];
                }
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Retrieves a paginated list of ended/inactive quests
     * @dev Returns only quests with isActive set to false
     * @param start Starting index for pagination (0-based)
     * @param end Ending index for pagination (exclusive)
     * @return Array of inactive Quest structs within the requested range
     */
    function getEndedQuests(uint256 start, uint256 end) external view returns (Quest[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= s_questCount; i++) {
            if (!s_quests[i].isActive) {
                count++;
            }
        }

        if (start >= count) {
            revert Cipherquest__StartIndexOutOfBounds();
        }
        if (end > count) {
            end = count; // Clamp end to the total number of inactive quests
        }

        if (start >= end) {
            revert Cipherquest__InvalidRange();
        }

        Quest[] memory result = new Quest[](end - start);
        uint256 index = 0;
        for (uint256 i = 1; i <= s_questCount; i++) {
            if (!s_quests[i].isActive && index < end - start) {
                if (index >= start) {
                    result[index - start] = s_quests[i];
                }
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Retrieves details of a specific quest
     * @param _questId ID of the quest to retrieve
     * @return Quest struct containing all quest details
     */
    function getQuest(uint256 _questId) external view returns (Quest memory) {
        return s_quests[_questId];
    }

    /**
     * @notice Allows quest creator to retrieve the correct answer
     * @dev Only accessible by the quest creator
     * @param _questId ID of the quest
     * @return bytes32 The correct answer hash
     */
    function getAnswer(uint256 _questId) external view onlyCreator(msg.sender, _questId) returns (bytes32) {
        return s_quests[_questId].answer;
    }

    /**
     * @notice Overrides the renounceOwnership function to prevent ownership removal
     * @dev Always reverts to prevent renouncing ownership
     */
    function renounceOwnership() public view override onlyOwner {
        revert Cipherquest__OwnershipRenounceDisabled();
    }

    /**
     * @notice Fallback function to receive ETH payments
     * @dev All received ETH is added to the revenue
     */
    receive() external payable {
        s_revenue += msg.value;
    }
}

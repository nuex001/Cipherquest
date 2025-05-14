// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/Cipherquest.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev A simple ERC20 for testing
contract DummyToken is ERC20 {
    constructor() ERC20("Dummy", "DUM") {
        _mint(msg.sender, 1e24);
    }
}

contract CipherquestTest is Test {
    Cipherquest quest;
    DummyToken token;
    address alice = address(0xA1);
    address bob = address(0xB0);
    address carol = address(0xC0);

    uint256 constant FEE = 1 ether;
    bytes32 constant ANSWER = keccak256("42");

    function setUp() public {
        quest = new Cipherquest(FEE);
        token = new DummyToken();

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);

        token.transfer(bob, 1000 ether);
    }

    /// @notice Test whitelist management and events
    function testWhitelist() public {
        vm.expectRevert();
        vm.prank(alice);
        quest.addTokenToWhitelist(address(token));

        vm.startPrank(address(this));

        quest.addTokenToWhitelist(address(token));
        assertTrue(quest.tokenWhitelist(address(token)));

        vm.expectRevert();
        quest.removeTokenFromWhitelist(address(0x123));

        quest.removeTokenFromWhitelist(address(token));
        vm.stopPrank();
        assertFalse(quest.tokenWhitelist(address(token)));
    }

    /// @notice Test creating & fetching ETH-backed quests
    function testCreateQuestEth() public {
        vm.prank(alice);
        quest.createQuest{value: 6 ether}("Q?", "H", ANSWER, 0, address(0));

        // State checks
        (Cipherquest.Quest memory q) = quest.getQuests(0, 1)[0];
        assertEq(q.questId, 1);
        assertEq(q.creator, alice);
        assertEq(q.question, "Q?");
        assertEq(q.hint, "H");
        assertEq(q.answer, ANSWER);
        assertEq(q.rewardAmount, 5 ether);
        assertTrue(q.isActive);
        assertEq(q.rewardToken, address(0));
        assertEq(q.claimedBy, address(0));
        assertEq(quest.revenue(), FEE);
        assertEq(quest.questCount(), 1);

        vm.expectRevert("Start index out of bounds");
        quest.getQuests(1, 2);
    }

    /// @notice Test creating & fetching ERC20-backed quests and fee accounting
    function testCreateQuestToken() public {
        // whitelist token
        quest.addTokenToWhitelist(address(token));
        // approve, then create
        vm.prank(bob);
        token.approve(address(quest), 100 ether);

        vm.prank(bob);
        quest.createQuest{value: FEE}("TQ?", "TH", ANSWER, 100 ether, address(token));

        // Check token balance in contract
        assertEq(token.balanceOf(address(quest)), 100 ether);
        // revenue unchanged in token path except fee
        assertEq(quest.revenue(), FEE);

        // quest storage
        Cipherquest.Quest memory q = quest.getQuests(0, 1)[0];
        assertEq(q.rewardToken, address(token));
        assertEq(q.rewardAmount, 100 ether);
    }

    /// @notice Test submitAnswer happy & sad paths
    function testSubmitAnswer() public {
        // create ETH quest
        vm.prank(alice);
        quest.createQuest{value: 2 ether}("S?", "H", ANSWER, 0, address(0));

        // creator cannot claim
        vm.prank(alice);
        vm.expectRevert("Creator cannot claim the reward");
        quest.submitAnswer(1, ANSWER);

        // wrong answer
        vm.prank(bob);
        vm.expectRevert("Wrong answer");
        quest.submitAnswer(1, keccak256("nope"));

        // correct claim
        vm.prank(bob);
        uint256 bobBal = bob.balance;
        quest.submitAnswer{value: 0}(1, ANSWER);
        assertEq(bob.balance, bobBal + 1 ether);

        // double claim prevented by isActive
        vm.prank(carol);
        vm.expectRevert("Quest is not active");
        quest.submitAnswer(1, ANSWER);
    }

    /// @notice Test pagination helpers getOpenQuests & getEndedQuests
    function testPagination() public {
        // create 3 quests: 1 active, 2 will be claimed/cancelled
        vm.prank(alice);
        quest.createQuest{value: 2 ether}("P1", "H", ANSWER, 0, address(0));
        vm.prank(bob);
        quest.createQuest{value: 2 ether}("P2", "H", ANSWER, 0, address(0));

        // claim #1
        vm.prank(bob);
        quest.submitAnswer(1, ANSWER);
        // cancel #2

        vm.warp(block.timestamp + 31 days);

        vm.prank(bob);
        quest.cancelQuest(2);

        // only quest #3 active
        vm.prank(carol);
        quest.createQuest{value: 2 ether}("P3", "H", ANSWER, 0, address(0));

        // getOpenQuests should return only ID 3
        Cipherquest.Quest[] memory open = quest.getOpenQuests(0, 1);
        assertEq(open.length, 1);
        assertEq(open[0].questId, 3);

        // getEndedQuests should return IDs [1,2]
        Cipherquest.Quest[] memory ended = quest.getEndedQuests(0, 2);
        assertEq(ended.length, 2);
        assertEq(ended[0].questId, 1);
        assertEq(ended[1].questId, 2);
    }

    /// @notice Test cancelQuest reverts if called before 30 days
    function testCancelQuestBefore30DaysReverts() public {
        // Alice creates an ETH quest
        vm.prank(alice);
        quest.createQuest{value: 2 ether}("Q?", "H", ANSWER, 0, address(0));

        // Attempt to cancel immediately
        vm.prank(alice);
        vm.expectRevert("30 days not passed");
        quest.cancelQuest(1);
    }

    /// @notice Test cancelQuest succeeds after 30 days and refunds ETH
    function testCancelQuestAfter30DaysSucceeds() public {
        // Alice creates an ETH quest
        vm.prank(alice);
        uint256 initialBalance = alice.balance;
        console.log("initial balance: ", initialBalance);
        quest.createQuest{value: 2 ether}("Q?", "H", ANSWER, 0, address(0));

        uint256 balanceAfterCreation = alice.balance;
        console.log("initial balance: ", balanceAfterCreation);

        // Fast-forward 30 days + 1 second
        vm.warp(block.timestamp + 30 days + 1);

        // Cancel quest
        vm.prank(alice);
        quest.cancelQuest(1);

        uint256 balanceAfterCancelling = alice.balance;
        console.log("initial balance: ", balanceAfterCancelling);

        // Verify quest is inactive
        Cipherquest.Quest memory q = quest.getQuest(1);
        assertFalse(q.isActive);

        // Check ETH refund (2 ether sent - 1 ether fee, 1 ether reward returned)
        assertEq(alice.balance, initialBalance - 1 ether);
    }

    /// @notice Test ERC20 quest cancellation after 30 days
    function testCancelQuestERC20After30Days() public {
        // Whitelist token
        quest.addTokenToWhitelist(address(token));

        uint256 initialBalance = token.balanceOf(bob);
        // Bob creates an ERC20 quest
        vm.startPrank(bob);
        token.approve(address(quest), 100 ether);
        quest.createQuest{value: FEE}("TQ?", "TH", ANSWER, 100 ether, address(token));
        vm.stopPrank();

        // Fast-forward time
        vm.warp(block.timestamp + 30 days + 1);

        // Cancel quest
        vm.prank(bob);
        quest.cancelQuest(1);

        // Verify ERC20 refund
        assertEq(token.balanceOf(bob), initialBalance);
        assertEq(token.balanceOf(address(quest)), 0);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/AgenticWallet.sol";
import "../src/StrategyExecutor.sol";

/// @title AgenticWalletTest - Test suite for AgenticWallet
contract AgenticWalletTest is Test {
    // ═══════════════════════════════════════════════════════════════
    //                          STATE
    // ═══════════════════════════════════════════════════════════════

    AgenticWallet public wallet;
    StrategyExecutor public executor;

    address public owner = address(0x1);
    address public agent = address(0x2);
    address public stranger = address(0x3);

    // Mock ERC-8004 registry addresses
    address public mockIdentityRegistry = address(0x8004);
    address public mockReputationRegistry = address(0x8005);

    uint256 public agentId = 1;

    // ═══════════════════════════════════════════════════════════════
    //                        SETUP
    // ═══════════════════════════════════════════════════════════════

    function setUp() public {
        // Deploy StrategyExecutor
        executor = new StrategyExecutor(address(0)); // placeholder

        // Deploy AgenticWallet
        wallet = new AgenticWallet(
            owner,
            agentId,
            mockIdentityRegistry,
            mockReputationRegistry
        );

        // Fund wallet
        vm.deal(address(wallet), 10 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    //                        TESTS
    // ═══════════════════════════════════════════════════════════════

    function test_InitialState() public view {
        assertEq(wallet.owner(), owner);
        assertEq(wallet.agentId(), agentId);
        assertEq(wallet.activeStrategy(), bytes32(0));
        assertEq(wallet.getBalance(), 10 ether);
    }

    function test_Execute_AsOwner() public {
        // Owner can execute
        vm.prank(owner);
        (bool success, ) = wallet.execute(address(0x1), "", 0);
        assertTrue(success);
    }

    function test_Execute_AsStranger_Reverts() public {
        // Stranger cannot execute
        vm.prank(stranger);
        vm.expectRevert(AgenticWallet.NotOwner.selector);
        wallet.execute(address(0x1), "", 0);
    }

    function test_BatchExecute() public {
        address[] memory targets = new address[](2);
        targets[0] = address(0x1);
        targets[1] = address(0x2);

        bytes[] memory datas = new bytes[](2);
        datas[0] = "";
        datas[1] = "";

        uint256[] memory values = new uint256[](2);
        values[0] = 0;
        values[1] = 0;

        vm.prank(owner);
        (bool[] memory successes, ) = wallet.batchExecute(targets, datas, values);
        assertTrue(successes[0]);
        assertTrue(successes[1]);
    }

    function test_SetStrategy() public {
        bytes32 strategyId = keccak256("test-strategy");

        // Register strategy first
        vm.prank(owner);
        wallet.registerStrategy(strategyId, address(executor));

        // Set strategy
        vm.prank(owner);
        wallet.setStrategy(strategyId);

        assertEq(wallet.activeStrategy(), strategyId);
    }

    function test_SetStrategy_NotRegistered_Reverts() public {
        bytes32 strategyId = keccak256("nonexistent");

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(AgenticWallet.StrategyNotRegistered.selector, strategyId)
        );
        wallet.setStrategy(strategyId);
    }

    function test_Withdraw() public {
        vm.prank(owner);
        wallet.withdraw(owner, 1 ether);

        assertEq(wallet.getBalance(), 9 ether);
    }

    function test_Withdraw_NotOwner_Reverts() public {
        vm.prank(stranger);
        vm.expectRevert(AgenticWallet.NotOwner.selector);
        wallet.withdraw(stranger, 1 ether);
    }

    function test_TransferOwnership() public {
        vm.prank(owner);
        wallet.transferOwnership(agent);

        assertEq(wallet.owner(), agent);
    }

    function test_TransferOwnership_NotOwner_Reverts() public {
        vm.prank(stranger);
        vm.expectRevert(AgenticWallet.NotOwner.selector);
        wallet.transferOwnership(stranger);
    }

    function test_Deposit() public {
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        (bool success, ) = address(wallet).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(wallet.getBalance(), 11 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     FUZZ TESTS
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_Withdraw(uint256 amount) public {
        amount = bound(amount, 1, 10 ether);

        vm.prank(owner);
        wallet.withdraw(owner, amount);

        assertEq(wallet.getBalance(), 10 ether - amount);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     INVARIANTS
    // ═══════════════════════════════════════════════════════════════

    function invariant_OwnerCannotBeZero() public view {
        assertTrue(wallet.owner() != address(0));
    }

    function invariant_BalanceConsistency() public view {
        assertEq(address(wallet).balance, wallet.getBalance());
    }
}

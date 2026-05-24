// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/AgenticWallet.sol";

contract AgenticWalletTest is Test {
    AgenticWallet public wallet;
    address public owner;
    address public identityRegistry;

    function setUp() public {
        owner = address(this);
        identityRegistry = 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432;
        wallet = new AgenticWallet(owner, identityRegistry);
    }

    function testDeployment() public view {
        assertEq(wallet.owner(), owner);
        assertEq(wallet.identityRegistry(), identityRegistry);
    }

    function testDeposit() public {
        vm.deal(address(this), 1 ether);
        (bool success,) = address(wallet).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(wallet.getBalance(), 1 ether);
    }

    function testWithdraw() public {
        vm.deal(address(this), 1 ether);
        address(wallet).call{value: 1 ether}("");
        
        address recipient = address(0x123);
        wallet.withdraw(recipient, 0.5 ether);
        assertEq(recipient.balance, 0.5 ether);
    }

    function testGetPnL() public view {
        assertEq(wallet.getPnL(), 0);
    }
}

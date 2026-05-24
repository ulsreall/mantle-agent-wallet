// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title StrategyExecutor - Placeholder for strategy execution
/// @notice Will be implemented with DEX integrations
contract StrategyExecutor {
    error InvalidAddress();
    
    address public wallet;
    
    constructor(address _wallet) {
        if (_wallet == address(0)) revert InvalidAddress();
        wallet = _wallet;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IAgenticWallet - Agentic Wallet Interface
/// @notice Core interface for the agentic wallet system
interface IAgenticWallet {
    /// @notice Execute a single action
    /// @param target Contract address to call
    /// @param data Encoded call data
    /// @param value ETH value to send
    /// @return success Whether the call succeeded
    /// @return result The return data
    function execute(
        address target,
        bytes calldata data,
        uint256 value
    ) external returns (bool success, bytes memory result);

    /// @notice Execute multiple actions in a single transaction
    /// @param targets Array of contract addresses
    /// @param datas Array of encoded call data
    /// @param values Array of ETH values
    /// @return successes Array of success flags
    /// @return results Array of return data
    function batchExecute(
        address[] calldata targets,
        bytes[] calldata datas,
        uint256[] calldata values
    ) external returns (bool[] memory successes, bytes[] memory results);

    /// @notice Set the active strategy
    /// @param strategyId The strategy identifier
    function setStrategy(bytes32 strategyId) external;

    /// @notice Get the agent's ERC-8004 token ID
    /// @return tokenId The agent's token ID
    function agentId() external view returns (uint256 tokenId);

    /// @notice Get the agent's owner
    /// @return owner The agent's owner address
    function owner() external view returns (address);

    /// @notice Get the active strategy
    /// @return strategyId The active strategy identifier
    function activeStrategy() external view returns (bytes32 strategyId);

    /// @notice Get the agent's balance
    /// @return balance The agent's ETH balance
    function getBalance() external view returns (uint256 balance);

    /// @notice Withdraw funds from the wallet
    /// @param to Destination address
    /// @param amount Amount to withdraw
    function withdraw(address to, uint256 amount) external;

    /// @notice Event emitted when an action is executed
    event ActionExecuted(
        address indexed target,
        bytes data,
        uint256 value,
        bool success,
        bytes result
    );

    /// @notice Event emitted when strategy is changed
    event StrategyChanged(bytes32 oldStrategy, bytes32 newStrategy);

    /// @notice Event emitted when funds are deposited
    event Deposited(address indexed from, uint256 amount);

    /// @notice Event emitted when funds are withdrawn
    event Withdrawn(address indexed to, uint256 amount);
}

/// @title IStrategyExecutor - Strategy Executor Interface
interface IStrategyExecutor {
    /// @notice Execute a swap on a DEX
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input token
    /// @param minAmountOut Minimum output amount
    /// @param dex DEX identifier (0=MerchantMoe, 1=Agni, 2=Fluxion)
    /// @return amountOut Actual output amount
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint8 dex
    ) external returns (uint256 amountOut);

    /// @notice Add liquidity to a DEX pool
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param amountA Amount of first token
    /// @param amountB Amount of second token
    /// @param dex DEX identifier
    /// @return liquidity Amount of LP tokens received
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint8 dex
    ) external returns (uint256 liquidity);

    /// @notice Harvest rewards from a yield farm
    /// @param farm Farm contract address
    /// @param rewardToken Reward token address
    /// @return amount Amount of rewards harvested
    function harvest(
        address farm,
        address rewardToken
    ) external returns (uint256 amount);

    /// @notice Get the best swap route across DEXes
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input token
    /// @return bestDex The DEX with the best rate
    /// @return bestAmount The expected output amount
    function getBestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint8 bestDex, uint256 bestAmount);
}

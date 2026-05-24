// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IAgenticWallet.sol";
import "./interfaces/IERC8004.sol";

/// @title AgenticWallet - Autonomous Agent Wallet
/// @notice Smart contract wallet for AI agents on Mantle Network
/// @dev Implements ERC-8004 identity and autonomous execution
contract AgenticWallet is IAgenticWallet {
    // ═══════════════════════════════════════════════════════════════
    //                          STATE
    // ═══════════════════════════════════════════════════════════════

    /// @notice The agent's owner
    address public override owner;

    /// @notice The agent's ERC-8004 token ID
    uint256 public override agentId;

    /// @notice The active strategy identifier
    bytes32 public override activeStrategy;

    /// @notice The ERC-8004 identity registry
    IERC8004 public immutable identityRegistry;

    /// @notice The ERC-8004 reputation registry
    IERC8004Reputation public immutable reputationRegistry;

    /// @notice Whether a strategy is registered
    mapping(bytes32 => bool) public registeredStrategies;

    /// @notice Strategy executor contracts
    mapping(bytes32 => address) public strategyExecutors;

    /// @notice Nonce for replay protection
    uint256 public nonce;

    // ═══════════════════════════════════════════════════════════════
    //                          ERRORS
    // ═══════════════════════════════════════════════════════════════

    error NotOwner();
    error NotAuthorized();
    error ExecutionFailed(address target, bytes data);
    error InsufficientBalance(uint256 required, uint256 available);
    error StrategyNotRegistered(bytes32 strategyId);
    error InvalidAddress();
    error InvalidAmount();

    // ═══════════════════════════════════════════════════════════════
    //                          MODIFIERS
    // ═══════════════════════════════════════════════════════════════

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorized() {
        // Allow owner or strategy executor to call
        if (msg.sender != owner) {
            if (activeStrategy == bytes32(0)) revert NotAuthorized();
            address executor = strategyExecutors[activeStrategy];
            if (executor == address(0) || msg.sender != executor) {
                revert NotAuthorized();
            }
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════════
    //                        CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    /// @notice Create a new AgenticWallet
    /// @param _owner The wallet owner address
    /// @param _agentId The ERC-8004 agent token ID
    /// @param _identityRegistry The ERC-8004 identity registry address
    /// @param _reputationRegistry The ERC-8004 reputation registry address
    constructor(
        address _owner,
        uint256 _agentId,
        address _identityRegistry,
        address _reputationRegistry
    ) {
        if (_owner == address(0)) revert InvalidAddress();
        if (_identityRegistry == address(0)) revert InvalidAddress();
        if (_reputationRegistry == address(0)) revert InvalidAddress();

        owner = _owner;
        agentId = _agentId;
        identityRegistry = IERC8004(_identityRegistry);
        reputationRegistry = IERC8004Reputation(_reputationRegistry);
    }

    // ═══════════════════════════════════════════════════════════════
    //                        RECEIVE
    // ═══════════════════════════════════════════════════════════════

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     EXECUTION
    // ═══════════════════════════════════════════════════════════════

    /// @inheritdoc IAgenticWallet
    function execute(
        address target,
        bytes calldata data,
        uint256 value
    ) external override onlyAuthorized returns (bool success, bytes memory result) {
        if (target == address(0)) revert InvalidAddress();
        if (value > address(this).balance) {
            revert InsufficientBalance(value, address(this).balance);
        }

        (success, result) = target.call{value: value}(data);

        emit ActionExecuted(target, data, value, success, result);

        if (!success) {
            // Emit the error but don't revert - let caller decide
            // This allows batch execution to continue
        }

        nonce++;
    }

    /// @inheritdoc IAgenticWallet
    function batchExecute(
        address[] calldata targets,
        bytes[] calldata datas,
        uint256[] calldata values
    ) external override onlyAuthorized returns (bool[] memory successes, bytes[] memory results) {
        uint256 length = targets.length;
        if (length != datas.length || length != values.length) {
            revert InvalidAmount();
        }

        successes = new bool[](length);
        results = new bytes[](length);

        for (uint256 i = 0; i < length; i++) {
            if (targets[i] == address(0)) revert InvalidAddress();
            if (values[i] > address(this).balance) {
                revert InsufficientBalance(values[i], address(this).balance);
            }

            (successes[i], results[i]) = targets[i].call{value: values[i]}(datas[i]);

            emit ActionExecuted(targets[i], datas[i], values[i], successes[i], results[i]);
        }

        nonce++;
    }

    // ═══════════════════════════════════════════════════════════════
    //                     STRATEGY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /// @notice Register a new strategy
    /// @param strategyId The strategy identifier
    /// @param executor The strategy executor contract address
    function registerStrategy(bytes32 strategyId, address executor) external onlyOwner {
        if (executor == address(0)) revert InvalidAddress();
        registeredStrategies[strategyId] = true;
        strategyExecutors[strategyId] = executor;
    }

    /// @notice Remove a strategy
    /// @param strategyId The strategy identifier
    function removeStrategy(bytes32 strategyId) external onlyOwner {
        registeredStrategies[strategyId] = false;
        strategyExecutors[strategyId] = address(0);
    }

    /// @inheritdoc IAgenticWallet
    function setStrategy(bytes32 strategyId) external override onlyOwner {
        if (strategyId != bytes32(0) && !registeredStrategies[strategyId]) {
            revert StrategyNotRegistered(strategyId);
        }

        bytes32 oldStrategy = activeStrategy;
        activeStrategy = strategyId;

        emit StrategyChanged(oldStrategy, strategyId);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     BALANCE & WITHDRAWAL
    // ═══════════════════════════════════════════════════════════════

    /// @inheritdoc IAgenticWallet
    function getBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    /// @inheritdoc IAgenticWallet
    function withdraw(address to, uint256 amount) external override onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (amount > address(this).balance) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(to, amount);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     OWNERSHIP
    // ═══════════════════════════════════════════════════════════════

    /// @notice Transfer ownership of the wallet
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}

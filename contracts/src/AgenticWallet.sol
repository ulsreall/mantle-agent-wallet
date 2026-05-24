// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title AgenticWallet - Autonomous Agent Wallet for Mantle
/// @notice Smart contract wallet for AI agents with ERC-8004 identity
/// @dev Implements autonomous execution, strategy management, and compound logic
contract AgenticWallet {
    // ═══════════════════════════════════════════════════════════════
    //                          STATE
    // ═══════════════════════════════════════════════════════════════

    /// @notice The agent's owner
    address public owner;

    /// @notice The agent's ERC-8004 token ID
    uint256 public agentId;

    /// @notice The active strategy identifier
    bytes32 public activeStrategy;

    /// @notice The ERC-8004 identity registry
    address public identityRegistry;

    /// @notice Whether a strategy is registered
    mapping(bytes32 => bool) public registeredStrategies;

    /// @notice Strategy executor contracts
    mapping(bytes32 => address) public strategyExecutors;

    /// @notice Nonce for replay protection
    uint256 public nonce;

    /// @notice Total profit generated
    int256 public totalProfit;

    /// @notice Starting balance for P&L tracking
    uint256 public startingBalance;

    // ═══════════════════════════════════════════════════════════════
    //                          EVENTS
    // ═══════════════════════════════════════════════════════════════

    event ActionExecuted(address indexed target, bytes data, uint256 value, bool success, bytes result);
    event StrategyChanged(bytes32 oldStrategy, bytes32 newStrategy);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event ProfitRecorded(int256 profit, uint256 newBalance);

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
    /// @param _identityRegistry The ERC-8004 identity registry address
    constructor(address _owner, address _identityRegistry) {
        if (_owner == address(0)) revert InvalidAddress();
        if (_identityRegistry == address(0)) revert InvalidAddress();

        owner = _owner;
        identityRegistry = _identityRegistry;
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

    /// @notice Execute a single action
    function execute(
        address target,
        bytes calldata data,
        uint256 value
    ) external onlyAuthorized returns (bool success, bytes memory result) {
        if (target == address(0)) revert InvalidAddress();
        if (value > address(this).balance) {
            revert InsufficientBalance(value, address(this).balance);
        }

        (success, result) = target.call{value: value}(data);
        emit ActionExecuted(target, data, value, success, result);
        nonce++;
    }

    /// @notice Execute multiple actions in a single transaction
    function batchExecute(
        address[] calldata targets,
        bytes[] calldata datas,
        uint256[] calldata values
    ) external onlyAuthorized returns (bool[] memory successes, bytes[] memory results) {
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
    function registerStrategy(bytes32 strategyId, address executor) external onlyOwner {
        if (executor == address(0)) revert InvalidAddress();
        registeredStrategies[strategyId] = true;
        strategyExecutors[strategyId] = executor;
    }

    /// @notice Remove a strategy
    function removeStrategy(bytes32 strategyId) external onlyOwner {
        registeredStrategies[strategyId] = false;
        strategyExecutors[strategyId] = address(0);
    }

    /// @notice Set the active strategy
    function setStrategy(bytes32 strategyId) external onlyOwner {
        if (strategyId != bytes32(0) && !registeredStrategies[strategyId]) {
            revert StrategyNotRegistered(strategyId);
        }

        bytes32 oldStrategy = activeStrategy;
        activeStrategy = strategyId;
        emit StrategyChanged(oldStrategy, strategyId);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     BALANCE & P&L
    // ═══════════════════════════════════════════════════════════════

    /// @notice Get the wallet balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get current P&L
    function getPnL() external view returns (int256) {
        return int256(address(this).balance) - int256(startingBalance);
    }

    /// @notice Record profit after a successful trade
    function recordProfit(int256 profit) external onlyAuthorized {
        totalProfit += profit;
        emit ProfitRecorded(profit, address(this).balance);
    }

    // ═══════════════════════════════════════════════════════════════
    //                     WITHDRAWAL
    // ═══════════════════════════════════════════════════════════════

    /// @notice Withdraw funds from the wallet
    function withdraw(address to, uint256 amount) external onlyOwner {
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
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }

    /// @notice Set the ERC-8004 agent ID
    function setAgentId(uint256 _agentId) external onlyOwner {
        agentId = _agentId;
    }
}

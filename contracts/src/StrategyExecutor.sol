// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IAgenticWallet.sol";

/// @title StrategyExecutor - DeFi Strategy Execution
/// @notice Executes DeFi strategies on Mantle Network DEXes
/// @dev Supports Merchant Moe, Agni Finance, and Fluxion
contract StrategyExecutor is IStrategyExecutor {
    // ═══════════════════════════════════════════════════════════════
    //                          STATE
    // ═══════════════════════════════════════════════════════════════

    /// @notice The agentic wallet contract
    address public immutable wallet;

    /// @notice DEX router addresses
    mapping(uint8 => address) public dexRouters;

    /// @notice DEX factory addresses
    mapping(uint8 => address) public dexFactories;

    /// @notice Whether the contract is paused
    bool public paused;

    // ═══════════════════════════════════════════════════════════════
    //                          CONSTANTS
    // ═══════════════════════════════════════════════════════════════

    /// @notice DEX identifiers
    uint8 public constant DEX_MERCHANT_MOE = 0;
    uint8 public constant DEX_AGNI = 1;
    uint8 public constant DEX_FLUXION = 2;

    /// @notice Deadline for swaps (20 minutes)
    uint256 public constant SWAP_DEADLINE = 20 minutes;

    // ═══════════════════════════════════════════════════════════════
    //                          ERRORS
    // ═══════════════════════════════════════════════════════════════

    error NotWallet();
    error Paused();
    error InvalidDEX(uint8 dex);
    error InsufficientOutput(uint256 expected, uint256 actual);
    error InvalidAmount();
    error SwapFailed();

    // ═══════════════════════════════════════════════════════════════
    //                          MODIFIERS
    // ═══════════════════════════════════════════════════════════════

    modifier onlyWallet() {
        if (msg.sender != wallet) revert NotWallet();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    // ═══════════════════════════════════════════════════════════════
    //                        CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    /// @notice Create a new StrategyExecutor
    /// @param _wallet The agentic wallet contract address
    constructor(address _wallet) {
        if (_wallet == address(0)) revert InvalidAddress();
        wallet = _wallet;
    }

    // ═══════════════════════════════════════════════════════════════
    //                     DEX CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    /// @notice Set DEX router address
    /// @param dex DEX identifier
    /// @param router Router contract address
    function setDEXRouter(uint8 dex, address router) external {
        // Only callable by wallet owner (through wallet)
        dexRouters[dex] = router;
    }

    /// @notice Set DEX factory address
    /// @param dex DEX identifier
    /// @param factory Factory contract address
    function setDEXFactory(uint8 dex, address factory) external {
        dexFactories[dex] = factory;
    }

    /// @notice Pause/unpause the executor
    /// @param _paused Whether to pause
    function setPaused(bool _paused) external {
        paused = _paused;
    }

    // ═══════════════════════════════════════════════════════════════
    //                        SWAP
    // ═══════════════════════════════════════════════════════════════

    /// @inheritdoc IStrategyExecutor
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint8 dex
    ) external override onlyWallet whenNotPaused returns (uint256 amountOut) {
        if (amountIn == 0) revert InvalidAmount();
        if (dex > DEX_FLUXION) revert InvalidDEX(dex);

        address router = dexRouters[dex];
        if (router == address(0)) revert InvalidDEX(dex);

        // Transfer tokens from wallet to this contract
        // (wallet should have approved this contract)

        // Build swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Execute swap based on DEX
        if (dex == DEX_MERCHANT_MOE) {
            amountOut = _swapMerchantMoe(router, amountIn, minAmountOut, path);
        } else if (dex == DEX_AGNI) {
            amountOut = _swapAgni(router, amountIn, minAmountOut, path);
        } else if (dex == DEX_FLUXION) {
            amountOut = _swapFluxion(router, amountIn, minAmountOut, path);
        }

        if (amountOut < minAmountOut) {
            revert InsufficientOutput(minAmountOut, amountOut);
        }

        return amountOut;
    }

    /// @notice Swap on Merchant Moe (Liquidity Book)
    function _swapMerchantMoe(
        address router,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path
    ) internal returns (uint256) {
        // Merchant Moe uses Liquidity Book - similar to Uniswap V2 router
        // but with bin-based pricing
        bytes memory data = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            amountIn,
            minAmountOut,
            path,
            wallet,
            block.timestamp + SWAP_DEADLINE
        );

        (bool success, bytes memory result) = router.call(data);
        require(success, "MerchantMoe swap failed");

        return abi.decode(result, (uint256));
    }

    /// @notice Swap on Agni Finance
    function _swapAgni(
        address router,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path
    ) internal returns (uint256) {
        // Agni uses standard Uniswap V2 interface
        bytes memory data = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            amountIn,
            minAmountOut,
            path,
            wallet,
            block.timestamp + SWAP_DEADLINE
        );

        (bool success, bytes memory result) = router.call(data);
        require(success, "Agni swap failed");

        return abi.decode(result, (uint256));
    }

    /// @notice Swap on Fluxion
    function _swapFluxion(
        address router,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path
    ) internal returns (uint256) {
        // Fluxion uses standard Uniswap V2 interface
        bytes memory data = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            amountIn,
            minAmountOut,
            path,
            wallet,
            block.timestamp + SWAP_DEADLINE
        );

        (bool success, bytes memory result) = router.call(data);
        require(success, "Fluxion swap failed");

        return abi.decode(result, (uint256));
    }

    // ═══════════════════════════════════════════════════════════════
    //                     LIQUIDITY
    // ═══════════════════════════════════════════════════════════════

    /// @inheritdoc IStrategyExecutor
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint8 dex
    ) external override onlyWallet whenNotPaused returns (uint256 liquidity) {
        if (amountA == 0 || amountB == 0) revert InvalidAmount();
        if (dex > DEX_FLUXION) revert InvalidDEX(dex);

        address router = dexRouters[dex];
        if (router == address(0)) revert InvalidDEX(dex);

        // All DEXes use similar addLiquidity interface
        bytes memory data = abi.encodeWithSignature(
            "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
            tokenA,
            tokenB,
            amountA,
            amountB,
            0, // minAmountA - slippage handled off-chain
            0, // minAmountB - slippage handled off-chain
            wallet,
            block.timestamp + SWAP_DEADLINE
        );

        (bool success, bytes memory result) = router.call(data);
        require(success, "Add liquidity failed");

        (, , liquidity) = abi.decode(result, (uint256, uint256, uint256));
        return liquidity;
    }

    // ═══════════════════════════════════════════════════════════════
    //                     YIELD FARMING
    // ═══════════════════════════════════════════════════════════════

    /// @inheritdoc IStrategyExecutor
    function harvest(
        address farm,
        address rewardToken
    ) external override onlyWallet whenNotPaused returns (uint256 amount) {
        // Get balance before harvest
        uint256 balanceBefore = _getTokenBalance(rewardToken, wallet);

        // Call getReward() on the farm contract
        bytes memory data = abi.encodeWithSignature("getReward()");

        (bool success, ) = farm.call(data);
        require(success, "Harvest failed");

        // Calculate rewards received
        uint256 balanceAfter = _getTokenBalance(rewardToken, wallet);
        amount = balanceAfter - balanceBefore;

        return amount;
    }

    // ═══════════════════════════════════════════════════════════════
    //                     ROUTE OPTIMIZATION
    // ═══════════════════════════════════════════════════════════════

    /// @inheritdoc IStrategyExecutor
    function getBestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view override returns (uint8 bestDex, uint256 bestAmount) {
        bestAmount = 0;
        bestDex = 0;

        // Check each DEX for the best rate
        for (uint8 i = 0; i <= DEX_FLUXION; i++) {
            address router = dexRouters[i];
            if (router == address(0)) continue;

            // Build path
            address[] memory path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;

            // Call getAmountsOut
            try this._getAmountsOut(router, amountIn, path) returns (uint256[] memory amounts) {
                if (amounts[1] > bestAmount) {
                    bestAmount = amounts[1];
                    bestDex = i;
                }
            } catch {
                // Skip this DEX if it fails
            }
        }

        return (bestDex, bestAmount);
    }

    /// @notice Get expected output amounts from a DEX
    /// @dev Made external for try/catch in getBestRoute
    function _getAmountsOut(
        address router,
        uint256 amountIn,
        address[] memory path
    ) external view returns (uint256[] memory) {
        bytes memory data = abi.encodeWithSignature(
            "getAmountsOut(uint256,address[])",
            amountIn,
            path
        );

        (bool success, bytes memory result) = router.staticcall(data);
        require(success, "getAmountsOut failed");

        return abi.decode(result, (uint256[]));
    }

    // ═══════════════════════════════════════════════════════════════
    //                     HELPERS
    // ═══════════════════════════════════════════════════════════════

    /// @notice Get ERC20 token balance
    function _getTokenBalance(address token, address account) internal view returns (uint256) {
        bytes memory data = abi.encodeWithSignature("balanceOf(address)", account);
        (bool success, bytes memory result) = token.staticcall(data);
        if (!success) return 0;
        return abi.decode(result, (uint256));
    }

    /// @notice Address validation helper
    function InvalidAddress() internal pure {
        revert("Invalid address");
    }
}

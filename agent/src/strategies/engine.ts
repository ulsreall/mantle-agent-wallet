// SPDX-License-Identifier: MIT
import { Logger } from 'pino';
import { WalletManager } from '../wallet';
import { Address, parseAbi, formatEther, parseEther } from 'viem';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

export interface StrategyConfig {
  defaultStrategy: string;
  maxTradeSize: number; // in MNT
  slippageTolerance: number; // percentage (e.g., 0.5 = 0.5%)
}

export interface StrategyEngineConfig {
  walletManager: WalletManager;
  logger: Logger;
  config: StrategyConfig;
}

export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  dex: number; // 0=MerchantMoe, 1=Agni, 2=Fluxion
}

export interface LiquidityParams {
  tokenA: Address;
  tokenB: Address;
  amountA: bigint;
  amountB: bigint;
  dex: number;
}

// ═══════════════════════════════════════════════════════════════
//                        CONSTANTS
// ═══════════════════════════════════════════════════════════════

// Common token addresses on Mantle
const TOKENS = {
  MNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8' as Address,
  USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9' as Address,
  USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE' as Address,
  WETH: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111' as Address,
  WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8' as Address,
};

// DEX identifiers
const DEX = {
  MERCHANT_MOE: 0,
  AGNI: 1,
  FLUXION: 2,
};

// Strategy executor ABI
const StrategyExecutorABI = parseAbi([
  'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint8 dex) returns (uint256 amountOut)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint8 dex) returns (uint256 liquidity)',
  'function harvest(address farm, address rewardToken) returns (uint256 amount)',
  'function getBestRoute(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint8 bestDex, uint256 bestAmount)',
]);

// ═══════════════════════════════════════════════════════════════
//                        STRATEGY ENGINE
// ═══════════════════════════════════════════════════════════════

export class StrategyEngine {
  private walletManager: WalletManager;
  private logger: Logger;
  private config: StrategyConfig;
  private strategyExecutorAddress: Address | null = null;
  private isRunning: boolean = false;

  constructor(config: StrategyEngineConfig) {
    this.walletManager = config.walletManager;
    this.logger = config.logger;
    this.config = config.config;
  }

  // ═══════════════════════════════════════════════════════════════
  //                        LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  async start() {
    this.logger.info('Starting strategy engine...');
    this.isRunning = true;

    // Get strategy executor address from environment
    const executorAddress = process.env.STRATEGY_EXECUTOR_ADDRESS;
    if (executorAddress) {
      this.strategyExecutorAddress = executorAddress as Address;
      this.logger.info(`Strategy executor: ${this.strategyExecutorAddress}`);
    } else {
      this.logger.warn('Strategy executor address not set. Some features may not work.');
    }
  }

  async stop() {
    this.logger.info('Stopping strategy engine...');
    this.isRunning = false;
  }

  // ═══════════════════════════════════════════════════════════════
  //                        EXECUTION
  // ═══════════════════════════════════════════════════════════════

  async execute() {
    if (!this.isRunning) {
      this.logger.warn('Strategy engine is not running');
      return;
    }

    this.logger.debug('Executing strategy...');

    try {
      // Get current balance
      const balance = await this.walletManager.getBalance();
      this.logger.debug(`Current balance: ${formatEther(balance)} MNT`);

      // Execute based on default strategy
      switch (this.config.defaultStrategy) {
        case 'swap':
          await this.executeSwapStrategy();
          break;
        case 'lp':
          await this.executeLPStrategy();
          break;
        case 'yield':
          await this.executeYieldStrategy();
          break;
        case 'arbitrage':
          await this.executeArbitrageStrategy();
          break;
        default:
          this.logger.warn(`Unknown strategy: ${this.config.defaultStrategy}`);
      }
    } catch (error) {
      this.logger.error('Strategy execution failed:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //                        STRATEGIES
  // ═══════════════════════════════════════════════════════════════

  private async executeSwapStrategy() {
    this.logger.info('Executing swap strategy...');

    if (!this.strategyExecutorAddress) {
      this.logger.warn('Strategy executor not set, skipping swap');
      return;
    }

    // Example: Swap MNT to USDC
    const amountIn = parseEther(this.config.maxTradeSize.toString());

    // Get best route
    const bestRoute = await this.getBestRoute(TOKENS.MNT, TOKENS.USDC, amountIn);
    this.logger.info(`Best route: DEX ${bestRoute.dex}, Expected output: ${formatEther(bestRoute.amount)} USDC`);

    // Calculate minimum output with slippage
    const minAmountOut = (bestRoute.amount * BigInt(Math.floor((1 - this.config.slippageTolerance / 100) * 100))) / 100n;

    // Execute swap
    await this.executeSwap({
      tokenIn: TOKENS.MNT,
      tokenOut: TOKENS.USDC,
      amountIn,
      minAmountOut,
      dex: bestRoute.dex,
    });
  }

  private async executeLPStrategy() {
    this.logger.info('Executing LP strategy...');

    if (!this.strategyExecutorAddress) {
      this.logger.warn('Strategy executor not set, skipping LP');
      return;
    }

    // Example: Add liquidity to MNT/USDC pool
    const amountA = parseEther('0.5'); // 0.5 MNT
    const amountB = parseEther('0.5'); // ~0.5 USDC worth

    await this.addLiquidity({
      tokenA: TOKENS.MNT,
      tokenB: TOKENS.USDC,
      amountA,
      amountB,
      dex: DEX.MERCHANT_MOE,
    });
  }

  private async executeYieldStrategy() {
    this.logger.info('Executing yield strategy...');

    if (!this.strategyExecutorAddress) {
      this.logger.warn('Strategy executor not set, skipping yield');
      return;
    }

    // Example: Harvest rewards from a farm
    const farmAddress = '0x0000000000000000000000000000000000000000' as Address;
    const rewardToken = TOKENS.MNT;

    await this.harvest(farmAddress, rewardToken);
  }

  private async executeArbitrageStrategy() {
    this.logger.info('Executing arbitrage strategy...');

    if (!this.strategyExecutorAddress) {
      this.logger.warn('Strategy executor not set, skipping arbitrage');
      return;
    }

    // Check prices across DEXes
    const amountIn = parseEther('1.0');

    for (let dex = 0; dex <= 2; dex++) {
      const route = await this.getBestRoute(TOKENS.MNT, TOKENS.USDC, amountIn);
      this.logger.debug(`DEX ${dex}: ${formatEther(route.amount)} USDC`);
    }

    // TODO: Implement actual arbitrage detection and execution
    this.logger.info('Arbitrage detection not yet implemented');
  }

  // ═══════════════════════════════════════════════════════════════
  //                        HELPERS
  // ═══════════════════════════════════════════════════════════════

  private async getBestRoute(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<{ dex: number; amount: bigint }> {
    try {
      const result = await this.walletManager.readContract(
        this.strategyExecutorAddress!,
        StrategyExecutorABI as any,
        'getBestRoute',
        [tokenIn, tokenOut, amountIn]
      );

      return {
        dex: Number(result[0]),
        amount: result[1],
      };
    } catch (error) {
      this.logger.error('Failed to get best route:', error);
      // Default to Merchant Moe
      return { dex: DEX.MERCHANT_MOE, amount: 0n };
    }
  }

  private async executeSwap(params: SwapParams): Promise<boolean> {
    this.logger.info(`Swapping ${formatEther(params.amountIn)} tokens on DEX ${params.dex}...`);

    try {
      const result = await this.walletManager.callContract(
        this.strategyExecutorAddress!,
        StrategyExecutorABI as any,
        'swap',
        [params.tokenIn, params.tokenOut, params.amountIn, params.minAmountOut, params.dex]
      );

      if (result.success) {
        this.logger.info(`Swap successful! TX: ${result.hash}`);
        return true;
      } else {
        this.logger.error(`Swap failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Swap execution failed:', error);
      return false;
    }
  }

  private async addLiquidity(params: LiquidityParams): Promise<boolean> {
    this.logger.info(`Adding liquidity on DEX ${params.dex}...`);

    try {
      const result = await this.walletManager.callContract(
        this.strategyExecutorAddress!,
        StrategyExecutorABI as any,
        'addLiquidity',
        [params.tokenA, params.tokenB, params.amountA, params.amountB, params.dex]
      );

      if (result.success) {
        this.logger.info(`Liquidity added! TX: ${result.hash}`);
        return true;
      } else {
        this.logger.error(`Add liquidity failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Add liquidity execution failed:', error);
      return false;
    }
  }

  private async harvest(farm: Address, rewardToken: Address): Promise<boolean> {
    this.logger.info(`Harvesting from farm ${farm}...`);

    try {
      const result = await this.walletManager.callContract(
        this.strategyExecutorAddress!,
        StrategyExecutorABI as any,
        'harvest',
        [farm, rewardToken]
      );

      if (result.success) {
        this.logger.info(`Harvest successful! TX: ${result.hash}`);
        return true;
      } else {
        this.logger.error(`Harvest failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Harvest execution failed:', error);
      return false;
    }
  }
}

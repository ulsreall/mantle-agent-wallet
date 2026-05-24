import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════
//                    ARBITRAGE SCANNER STRATEGY
// ═══════════════════════════════════════════════════════════════

export interface ArbitrageConfig {
  minSpreadPercent: number;    // e.g., 0.3 (minimum 0.3% spread to execute)
  maxAmount: string;           // e.g., "0.5" MNT max per arb
  tokenIn: string;             // MNT address
  tokenOut: string;            // USDT address
}

export interface DEXQuote {
  dex: string;
  price: number;
  amountOut: bigint;
  router: string;
}

export interface ArbitrageState {
  scansRun: number;
  opportunitiesFound: number;
  tradesExecuted: number;
  totalProfit: string;
  lastScanTime: number;
}

export interface ArbitrageResult {
  success: boolean;
  spread?: number;
  buyDex?: string;
  sellDex?: string;
  txHash?: string;
  profit?: string;
  error?: string;
}

export class ArbitrageStrategy {
  private config: ArbitrageConfig;
  private state: ArbitrageState;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  // DEX routers on Mantle
  private dexes = [
    {
      name: 'Agni V3',
      router: '0x319b69888b0d11cec22caa5034e25fffbdc88421',
      fee: 500,
    },
    {
      name: 'Merchant Moe',
      router: '0x88a8984f2b8507bbc1c699594e3a4ecdefed4784',
      fee: 500,
    },
  ];

  constructor(config: ArbitrageConfig, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    this.config = config;
    this.provider = provider;
    this.wallet = wallet;
    this.state = {
      scansRun: 0,
      opportunitiesFound: 0,
      tradesExecuted: 0,
      totalProfit: '0',
      lastScanTime: 0,
    };
  }

  // Get quote from a DEX
  async getQuote(dex: typeof this.dexes[0], amount: bigint): Promise<DEXQuote | null> {
    try {
      const router = new ethers.Contract(dex.router, [
        'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      ], this.provider);

      // Simulate to get quote (use staticCall)
      const amountOut = await router.exactInputSingle.staticCall(
        {
          tokenIn: this.config.tokenIn,
          tokenOut: this.config.tokenOut,
          fee: dex.fee,
          recipient: this.wallet.address,
          deadline: Math.floor(Date.now() / 1000) + 600,
          amountIn: amount,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        },
        { value: amount }
      );

      const price = Number(ethers.formatUnits(amountOut, 6)) / Number(ethers.formatEther(amount));

      return {
        dex: dex.name,
        price,
        amountOut,
        router: dex.router,
      };
    } catch {
      return null;
    }
  }

  // Scan for arbitrage opportunities
  async scan(): Promise<ArbitrageResult> {
    this.state.scansRun++;
    this.state.lastScanTime = Math.floor(Date.now() / 1000);

    const amount = ethers.parseEther(this.config.maxAmount);

    // Get quotes from all DEXes
    const quotes: DEXQuote[] = [];
    for (const dex of this.dexes) {
      const quote = await this.getQuote(dex, amount);
      if (quote) quotes.push(quote);
    }

    if (quotes.length < 2) {
      return { success: false, error: 'Not enough DEX quotes available' };
    }

    // Find best buy (lowest price) and best sell (highest price)
    quotes.sort((a, b) => a.price - b.price);
    const bestBuy = quotes[0];
    const bestSell = quotes[quotes.length - 1];

    const spread = ((bestSell.price - bestBuy.price) / bestBuy.price) * 100;

    if (spread >= this.config.minSpreadPercent) {
      this.state.opportunitiesFound++;
      return {
        success: true,
        spread,
        buyDex: bestBuy.dex,
        sellDex: bestSell.dex,
      };
    }

    return {
      success: false,
      error: `Spread ${spread.toFixed(4)}% below minimum ${this.config.minSpreadPercent}%`,
      spread,
    };
  }

  // Execute arbitrage
  async execute(): Promise<ArbitrageResult> {
    try {
      const scanResult = await this.scan();
      if (!scanResult.success || !scanResult.buyDex || !scanResult.sellDex) {
        return scanResult;
      }

      const amount = ethers.parseEther(this.config.maxAmount);
      const balance = await this.provider.getBalance(this.wallet.address);

      if (balance < amount + ethers.parseEther('0.005')) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Step 1: Buy on cheaper DEX
      const buyDex = this.dexes.find(d => d.name === scanResult.buyDex)!;
      const buyRouter = new ethers.Contract(buyDex.router, [
        'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      ], this.wallet);

      const buyTx = await buyRouter.exactInputSingle({
        tokenIn: this.config.tokenIn,
        tokenOut: this.config.tokenOut,
        fee: buyDex.fee,
        recipient: this.wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: amount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      }, { value: amount, gasLimit: 300000n });

      await buyTx.wait();

      // Step 2: Sell on more expensive DEX
      const sellDex = this.dexes.find(d => d.name === scanResult.sellDex)!;
      const usdt = new ethers.Contract(this.config.tokenOut, [
        'function balanceOf(address) view returns (uint256)',
        'function approve(address, uint256) returns (bool)',
      ], this.wallet);

      const usdtBal = await usdt.balanceOf(this.wallet.address);
      await (await usdt.approve(sellDex.router, usdtBal)).wait();

      const sellRouter = new ethers.Contract(sellDex.router, [
        'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      ], this.wallet);

      const sellTx = await sellRouter.exactInputSingle({
        tokenIn: this.config.tokenOut,
        tokenOut: this.config.tokenIn,
        fee: sellDex.fee,
        recipient: this.wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: usdtBal,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      }, { gasLimit: 300000n });

      await sellTx.wait();

      // Calculate profit
      const finalBalance = await this.provider.getBalance(this.wallet.address);
      const profit = finalBalance - (balance - amount);

      this.state.tradesExecuted++;
      this.state.totalProfit = (parseFloat(this.state.totalProfit) + parseFloat(ethers.formatEther(profit))).toString();

      return {
        success: true,
        spread: scanResult.spread,
        buyDex: scanResult.buyDex,
        sellDex: scanResult.sellDex,
        txHash: sellTx.hash,
        profit: ethers.formatEther(profit),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getState(): ArbitrageState {
    return { ...this.state };
  }

  getConfig(): ArbitrageConfig {
    return { ...this.config };
  }
}

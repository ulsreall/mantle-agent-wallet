import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════
//                    DCA (DOLLAR COST AVERAGE) STRATEGY
// ═══════════════════════════════════════════════════════════════

export interface DCAConfig {
  amountPerBuy: string;        // e.g., "0.1" MNT
  intervalSeconds: number;     // e.g., 3600 = 1 hour
  maxBuys: number;             // max number of buys
  tokenIn: string;             // MNT address
  tokenOut: string;            // USDT address
  minPrice?: number;           // only buy if price below this
  maxPrice?: number;           // only buy if price above this
}

export interface DCAState {
  buysExecuted: number;
  totalSpent: string;
  totalReceived: string;
  averagePrice: number;
  lastBuyTime: number;
  txHashes: string[];
}

export interface DCAResult {
  success: boolean;
  txHash?: string;
  amountIn?: string;
  amountOut?: string;
  price?: number;
  buyNumber?: number;
  error?: string;
}

export class DCAStrategy {
  private config: DCAConfig;
  private state: DCAState;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(config: DCAConfig, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    this.config = config;
    this.provider = provider;
    this.wallet = wallet;
    this.state = {
      buysExecuted: 0,
      totalSpent: '0',
      totalReceived: '0',
      averagePrice: 0,
      lastBuyTime: 0,
      txHashes: [],
    };
  }

  // Check if it's time to buy
  shouldExecute(): boolean {
    if (this.state.buysExecuted >= this.config.maxBuys) return false;
    const now = Math.floor(Date.now() / 1000);
    return now - this.state.lastBuyTime >= this.config.intervalSeconds;
  }

  // Get current MNT/USDT price
  async getPrice(): Promise<number> {
    const ROUTER = '0x319b69888b0d11cec22caa5034e25fffbdc88421';
    const QUOTER_ABI = [
      'function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)',
    ];
    
    // Use router to estimate
    const amount = ethers.parseEther('1');
    try {
      const router = new ethers.Contract(ROUTER, [
        'function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)',
      ], this.provider);
      
      // Get a quote by simulating
      const USDT = this.config.tokenOut;
      const priceResp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd');
      const priceData = await priceResp.json();
      return priceData.mantle?.usd || 0;
    } catch {
      return 0;
    }
  }

  // Execute one DCA buy
  async execute(): Promise<DCAResult> {
    try {
      if (!this.shouldExecute()) {
        return { success: false, error: 'Not time yet or max buys reached' };
      }

      const price = await this.getPrice();
      
      // Price check
      if (this.config.minPrice && price < this.config.minPrice) {
        return { success: false, error: `Price ${price} below minimum ${this.config.minPrice}` };
      }
      if (this.config.maxPrice && price > this.config.maxPrice) {
        return { success: false, error: `Price ${price} above maximum ${this.config.maxPrice}` };
      }

      const amount = ethers.parseEther(this.config.amountPerBuy);
      const balance = await this.provider.getBalance(this.wallet.address);
      
      if (balance < amount + ethers.parseEther('0.003')) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Execute swap via Agni V3
      const ROUTER = '0x319b69888b0d11cec22caa5034e25fffbdc88421';
      const router = new ethers.Contract(ROUTER, [
        'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      ], this.wallet);

      const tx = await router.exactInputSingle({
        tokenIn: this.config.tokenIn,
        tokenOut: this.config.tokenOut,
        fee: 500,
        recipient: this.wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: amount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      }, { value: amount, gasLimit: 300000n });

      const receipt = await tx.wait();

      // Update state
      this.state.buysExecuted++;
      this.state.totalSpent = (parseFloat(this.state.totalSpent) + parseFloat(this.config.amountPerBuy)).toString();
      this.state.lastBuyTime = Math.floor(Date.now() / 1000);
      this.state.txHashes.push(receipt.hash);
      this.state.averagePrice = price;

      return {
        success: true,
        txHash: receipt.hash,
        amountIn: this.config.amountPerBuy,
        price,
        buyNumber: this.state.buysExecuted,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getState(): DCAState {
    return { ...this.state };
  }

  getConfig(): DCAConfig {
    return { ...this.config };
  }
}

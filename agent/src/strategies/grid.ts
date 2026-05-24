import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════
//                    GRID TRADING STRATEGY
// ═══════════════════════════════════════════════════════════════

export interface GridConfig {
  lowerPrice: number;          // e.g., 0.60 (buy below this)
  upperPrice: number;          // e.g., 0.75 (sell above this)
  gridLevels: number;          // e.g., 5 (number of buy/sell levels)
  amountPerGrid: string;       // e.g., "0.1" MNT per grid
  tokenIn: string;             // MNT address
  tokenOut: string;            // USDT address
}

export interface GridLevel {
  price: number;
  type: 'buy' | 'sell';
  executed: boolean;
  txHash?: string;
}

export interface GridState {
  levels: GridLevel[];
  totalProfit: string;
  tradesExecuted: number;
}

export interface GridResult {
  success: boolean;
  action?: 'buy' | 'sell';
  price?: number;
  txHash?: string;
  amount?: string;
  profit?: string;
  error?: string;
}

export class GridStrategy {
  private config: GridConfig;
  private state: GridState;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(config: GridConfig, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    this.config = config;
    this.provider = provider;
    this.wallet = wallet;
    this.state = {
      levels: this.generateGridLevels(),
      totalProfit: '0',
      tradesExecuted: 0,
    };
  }

  // Generate buy/sell levels
  private generateGridLevels(): GridLevel[] {
    const levels: GridLevel[] = [];
    const step = (this.config.upperPrice - this.config.lowerPrice) / this.config.gridLevels;

    for (let i = 0; i <= this.config.gridLevels; i++) {
      const price = this.config.lowerPrice + (step * i);
      levels.push({
        price,
        type: i <= this.config.gridLevels / 2 ? 'buy' : 'sell',
        executed: false,
      });
    }

    return levels;
  }

  // Get current price
  async getCurrentPrice(): Promise<number> {
    try {
      const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd');
      const data = await resp.json();
      return data.mantle?.usd || 0;
    } catch {
      return 0;
    }
  }

  // Check if any grid level should execute
  async checkAndExecute(): Promise<GridResult> {
    try {
      const currentPrice = await this.getCurrentPrice();
      if (currentPrice === 0) {
        return { success: false, error: 'Could not fetch price' };
      }

      // Find matching grid level
      for (const level of this.state.levels) {
        if (level.executed) continue;

        const shouldBuy = level.type === 'buy' && currentPrice <= level.price;
        const shouldSell = level.type === 'sell' && currentPrice >= level.price;

        if (shouldBuy || shouldSell) {
          return await this.executeLevel(level, currentPrice);
        }
      }

      return { success: false, error: `No grid level triggered at price $${currentPrice}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Execute a specific grid level
  private async executeLevel(level: GridLevel, currentPrice: number): Promise<GridResult> {
    try {
      const amount = ethers.parseEther(this.config.amountPerGrid);
      const balance = await this.provider.getBalance(this.wallet.address);

      if (level.type === 'buy' && balance < amount + ethers.parseEther('0.003')) {
        return { success: false, error: 'Insufficient balance for buy' };
      }

      const ROUTER = '0x319b69888b0d11cec22caa5034e25fffbdc88421';
      const router = new ethers.Contract(ROUTER, [
        'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      ], this.wallet);

      let tx;

      if (level.type === 'buy') {
        // Buy USDT with MNT
        tx = await router.exactInputSingle({
          tokenIn: this.config.tokenIn,
          tokenOut: this.config.tokenOut,
          fee: 500,
          recipient: this.wallet.address,
          deadline: Math.floor(Date.now() / 1000) + 600,
          amountIn: amount,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        }, { value: amount, gasLimit: 300000n });
      } else {
        // Sell USDT for MNT - need to check USDT balance
        const usdt = new ethers.Contract(this.config.tokenOut, [
          'function balanceOf(address) view returns (uint256)',
          'function approve(address, uint256) returns (bool)',
        ], this.wallet);
        
        const usdtBal = await usdt.balanceOf(this.wallet.address);
        if (usdtBal === 0n) {
          return { success: false, error: 'No USDT to sell' };
        }

        await (await usdt.approve(ROUTER, usdtBal)).wait();
        
        tx = await router.exactInputSingle({
          tokenIn: this.config.tokenOut,
          tokenOut: this.config.tokenIn,
          fee: 500,
          recipient: this.wallet.address,
          deadline: Math.floor(Date.now() / 1000) + 600,
          amountIn: usdtBal,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        }, { gasLimit: 300000n });
      }

      const receipt = await tx.wait();

      // Mark level as executed
      level.executed = true;
      level.txHash = receipt.hash;
      this.state.tradesExecuted++;

      return {
        success: true,
        action: level.type,
        price: currentPrice,
        txHash: receipt.hash,
        amount: this.config.amountPerGrid,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getState(): GridState {
    return { ...this.state };
  }

  getConfig(): GridConfig {
    return { ...this.config };
  }
}

import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════
//                    STOP LOSS / TAKE PROFIT STRATEGY
// ═══════════════════════════════════════════════════════════════

export interface StopLossConfig {
  stopLossPrice: number;       // e.g., 0.55 (sell if price drops below)
  takeProfitPrice: number;     // e.g., 0.80 (sell if price rises above)
  tokenIn: string;             // MNT address
  tokenOut: string;            // USDT address
  positionSize: string;        // e.g., "1.0" MNT to protect
  trailingStop?: boolean;      // enable trailing stop
  trailingPercent?: number;    // e.g., 5 (5% from peak)
}

export interface StopLossState {
  isActive: boolean;
  entryPrice: number;
  highestPrice: number;
  currentPrice: number;
  triggered: boolean;
  triggerType?: 'stop_loss' | 'take_profit' | 'trailing_stop';
  txHash?: string;
}

export interface StopLossResult {
  success: boolean;
  triggered: boolean;
  triggerType?: string;
  price?: number;
  txHash?: string;
  error?: string;
}

export class StopLossStrategy {
  private config: StopLossConfig;
  private state: StopLossState;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(config: StopLossConfig, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    this.config = config;
    this.provider = provider;
    this.wallet = wallet;
    this.state = {
      isActive: false,
      entryPrice: 0,
      highestPrice: 0,
      currentPrice: 0,
      triggered: false,
    };
  }

  // Activate the strategy with entry price
  activate(entryPrice: number): void {
    this.state.isActive = true;
    this.state.entryPrice = entryPrice;
    this.state.highestPrice = entryPrice;
    this.state.triggered = false;
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

  // Check if stop loss or take profit should trigger
  async check(): Promise<StopLossResult> {
    if (!this.state.isActive || this.state.triggered) {
      return { success: false, triggered: false, error: 'Strategy not active or already triggered' };
    }

    const currentPrice = await this.getCurrentPrice();
    if (currentPrice === 0) {
      return { success: false, triggered: false, error: 'Could not fetch price' };
    }

    this.state.currentPrice = currentPrice;

    // Update highest price for trailing stop
    if (currentPrice > this.state.highestPrice) {
      this.state.highestPrice = currentPrice;
    }

    // Check stop loss
    if (currentPrice <= this.config.stopLossPrice) {
      return {
        success: true,
        triggered: true,
        triggerType: 'stop_loss',
        price: currentPrice,
      };
    }

    // Check take profit
    if (currentPrice >= this.config.takeProfitPrice) {
      return {
        success: true,
        triggered: true,
        triggerType: 'take_profit',
        price: currentPrice,
      };
    }

    // Check trailing stop
    if (this.config.trailingStop && this.config.trailingPercent) {
      const dropFromPeak = ((this.state.highestPrice - currentPrice) / this.state.highestPrice) * 100;
      if (dropFromPeak >= this.config.trailingPercent) {
        return {
          success: true,
          triggered: true,
          triggerType: 'trailing_stop',
          price: currentPrice,
        };
      }
    }

    return {
      success: true,
      triggered: false,
      price: currentPrice,
    };
  }

  // Execute the stop loss / take profit (sell MNT → USDT)
  async execute(): Promise<StopLossResult> {
    try {
      const checkResult = await this.check();
      if (!checkResult.triggered) {
        return checkResult;
      }

      const amount = ethers.parseEther(this.config.positionSize);
      const balance = await this.provider.getBalance(this.wallet.address);

      if (balance < amount + ethers.parseEther('0.003')) {
        return { success: false, triggered: false, error: 'Insufficient balance' };
      }

      // Execute sell: MNT → USDT
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

      this.state.triggered = true;
      this.state.triggerType = checkResult.triggerType as any;
      this.state.txHash = receipt.hash;

      return {
        success: true,
        triggered: true,
        triggerType: checkResult.triggerType,
        price: checkResult.price,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      return { success: false, triggered: false, error: error.message };
    }
  }

  getState(): StopLossState {
    return { ...this.state };
  }

  getConfig(): StopLossConfig {
    return { ...this.config };
  }
}

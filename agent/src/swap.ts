import { ethers } from 'ethers';
import {
  ADDRESSES,
  AGNI_ROUTER_ABI,
  MERCHANT_MOE_ROUTER_ABI,
  WMNT_ABI,
  ERC20_ABI,
  getProvider,
  getWallet,
  encodePath,
  getDeadline,
} from './config';

// ═══════════════════════════════════════════════════════════════
//                    SWAP EXECUTOR
// ═══════════════════════════════════════════════════════════════

export interface SwapResult {
  success: boolean;
  txHash?: string;
  amountIn?: string;
  amountOut?: string;
  dex?: string;
  error?: string;
}

export class SwapExecutor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private agniRouter: ethers.Contract;
  private merchantMoeRouter: ethers.Contract;
  private wmnt: ethers.Contract;

  constructor(privateKey: string) {
    this.provider = getProvider();
    this.wallet = getWallet(privateKey, this.provider);
    this.agniRouter = new ethers.Contract(ADDRESSES.agniRouter, AGNI_ROUTER_ABI, this.wallet);
    this.merchantMoeRouter = new ethers.Contract(ADDRESSES.merchantMoeRouter, MERCHANT_MOE_ROUTER_ABI, this.wallet);
    this.wmnt = new ethers.Contract(ADDRESSES.WMNT, WMNT_ABI, this.wallet);
  }

  // ─────────────────────────────────────────────────────────────
  //                    NATIVE MNT → WMNT
  // ─────────────────────────────────────────────────────────────

  async wrapMNT(amount: ethers.BigNumberish): Promise<SwapResult> {
    try {
      const tx = await this.wmnt.deposit({ value: amount });
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        amountIn: ethers.formatEther(amount),
        amountOut: ethers.formatEther(amount),
        dex: 'WMNT',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unwrapWMNT(amount: ethers.BigNumberish): Promise<SwapResult> {
    try {
      const tx = await this.wmnt.withdraw(amount);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        amountIn: ethers.formatEther(amount),
        amountOut: ethers.formatEther(amount),
        dex: 'WMNT',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  //                    AGNI V3 SWAP
  // ─────────────────────────────────────────────────────────────

  async swapOnAgni(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    slippage: number = 0.5, // 0.5% default slippage
    fee: number = 500
  ): Promise<SwapResult> {
    try {
      // Approve router if needed
      await this.ensureApproval(tokenIn, ADDRESSES.agniRouter, amountIn);

      // Get expected output for slippage calculation
      const path = encodePath(tokenIn, tokenOut, fee);
      
      // Execute swap
      const params = {
        tokenIn,
        tokenOut,
        fee,
        recipient: this.wallet.address,
        deadline: getDeadline(),
        amountIn,
        amountOutMinimum: 0n, // Will calculate below
        sqrtPriceLimitX96: 0n,
      };

      // For now, set amountOutMinimum to 0 (we'll add slippage protection later)
      // In production, we'd query the pool first
      const tx = await this.agniRouter.exactInputSingle(params);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        amountIn: ethers.formatEther(amountIn),
        dex: 'Agni',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  //                    MERCHANT MOE SWAP
  // ─────────────────────────────────────────────────────────────

  async swapOnMerchantMoe(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    slippage: number = 0.5
  ): Promise<SwapResult> {
    try {
      // Approve router if needed
      await this.ensureApproval(tokenIn, ADDRESSES.merchantMoeRouter, amountIn);

      const path = [tokenIn, tokenOut];
      const deadline = getDeadline();

      const tx = await this.merchantMoeRouter.swapExactTokensForTokens(
        amountIn,
        0n, // amountOutMin (will add slippage protection)
        path,
        ethers.ZeroAddress, // pairBinSteps (use default)
        this.wallet.address,
        deadline
      );
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        amountIn: ethers.formatEther(amountIn),
        dex: 'MerchantMoe',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  //                    NATIVE MNT SWAP
  // ─────────────────────────────────────────────────────────────

  async swapNativeMNT(
    tokenOut: string,
    amountIn: bigint,
    dex: 'agni' | 'merchantMoe' = 'merchantMoe'
  ): Promise<SwapResult> {
    try {
      if (dex === 'merchantMoe') {
        const path = [ADDRESSES.WMNT, tokenOut];
        const deadline = getDeadline();

        const tx = await this.merchantMoeRouter.swapExactETHForTokens(
          0n,
          path,
          ethers.ZeroAddress,
          this.wallet.address,
          deadline,
          { value: amountIn }
        );
        const receipt = await tx.wait();

        return {
          success: true,
          txHash: receipt.hash,
          amountIn: ethers.formatEther(amountIn),
          dex: 'MerchantMoe',
        };
      } else {
        // For Agni, wrap first then swap
        const wrapResult = await this.wrapMNT(amountIn);
        if (!wrapResult.success) return wrapResult;
        return this.swapOnAgni(ADDRESSES.WMNT, tokenOut, amountIn);
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  //                    SMART SWAP (best rate)
  // ─────────────────────────────────────────────────────────────

  async smartSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<SwapResult> {
    // Try both DEXes and pick the better result
    // For now, default to Merchant Moe for native MNT swaps
    if (tokenIn === ethers.ZeroAddress || tokenIn === ADDRESSES.WMNT) {
      return this.swapNativeMNT(tokenOut, amountIn, 'merchantMoe');
    }
    
    // For token-to-token, try Agni first (V3 usually has better rates)
    return this.swapOnAgni(tokenIn, tokenOut, amountIn);
  }

  // ─────────────────────────────────────────────────────────────
  //                    HELPERS
  // ─────────────────────────────────────────────────────────────

  private async ensureApproval(
    tokenAddress: string,
    spender: string,
    amount: bigint
  ): Promise<void> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    const allowance = await token.allowance(this.wallet.address, spender);
    
    if (allowance < amount) {
      const tx = await token.approve(spender, ethers.MaxUint256);
      await tx.wait();
    }
  }

  async getBalance(tokenAddress?: string): Promise<string> {
    if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    }
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await token.balanceOf(this.wallet.address);
    const decimals = await token.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  getAddress(): string {
    return this.wallet.address;
  }
}

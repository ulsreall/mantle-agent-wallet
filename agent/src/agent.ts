#!/usr/bin/env node
import { ethers } from 'ethers';
import { SwapExecutor, SwapResult } from './swap';
import { ADDRESSES, getProvider } from './config';

// ═══════════════════════════════════════════════════════════════
//                    MANTLE AGENT
// ═══════════════════════════════════════════════════════════════

class MantleAgent {
  private swapExecutor: SwapExecutor;
  private provider: ethers.JsonRpcProvider;
  private startingBalance: bigint = 0n;

  constructor(privateKey: string) {
    this.provider = getProvider();
    this.swapExecutor = new SwapExecutor(privateKey);
  }

  async initialize(): Promise<void> {
    console.log('🤖 MantleAgent initializing...');
    console.log(`📍 Wallet: ${this.swapExecutor.getAddress()}`);
    
    const balance = await this.provider.getBalance(this.swapExecutor.getAddress());
    this.startingBalance = balance;
    console.log(`💰 Balance: ${ethers.formatEther(balance)} MNT`);
    
    // Check WMNT balance
    const wmntBalance = await this.swapExecutor.getBalance(ADDRESSES.WMNT);
    console.log(`💰 WMNT: ${wmntBalance}`);
    
    console.log('✅ Agent ready!\n');
  }

  // ─────────────────────────────────────────────────────────────
  //                    STRATEGY: SWAP & COMPOUND
  // ─────────────────────────────────────────────────────────────

  async executeSwapStrategy(
    tokenIn: string,
    tokenOut: string,
    amountMNT: number
  ): Promise<SwapResult> {
    const amount = ethers.parseEther(amountMNT.toString());
    
    console.log(`📊 Executing swap: ${amountMNT} MNT → ${tokenOut}`);
    
    if (tokenIn === ethers.ZeroAddress) {
      // Native MNT swap
      return this.swapExecutor.swapNativeMNT(tokenOut, amount, 'merchantMoe');
    }
    
    return this.swapExecutor.smartSwap(tokenIn, tokenOut, amount);
  }

  // ─────────────────────────────────────────────────────────────
  //                    COMPOUND STRATEGY
  // ─────────────────────────────────────────────────────────────

  async executeCompoundStrategy(
    initialAmountMNT: number,
    iterations: number = 3
  ): Promise<void> {
    console.log(`🔄 Starting compound strategy with ${initialAmountMNT} MNT`);
    console.log(`📈 Iterations: ${iterations}\n`);

    let currentAmount = ethers.parseEther(initialAmountMNT.toString());

    for (let i = 0; i < iterations; i++) {
      console.log(`\n--- Iteration ${i + 1}/${iterations} ---`);
      
      // Step 1: Swap MNT → USDe (stablecoin)
      console.log('1️⃣ Swapping MNT → USDe...');
      const swapResult = await this.swapExecutor.swapNativeMNT(
        ADDRESSES.USDe,
        currentAmount,
        'merchantMoe'
      );

      if (!swapResult.success) {
        console.error(`❌ Swap failed: ${swapResult.error}`);
        break;
      }

      console.log(`✅ Swap successful! TX: ${swapResult.txHash}`);

      // Step 2: Check new balance
      const usdeBalance = await this.swapExecutor.getBalance(ADDRESSES.USDe);
      console.log(`💰 USDe balance: ${usdeBalance}`);

      // Step 3: Swap back USDe → MNT (compound)
      console.log('2️⃣ Swapping USDe → MNT (compound)...');
      const usdeAmount = ethers.parseEther(usdeBalance);
      
      if (usdeAmount > 0n) {
        // Approve and swap back
        const swapBackResult = await this.swapExecutor.swapOnAgni(
          ADDRESSES.USDe,
          ADDRESSES.WMNT,
          usdeAmount,
          0.5,
          3000
        );

        if (swapBackResult.success) {
          console.log(`✅ Compound successful! TX: ${swapBackResult.txHash}`);
          
          // Unwrap WMNT → MNT
          const wmntBal = await this.swapExecutor.getBalance(ADDRESSES.WMNT);
          if (parseFloat(wmntBal) > 0) {
            await this.swapExecutor.unwrapWMNT(ethers.parseEther(wmntBal));
          }
        } else {
          console.error(`❌ Compound failed: ${swapBackResult.error}`);
        }
      }

      // Update amount for next iteration
      const newBalance = await this.provider.getBalance(this.swapExecutor.getAddress());
      const profit = newBalance - currentAmount;
      console.log(`📊 Profit: ${ethers.formatEther(profit)} MNT`);
      
      currentAmount = newBalance;
    }

    // Final summary
    const finalBalance = await this.provider.getBalance(this.swapExecutor.getAddress());
    const totalProfit = finalBalance - this.startingBalance;
    
    console.log('\n' + '═'.repeat(50));
    console.log('📊 STRATEGY SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Starting: ${ethers.formatEther(this.startingBalance)} MNT`);
    console.log(`Final:    ${ethers.formatEther(finalBalance)} MNT`);
    console.log(`Profit:   ${ethers.formatEther(totalProfit)} MNT`);
    console.log(`ROI:      ${((Number(totalProfit) / Number(this.startingBalance)) * 100).toFixed(2)}%`);
    console.log('═'.repeat(50));
  }

  // ─────────────────────────────────────────────────────────────
  //                    STATUS
  // ─────────────────────────────────────────────────────────────

  async getStatus(): Promise<object> {
    const balance = await this.provider.getBalance(this.swapExecutor.getAddress());
    const wmntBalance = await this.swapExecutor.getBalance(ADDRESSES.WMNT);
    const usdeBalance = await this.swapExecutor.getBalance(ADDRESSES.USDe);
    const usdtBalance = await this.swapExecutor.getBalance(ADDRESSES.USDT);

    return {
      address: this.swapExecutor.getAddress(),
      mntBalance: ethers.formatEther(balance),
      wmntBalance,
      usdeBalance,
      usdtBalance,
      pnl: ethers.formatEther(balance - this.startingBalance),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
//                    CLI INTERFACE
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Load private key from environment or file
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  const agent = new MantleAgent(privateKey);

  switch (command) {
    case 'init':
      await agent.initialize();
      break;

    case 'swap':
      if (args.length < 4) {
        console.log('Usage: agent.ts swap <tokenIn> <tokenOut> <amountMNT>');
        process.exit(1);
      }
      await agent.initialize();
      const result = await agent.executeSwapStrategy(
        args[1],
        args[2],
        parseFloat(args[3])
      );
      console.log('\nResult:', result);
      break;

    case 'compound':
      await agent.initialize();
      const amount = parseFloat(args[1] || '0.1');
      const iterations = parseInt(args[2] || '3');
      await agent.executeCompoundStrategy(amount, iterations);
      break;

    case 'status':
      const status = await agent.getStatus();
      console.log('\n📊 Agent Status:');
      console.log(JSON.stringify(status, null, 2));
      break;

    default:
      console.log(`
🤖 Mantle Agent CLI

Commands:
  init                    Initialize agent and show balances
  swap <in> <out> <amt>   Swap tokens
  compound <amt> [iter]   Run compound strategy
  status                  Show agent status

Examples:
  ts-node agent.ts init
  ts-node agent.ts compound 0.1 5
  ts-node agent.ts status
      `);
  }
}

main().catch(console.error);

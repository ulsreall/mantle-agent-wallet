import { ethers } from "ethers";
import { SwapExecutor } from "./swap";
import { ADDRESSES } from "./config";

export interface CompoundSummary {
  iterations: number;
  startingBalance: string;
  finalBalance: string;
  profit: string;
  roiPercent: string;
  iterationResults: IterationResult[];
}

export interface IterationResult {
  iteration: number;
  balanceBefore: string;
  balanceAfter: string;
  profit: string;
  roiPercent: string;
}

/**
 * Execute a compound yield strategy: MNT -> WMNT -> USDT -> WMNT -> MNT
 * Demonstrates round-trip swaps to compound returns.
 *
 * @param executor - SwapExecutor instance
 * @param amount - Amount of MNT per iteration (in ether units)
 * @param iterations - Number of round-trip iterations to execute
 */
export async function executeCompoundStrategy(
  executor: SwapExecutor,
  amount: string,
  iterations: number = 1
): Promise<CompoundSummary> {
  const amountWei = ethers.parseEther(amount);

  // Record starting balance
  const startingBalance = await executor.getBalance(ethers.ZeroAddress);
  console.log(`🏦 Starting MNT balance: ${ethers.formatEther(startingBalance)}`);

  const iterationResults: IterationResult[] = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔄 Iteration ${i} / ${iterations}`);
    console.log(`${"=".repeat(50)}`);

    const balanceBefore = await executor.getBalance(ethers.ZeroAddress);
    console.log(`📊 Balance before: ${ethers.formatEther(balanceBefore)} MNT`);

    try {
      // Step 1: Wrap MNT → WMNT
      console.log(`\n📦 Step 1: Wrapping ${amount} MNT → WMNT...`);
      await executor.wrapMNT(amountWei);

      // Step 2: Swap WMNT → USDT on Agni (fee 500)
      console.log(`🔀 Step 2: Swapping WMNT → USDT (Agni, fee 500)...`);
      await executor.swapOnAgni(
        ADDRESSES.WMNT,
        ADDRESSES.USDT,
        amountWei,
        0.5, // 0.5% slippage
        500
      );

      // Step 3: Get USDT balance and swap back USDT → WMNT
      const usdtBalance = await executor.getBalance(ADDRESSES.USDT);
      console.log(`💰 USDT received: ${ethers.formatUnits(usdtBalance, 6)}`);
      console.log(`🔀 Step 3: Swapping USDT → WMNT (Agni, fee 500)...`);
      await executor.swapOnAgni(
        ADDRESSES.USDT,
        ADDRESSES.WMNT,
        usdtBalance,
        0.5,
        500
      );

      // Step 4: Unwrap WMNT → MNT
      const wmntBalance = await executor.getBalance(ADDRESSES.WMNT);
      console.log(`📦 Step 4: Unwrapping ${ethers.formatEther(wmntBalance)} WMNT → MNT...`);
      await executor.unwrapWMNT(wmntBalance);

      // Calculate P&L
      const balanceAfter = await executor.getBalance(ethers.ZeroAddress);
      const profit = balanceAfter - balanceBefore;
      const roi = balanceBefore > 0n
        ? Number((profit * 10000n) / balanceBefore) / 100
        : 0;

      const result: IterationResult = {
        iteration: i,
        balanceBefore: ethers.formatEther(balanceBefore),
        balanceAfter: ethers.formatEther(balanceAfter),
        profit: ethers.formatEther(profit),
        roiPercent: roi.toFixed(4),
      };
      iterationResults.push(result);

      if (profit >= 0n) {
        console.log(`\n✅ Iteration ${i} complete — Profit: +${result.profit} MNT (${result.roiPercent}%)`);
      } else {
        console.log(`\n⚠️ Iteration ${i} complete — Loss: ${result.profit} MNT (${result.roiPercent}%)`);
      }
    } catch (error: any) {
      console.error(`❌ Iteration ${i} failed: ${error.message}`);
      iterationResults.push({
        iteration: i,
        balanceBefore: ethers.formatEther(balanceBefore),
        balanceAfter: "error",
        profit: "error",
        roiPercent: "error",
      });
    }
  }

  // Final summary
  const finalBalance = await executor.getBalance(ethers.ZeroAddress);
  const totalProfit = finalBalance - startingBalance;
  const totalRoi = startingBalance > 0n
    ? Number((totalProfit * 10000n) / startingBalance) / 100
    : 0;

  const summary: CompoundSummary = {
    iterations,
    startingBalance: ethers.formatEther(startingBalance),
    finalBalance: ethers.formatEther(finalBalance),
    profit: ethers.formatEther(totalProfit),
    roiPercent: totalRoi.toFixed(4),
    iterationResults,
  };

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📈 Compound Strategy Summary`);
  console.log(`${"=".repeat(50)}`);
  console.log(`🏦 Starting Balance: ${summary.startingBalance} MNT`);
  console.log(`🏁 Final Balance:    ${summary.finalBalance} MNT`);
  console.log(`💰 Total Profit:     ${summary.profit} MNT`);
  console.log(`📊 ROI:              ${summary.roiPercent}%`);
  console.log(`${"=".repeat(50)}\n`);

  return summary;
}

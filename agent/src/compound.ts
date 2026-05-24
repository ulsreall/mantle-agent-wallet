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

export async function executeCompoundStrategy(
  executor: SwapExecutor,
  amountMnt: number,
  iterations: number = 1
): Promise<CompoundSummary> {
  const amountWei = ethers.parseEther(amountMnt.toString());

  const startingBalance = ethers.parseEther(await executor.getBalance());
  console.log(`🏦 Starting MNT balance: ${ethers.formatEther(startingBalance)}`);

  const iterationResults: IterationResult[] = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔄 Iteration ${i} / ${iterations}`);
    console.log(`${"=".repeat(50)}`);

    const balanceBefore = ethers.parseEther(await executor.getBalance());
    console.log(`📊 Balance before: ${ethers.formatEther(balanceBefore)} MNT`);

    try {
      // Step 1: Wrap MNT → WMNT
      console.log(`\n📦 Step 1: Wrapping ${amountMnt} MNT → WMNT...`);
      await executor.wrapMNT(amountWei);

      // Step 2: Swap WMNT → USDT on Agni (fee 500)
      console.log(`🔀 Step 2: Swapping WMNT → USDT (Agni, fee 500)...`);
      await executor.swapOnAgni(ADDRESSES.WMNT, ADDRESSES.USDT, amountWei, 0.5, 500);

      // Step 3: Get USDT balance and swap back
      const usdtBalanceStr = await executor.getBalance(ADDRESSES.USDT);
      const usdtBalance = ethers.parseUnits(usdtBalanceStr, 6);
      console.log(`💰 USDT received: ${usdtBalanceStr}`);
      console.log(`🔀 Step 3: Swapping USDT → WMNT (Agni, fee 500)...`);
      await executor.swapOnAgni(ADDRESSES.USDT, ADDRESSES.WMNT, usdtBalance, 0.5, 500);

      // Step 4: Unwrap WMNT → MNT
      const wmntBalanceStr = await executor.getBalance(ADDRESSES.WMNT);
      const wmntBalance = ethers.parseEther(wmntBalanceStr);
      console.log(`📦 Step 4: Unwrapping ${wmntBalanceStr} WMNT → MNT...`);
      await executor.unwrapWMNT(wmntBalance);

      // Calculate P&L
      const balanceAfter = ethers.parseEther(await executor.getBalance());
      const profit = balanceAfter - balanceBefore;
      const roi = balanceBefore > 0n ? Number((profit * 10000n) / balanceBefore) / 100 : 0;

      const result: IterationResult = {
        iteration: i,
        balanceBefore: ethers.formatEther(balanceBefore),
        balanceAfter: ethers.formatEther(balanceAfter),
        profit: ethers.formatEther(profit),
        roiPercent: roi.toFixed(4),
      };
      iterationResults.push(result);

      if (profit >= 0n) {
        console.log(`\n✅ Iteration ${i} — Profit: +${result.profit} MNT (${result.roiPercent}%)`);
      } else {
        console.log(`\n⚠️ Iteration ${i} — Loss: ${result.profit} MNT (${result.roiPercent}%)`);
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

  const finalBalance = ethers.parseEther(await executor.getBalance());
  const totalProfit = finalBalance - startingBalance;
  const totalRoi = startingBalance > 0n ? Number((totalProfit * 10000n) / startingBalance) / 100 : 0;

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
  console.log(`🏦 Starting: ${summary.startingBalance} MNT`);
  console.log(`🏁 Final:    ${summary.finalBalance} MNT`);
  console.log(`💰 Profit:   ${summary.profit} MNT`);
  console.log(`📊 ROI:      ${summary.roiPercent}%`);
  console.log(`${"=".repeat(50)}\n`);

  return summary;
}

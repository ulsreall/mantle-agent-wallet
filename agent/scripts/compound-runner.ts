import { ethers } from 'ethers';
import * as fs from 'fs';

const cred = JSON.parse(fs.readFileSync('/root/.hermes/credentials/mantle-hackathon-wallet.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
const wallet = new ethers.Wallet(cred.privateKey, provider);

// Correct addresses from config.ts
const WMNT = '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8';
const USDT = '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE';
const ROUTER = '0x319b69888b0d11cec22caa5034e25fffbdc88421';
const FEE = 500;

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function deposit() payable',
];

const ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
];

async function getBalances() {
  const mnt = await provider.getBalance(wallet.address);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);
  const usdtBal = await usdt.balanceOf(wallet.address);
  return { mnt, usdt: usdtBal };
}

async function swapMNTtoUSDT(amount: bigint) {
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  const deadline = Math.floor(Date.now() / 1000) + 600;
  const tx = await router.exactInputSingle(
    [WMNT, USDT, FEE, wallet.address, deadline, amount, 0n, 0n],
    { value: amount, gasLimit: 300000n }
  );
  return await tx.wait();
}

async function swapUSDTtoMNT(amount: bigint) {
  const usdt = new ethers.Contract(USDT, ERC20_ABI, wallet);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);

  // Approve
  const approveTx = await usdt.approve(ROUTER, amount);
  await approveTx.wait();

  const deadline = Math.floor(Date.now() / 1000) + 600;
  const tx = await router.exactInputSingle(
    [USDT, WMNT, FEE, wallet.address, deadline, amount, 0n, 0n],
    { gasLimit: 300000n }
  );
  return await tx.wait();
}

async function main() {
  const cycles = parseInt(process.argv[2] || '3');
  const init = await getBalances();
  console.log(`Initial: ${ethers.formatEther(init.mnt)} MNT, ${ethers.formatUnits(init.usdt, 6)} USDT\n`);

  for (let i = 1; i <= cycles; i++) {
    console.log(`--- Cycle ${i} ---`);
    try {
      const before = await getBalances();
      const amt = ethers.parseEther('0.03');

      if (before.mnt < amt + ethers.parseEther('0.005')) {
        console.log('Insufficient MNT, skipping');
        continue;
      }

      // MNT → USDT
      console.log(`  Swap 0.03 MNT → USDT...`);
      const r1 = await swapMNTtoUSDT(amt);
      console.log(`  TX: ${r1.hash}`);

      const mid = await getBalances();
      const usdtGot = mid.usdt - before.usdt;
      console.log(`  Got: ${ethers.formatUnits(usdtGot, 6)} USDT`);

      // USDT → MNT
      console.log(`  Swap ${ethers.formatUnits(usdtGot, 6)} USDT → MNT...`);
      const r2 = await swapUSDTtoMNT(usdtGot);
      console.log(`  TX: ${r2.hash}`);

      const after = await getBalances();
      const profit = after.mnt - before.mnt;
      console.log(`  Profit: ${ethers.formatEther(profit)} MNT\n`);

      if (i < cycles) await new Promise(r => setTimeout(r, 3000));
    } catch (e: any) {
      console.log(`  Error: ${e.message?.substring(0, 120)}\n`);
    }
  }

  const final = await getBalances();
  const totalProfit = final.mnt - init.mnt;
  const roi = (Number(totalProfit) / Number(init.mnt) * 100);

  console.log('=== SUMMARY ===');
  console.log(`Cycles: ${cycles}`);
  console.log(`Initial: ${ethers.formatEther(init.mnt)} MNT`);
  console.log(`Final: ${ethers.formatEther(final.mnt)} MNT`);
  console.log(`Profit: ${ethers.formatEther(totalProfit)} MNT`);
  console.log(`ROI: ${roi.toFixed(4)}%`);
}

main().catch(console.error);

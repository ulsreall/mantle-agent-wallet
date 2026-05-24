import { ethers } from 'ethers';
import * as fs from 'fs';

const cred = JSON.parse(fs.readFileSync('/root/.hermes/credentials/mantle-hackathon-wallet.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
const wallet = new ethers.Wallet(cred.privateKey, provider);

const WMNT = '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8';
const USDT = '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE';
const ROUTER = '0x319b69888b0d11cec22caa5034e25fffbdc88421';
const FEE = 500;

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
];

const ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

async function getBalances() {
  const mnt = await provider.getBalance(wallet.address);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);
  const usdtBal = await usdt.balanceOf(wallet.address);
  return { mnt, usdt: usdtBal };
}

async function roundTrip(cycleNum: number, amountMNT: string) {
  const amt = ethers.parseEther(amountMNT);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, wallet);

  const before = await getBalances();
  if (before.mnt < amt + ethers.parseEther('0.003')) {
    console.log(`Cycle ${cycleNum}: Insufficient MNT, skip`);
    return null;
  }

  // MNT → USDT
  const tx1 = await router.exactInputSingle({
    tokenIn: WMNT, tokenOut: USDT, fee: FEE,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: amt, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n,
  }, { value: amt, gasLimit: 300000n });
  await tx1.wait();

  const mid = await getBalances();
  const usdtGot = mid.usdt - before.usdt;

  // USDT → MNT
  await (await usdt.approve(ROUTER, usdtGot)).wait();
  const tx2 = await router.exactInputSingle({
    tokenIn: USDT, tokenOut: WMNT, fee: FEE,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: usdtGot, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n,
  }, { gasLimit: 300000n });
  await tx2.wait();

  const after = await getBalances();
  const profit = after.mnt - before.mnt;

  console.log(`Cycle ${cycleNum} [${amountMNT} MNT]:`);
  console.log(`  TX1: ${tx1.hash}`);
  console.log(`  TX2: ${tx2.hash}`);
  console.log(`  Got: ${ethers.formatUnits(usdtGot, 6)} USDT`);
  console.log(`  Δ: ${ethers.formatEther(profit)} MNT`);
  return { tx1: tx1.hash, tx2: tx2.hash, profit };
}

async function main() {
  const init = await getBalances();
  console.log(`Start: ${ethers.formatEther(init.mnt)} MNT\n`);

  const results = [];
  results.push(await roundTrip(1, '0.1'));
  await new Promise(r => setTimeout(r, 2000));
  results.push(await roundTrip(2, '0.1'));
  await new Promise(r => setTimeout(r, 2000));
  results.push(await roundTrip(3, '0.1'));

  const final = await getBalances();
  const totalProfit = final.mnt - init.mnt;
  console.log(`\n=== FINAL ===`);
  console.log(`MNT: ${ethers.formatEther(final.mnt)}`);
  console.log(`Total Δ: ${ethers.formatEther(totalProfit)} MNT`);
  console.log(`Total txs: ${results.filter(r => r).length * 2}`);
}

main().catch(console.error);

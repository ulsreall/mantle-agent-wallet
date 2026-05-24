import { ethers } from 'ethers';
import * as fs from 'fs';

const cred = JSON.parse(fs.readFileSync('/root/.hermes/credentials/mantle-hackathon-wallet.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
const wallet = new ethers.Wallet(cred.privateKey, provider);

const WMNT = '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8';
const USDT = '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE';
const ROUTER = '0x319b69888b0d11cec22caa5034e25fffbdc88421';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
];

const ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

async function getMntPrice(): Promise<number> {
  try {
    const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd');
    const data = await resp.json() as any;
    return data.mantle?.usd || 0;
  } catch { return 0; }
}

async function main() {
  console.log('🧪 LIVE TEST: On-Chain Transaction\n');
  
  // 1. Check balance
  const mntBal = await provider.getBalance(wallet.address);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);
  const usdtBal = await usdt.balanceOf(wallet.address);
  const price = await getMntPrice();
  
  console.log('=== STEP 1: Wallet Status ===');
  console.log('Address:', wallet.address);
  console.log('MNT:', ethers.formatEther(mntBal));
  console.log('USDT:', ethers.formatUnits(usdtBal, 6));
  console.log('Price:', '$' + price.toFixed(4));
  console.log('USD Value:', '$' + (Number(ethers.formatEther(mntBal)) * price).toFixed(2));

  // 2. Execute swap: 0.05 MNT → USDT
  const amt = ethers.parseEther('0.05');
  console.log('\n=== STEP 2: Swap 0.05 MNT → USDT ===');
  
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const tx1 = await router.exactInputSingle({
    tokenIn: WMNT,
    tokenOut: USDT,
    fee: 500,
    recipient: wallet.address,
    deadline,
    amountIn: amt,
    amountOutMinimum: 0n,
    sqrtPriceLimitX96: 0n,
  }, { value: amt, gasLimit: 300000n });

  console.log('TX Hash:', tx1.hash);
  console.log('Waiting for confirmation...');
  const r1 = await tx1.wait();
  console.log('✅ Confirmed! Block:', r1.blockNumber);

  // 3. Check new balance
  const midMnt = await provider.getBalance(wallet.address);
  const midUsdt = await usdt.balanceOf(wallet.address);
  const usdtReceived = midUsdt - usdtBal;
  
  console.log('\n=== STEP 3: Result ===');
  console.log('USDT Received:', ethers.formatUnits(usdtReceived, 6));
  console.log('MNT Remaining:', ethers.formatEther(midMnt));
  console.log('Effective Price:', (Number(ethers.formatUnits(usdtReceived, 6)) / 0.05).toFixed(4), 'USDT/MNT');

  // 4. Swap back USDT → MNT
  console.log('\n=== STEP 4: Swap USDT → MNT ===');
  await (await usdt.approve(ROUTER, usdtReceived)).wait();
  console.log('Approved USDT');

  const tx2 = await router.exactInputSingle({
    tokenIn: USDT,
    tokenOut: WMNT,
    fee: 500,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: usdtReceived,
    amountOutMinimum: 0n,
    sqrtPriceLimitX96: 0n,
  }, { gasLimit: 300000n });

  console.log('TX Hash:', tx2.hash);
  const r2 = await tx2.wait();
  console.log('✅ Confirmed! Block:', r2.blockNumber);

  // 5. Final balance
  const finalMnt = await provider.getBalance(wallet.address);
  const finalUsdt = await usdt.balanceOf(wallet.address);
  const profit = finalMnt - mntBal;

  console.log('\n=== FINAL RESULT ===');
  console.log('MNT:', ethers.formatEther(finalMnt));
  console.log('USDT:', ethers.formatUnits(finalUsdt, 6));
  console.log('Round-trip Δ:', ethers.formatEther(profit), 'MNT');
  console.log('\n📋 TX URLs:');
  console.log('  Swap 1: https://mantlescan.xyz/tx/' + tx1.hash);
  console.log('  Swap 2: https://mantlescan.xyz/tx/' + tx2.hash);
}

main().catch(console.error);

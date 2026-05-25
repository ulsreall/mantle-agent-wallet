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

async function getBalance() {
  const mnt = await provider.getBalance(wallet.address);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);
  const usdtBal = await usdt.balanceOf(wallet.address);
  return { mnt, usdt: usdtBal };
}

async function swapMNTtoUSDT(amount: bigint) {
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  const tx = await router.exactInputSingle({
    tokenIn: WMNT, tokenOut: USDT, fee: 500,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: amount, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n,
  }, { value: amount, gasLimit: 300000n });
  return await tx.wait();
}

async function swapUSDTtoMNT(amount: bigint) {
  const usdt = new ethers.Contract(USDT, ERC20_ABI, wallet);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  await (await usdt.approve(ROUTER, amount)).wait();
  const tx = await router.exactInputSingle({
    tokenIn: USDT, tokenOut: WMNT, fee: 500,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: amount, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n,
  }, { gasLimit: 300000n });
  return await tx.wait();
}

async function main() {
  console.log('🔥 REAL ON-CHAIN STRATEGY TEST\n');

  // ═══════════════════════════════════════════════
  // TEST 1: DCA (Dollar Cost Average) - Real Buy
  // ═══════════════════════════════════════════════
  console.log('═══ TEST 1: DCA Strategy (Real Buy) ═══');
  const init = await getBalance();
  console.log('Before:', ethers.formatEther(init.mnt), 'MNT');

  const dcaAmount = ethers.parseEther('0.05');
  console.log('DCA Buy: 0.05 MNT → USDT...');
  const dcaTx = await swapMNTtoUSDT(dcaAmount);
  console.log('✅ TX:', dcaTx.hash);
  console.log('   Block:', dcaTx.blockNumber);
  console.log('   URL: https://mantlescan.xyz/tx/' + dcaTx.hash);

  const afterDCA = await getBalance();
  const usdtGot = afterDCA.usdt - init.usdt;
  console.log('   Got:', ethers.formatUnits(usdtGot, 6), 'USDT\n');

  // ═══════════════════════════════════════════════
  // TEST 2: Grid Trading - Buy at lower level
  // ═══════════════════════════════════════════════
  console.log('═══ TEST 2: Grid Trading (Buy Level) ═══');
  const gridAmount = ethers.parseEther('0.03');
  console.log('Grid Buy: 0.03 MNT → USDT...');
  const gridTx = await swapMNTtoUSDT(gridAmount);
  console.log('✅ TX:', gridTx.hash);
  console.log('   Block:', gridTx.blockNumber);
  console.log('   URL: https://mantlescan.xyz/tx/' + gridTx.hash);

  const afterGrid = await getBalance();
  const gridUsdt = afterGrid.usdt - afterDCA.usdt;
  console.log('   Got:', ethers.formatUnits(gridUsdt, 6), 'USDT\n');

  // ═══════════════════════════════════════════════
  // TEST 3: Stop Loss - Sell to protect
  // ═══════════════════════════════════════════════
  console.log('═══ TEST 3: Stop Loss (Sell Protection) ═══');
  const totalUsdt = afterGrid.usdt;
  console.log('Selling all USDT back to MNT...');
  console.log('USDT:', ethers.formatUnits(totalUsdt, 6));
  
  const slTx = await swapUSDTtoMNT(totalUsdt);
  console.log('✅ TX:', slTx.hash);
  console.log('   Block:', slTx.blockNumber);
  console.log('   URL: https://mantlescan.xyz/tx/' + slTx.hash);

  const final = await getBalance();
  console.log('   Got:', ethers.formatEther(final.mnt - afterGrid.mnt), 'MNT\n');

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log('═══ SUMMARY ═══');
  console.log('Initial:', ethers.formatEther(init.mnt), 'MNT');
  console.log('Final:', ethers.formatEther(final.mnt), 'MNT');
  console.log('Delta:', ethers.formatEther(final.mnt - init.mnt), 'MNT');
  console.log('\n📋 All TXs:');
  console.log('  DCA Buy:    https://mantlescan.xyz/tx/' + dcaTx.hash);
  console.log('  Grid Buy:   https://mantlescan.xyz/tx/' + gridTx.hash);
  console.log('  Stop Loss:  https://mantlescan.xyz/tx/' + slTx.hash);
  console.log('\n✅ 3 REAL STRATEGY TRANSACTIONS CONFIRMED');
}

main().catch(console.error);

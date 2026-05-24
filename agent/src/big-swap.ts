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

async function main() {
  const init = await getBalances();
  console.log('=== INITIAL ===');
  console.log('MNT:', ethers.formatEther(init.mnt));
  console.log('USDT:', ethers.formatUnits(init.usdt, 6));
  console.log('USD:', (Number(ethers.formatEther(init.mnt)) * 0.655).toFixed(2));

  const amt = ethers.parseEther('0.3');
  console.log('\n=== SWAP 0.3 MNT → USDT ===');
  
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const params = {
    tokenIn: WMNT,
    tokenOut: USDT,
    fee: FEE,
    recipient: wallet.address,
    deadline: deadline,
    amountIn: amt,
    amountOutMinimum: 0n,
    sqrtPriceLimitX96: 0n,
  };

  const tx = await router.exactInputSingle(params, { value: amt, gasLimit: 300000n });
  console.log('TX:', tx.hash);
  await tx.wait();
  console.log('Confirmed!');

  const mid = await getBalances();
  const usdtGot = mid.usdt - init.usdt;
  console.log('Got:', ethers.formatUnits(usdtGot, 6), 'USDT');
  console.log('MNT left:', ethers.formatEther(mid.mnt));

  // Swap back USDT → MNT
  console.log('\n=== SWAP USDT → MNT ===');
  const usdt = new ethers.Contract(USDT, ERC20_ABI, wallet);
  const approveTx = await usdt.approve(ROUTER, usdtGot);
  await approveTx.wait();
  console.log('Approved');

  const params2 = {
    tokenIn: USDT,
    tokenOut: WMNT,
    fee: FEE,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: usdtGot,
    amountOutMinimum: 0n,
    sqrtPriceLimitX96: 0n,
  };

  const tx2 = await router.exactInputSingle(params2, { gasLimit: 300000n });
  console.log('TX:', tx2.hash);
  await tx2.wait();
  console.log('Confirmed!');

  const final = await getBalances();
  const profit = final.mnt - init.mnt;
  console.log('\n=== RESULT ===');
  console.log('MNT:', ethers.formatEther(final.mnt));
  console.log('USDT:', ethers.formatUnits(final.usdt, 6));
  console.log('Profit:', ethers.formatEther(profit), 'MNT');
  console.log('Profit USD:', (Number(ethers.formatEther(profit)) * 0.655).toFixed(4));
  console.log('ROI:', ((Number(profit) / 0.3) * 100).toFixed(4) + '%');
}

main().catch(console.error);

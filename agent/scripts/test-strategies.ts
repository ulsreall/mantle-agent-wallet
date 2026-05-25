import { ethers } from 'ethers';
import * as fs from 'fs';

const cred = JSON.parse(fs.readFileSync('/root/.hermes/credentials/mantle-hackathon-wallet.json', 'utf8'));
const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
const wallet = new ethers.Wallet(cred.privateKey, provider);

// ═══════════════════════════════════════════════════════════
//                    TEST 1: PRICE MONITOR
// ═══════════════════════════════════════════════════════════

async function testPriceMonitor() {
  console.log('=== TEST 1: Price Monitor ===');
  
  const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd&include_24hr_change=true');
  const data = await resp.json() as any;
  const mnt = data.mantle;
  
  console.log('MNT Price:', '$' + mnt.usd.toFixed(4));
  console.log('24h Change:', mnt.usd_24h_change?.toFixed(2) + '%');
  console.log('Status:', mnt.usd_24h_change > 0 ? '📈 UP' : '📉 DOWN');
  return mnt.usd;
}

// ═══════════════════════════════════════════════════════════
//                    TEST 2: DEX QUOTE COMPARISON
// ═══════════════════════════════════════════════════════════

async function testDEXQuotes() {
  console.log('\n=== TEST 2: DEX Quote Comparison ===');
  
  const WMNT = '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8';
  const USDT = '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE';
  
  const dexes = [
    { name: 'Agni V3', router: '0x319b69888b0d11cec22caa5034e25fffbdc88421' },
    { name: 'Merchant Moe', router: '0x88a8984f2b8507bbc1c699594e3a4ecdefed4784' },
  ];

  const amount = ethers.parseEther('0.1');
  const ROUTER_ABI = [
    'function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)',
  ];

  for (const dex of dexes) {
    try {
      const router = new ethers.Contract(dex.router, ROUTER_ABI, provider);
      const out = await router.exactInputSingle.staticCall(
        [WMNT, USDT, 500, wallet.address, Math.floor(Date.now()/1000)+600, amount, 0n, 0n],
        { value: amount }
      );
      const price = Number(ethers.formatUnits(out, 6)) / 0.1;
      console.log(`${dex.name}: 0.1 MNT → ${ethers.formatUnits(out, 6)} USDT (${price.toFixed(4)} USDT/MNT)`);
    } catch (e: any) {
      console.log(`${dex.name}: Quote failed - ${e.message?.substring(0, 60)}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
//                    TEST 3: GRID LEVELS
// ═══════════════════════════════════════════════════════════

async function testGridLevels(currentPrice: number) {
  console.log('\n=== TEST 3: Grid Trading Levels ===');
  
  const lower = currentPrice * 0.95;
  const upper = currentPrice * 1.05;
  const levels = 5;
  const step = (upper - lower) / levels;

  console.log(`Range: $${lower.toFixed(4)} - $${upper.toFixed(4)}`);
  console.log(`Current: $${currentPrice.toFixed(4)}`);
  console.log('');

  for (let i = 0; i <= levels; i++) {
    const price = lower + (step * i);
    const type = price < currentPrice ? '🟢 BUY' : '🔴 SELL';
    const distance = ((price - currentPrice) / currentPrice * 100).toFixed(2);
    console.log(`Level ${i}: $${price.toFixed(4)} ${type} (${distance}% from current)`);
  }
}

// ═══════════════════════════════════════════════════════════
//                    TEST 4: STOP LOSS CHECK
// ═══════════════════════════════════════════════════════════

async function testStopLoss(currentPrice: number) {
  console.log('\n=== TEST 4: Stop Loss / Take Profit ===');
  
  const entryPrice = currentPrice;
  const stopLoss = entryPrice * 0.9;
  const takeProfit = entryPrice * 1.15;
  const trailing = 5;

  console.log(`Entry: $${entryPrice.toFixed(4)}`);
  console.log(`Stop Loss: $${stopLoss.toFixed(4)} (-10%)`);
  console.log(`Take Profit: $${takeProfit.toFixed(4)} (+15%)`);
  console.log(`Trailing Stop: ${trailing}% from peak`);
  console.log('');

  // Simulate price scenarios
  const scenarios = [
    { price: currentPrice * 0.95, label: 'Price drops 5%' },
    { price: currentPrice * 0.88, label: 'Price drops 12%' },
    { price: currentPrice * 1.10, label: 'Price rises 10%' },
    { price: currentPrice * 1.20, label: 'Price rises 20%' },
  ];

  for (const s of scenarios) {
    const hitSL = s.price <= stopLoss;
    const hitTP = s.price >= takeProfit;
    const status = hitSL ? '🔴 STOP LOSS HIT' : hitTP ? '🟢 TAKE PROFIT HIT' : '⏳ HOLD';
    console.log(`${s.label}: $${s.price.toFixed(4)} → ${status}`);
  }
}

// ═══════════════════════════════════════════════════════════
//                    TEST 5: WALLET STATS
// ═══════════════════════════════════════════════════════════

async function testWalletStats() {
  console.log('\n=== TEST 5: Wallet Stats ===');
  
  const mntBal = await provider.getBalance(wallet.address);
  const txCount = await provider.getTransactionCount(wallet.address);
  
  console.log('Address:', wallet.address);
  console.log('MNT:', ethers.formatEther(mntBal));
  console.log('Tx Count:', txCount);
  console.log('Explorer:', `https://mantlescan.xyz/address/${wallet.address}`);
}

// ═══════════════════════════════════════════════════════════
//                    MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('🧪 MANTLEAGENT FEATURE TEST\n');
  console.log('━'.repeat(50));
  
  const price = await testPriceMonitor();
  await testDEXQuotes();
  await testGridLevels(price);
  await testStopLoss(price);
  await testWalletStats();
  
  console.log('\n' + '━'.repeat(50));
  console.log('✅ ALL FEATURES TESTED');
}

main().catch(console.error);

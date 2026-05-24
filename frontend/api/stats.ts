import type { VercelRequest, VercelResponse } from '@vercel/node';

// ═══════════════════════════════════════════════════════════════
//                    WALLET STATS API
// ═══════════════════════════════════════════════════════════════

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const address = req.query.address || '0x34177FAb96D410BD2CFA468c1b1ef27bEF46793B';

    // Get MNT balance
    const mntResp = await fetch('https://rpc.mantle.xyz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    const mntData = await mntResp.json() as any;
    const mntBalance = parseInt(mntData.result, 16) / 1e18;

    // Get MNT price
    const priceResp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd');
    const priceData = await priceResp.json() as any;
    const mntPrice = priceData.mantle?.usd || 0;

    // Get tx count
    const txCountResp = await fetch('https://rpc.mantle.xyz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
      }),
    });
    const txCountData = await txCountResp.json() as any;
    const txCount = parseInt(txCountData.result, 16);

    return res.status(200).json({
      success: true,
      address,
      balance: {
        mnt: mntBalance.toFixed(4),
        usd: (mntBalance * mntPrice).toFixed(2),
      },
      mntPrice,
      txCount,
      erc8004: {
        tokenId: 98,
        network: 'mantle',
        url: 'https://8004scan.io/agents/mantle/98',
      },
      contract: '0xb22c73495353fe732CAFD4dbFFD6500939BB9507',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

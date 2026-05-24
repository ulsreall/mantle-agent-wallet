import type { VercelRequest, VercelResponse } from '@vercel/node';

// ═══════════════════════════════════════════════════════════════
//                    STRATEGY RECOMMENDATION API
// ═══════════════════════════════════════════════════════════════

interface StrategyRecommendation {
  name: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  expectedReturn: string;
  config: Record<string, any>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Get current MNT price
    const priceResp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd');
    const priceData = await priceResp.json() as any;
    const mntPrice = priceData.mantle?.usd || 0;

    const balance = req.query.balance || '3';
    const balanceNum = parseFloat(balance as string);

    const strategies: StrategyRecommendation[] = [
      {
        name: 'DCA (Dollar Cost Average)',
        description: `Auto-buy ${(balanceNum * 0.05).toFixed(2)} MNT every hour. Best for steady accumulation.`,
        risk: 'low',
        expectedReturn: '5-15% monthly (market dependent)',
        config: {
          amountPerBuy: (balanceNum * 0.05).toFixed(3),
          intervalSeconds: 3600,
          maxBuys: 20,
        },
      },
      {
        name: 'Grid Trading',
        description: `Buy/sell at ${(mntPrice * 0.95).toFixed(4)}-${(mntPrice * 1.05).toFixed(4)} range. Profits from volatility.`,
        risk: 'medium',
        expectedReturn: '10-30% monthly (volatile markets)',
        config: {
          lowerPrice: mntPrice * 0.95,
          upperPrice: mntPrice * 1.05,
          gridLevels: 5,
          amountPerGrid: (balanceNum * 0.1).toFixed(3),
        },
      },
      {
        name: 'Arbitrage Scanner',
        description: 'Scan Agni vs Merchant Moe for price differences. Execute when spread > 0.3%.',
        risk: 'low',
        expectedReturn: '1-5% per opportunity',
        config: {
          minSpreadPercent: 0.3,
          maxAmount: (balanceNum * 0.2).toFixed(3),
        },
      },
      {
        name: 'Stop Loss / Take Profit',
        description: `Protect position: sell if price drops below $${(mntPrice * 0.9).toFixed(4)} or rises above $${(mntPrice * 1.15).toFixed(4)}.`,
        risk: 'low',
        expectedReturn: 'Risk management (limits losses)',
        config: {
          stopLossPrice: mntPrice * 0.9,
          takeProfitPrice: mntPrice * 1.15,
          positionSize: (balanceNum * 0.5).toFixed(3),
          trailingStop: true,
          trailingPercent: 5,
        },
      },
    ];

    return res.status(200).json({
      success: true,
      mntPrice,
      balance: balanceNum,
      strategies,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

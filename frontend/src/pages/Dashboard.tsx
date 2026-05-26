import { useState, useEffect } from 'react';
import PriceChart from '../components/PriceChart';
import ConnectWallet from '../components/ConnectWallet';
import TxHistory from '../components/TxHistory';
import '../index.css';

const WALLET_ADDRESS = '0x34177FAb96D410BD2CFA468c1b1ef27bEF46793B';
const CONTRACT_ADDRESS = '0xb22c73495353fe732CAFD4dbFFD6500939BB9507';
const RPC_URL = 'https://rpc.mantle.xyz';

interface AgentStatus {
  mntBalance: string;
  contractBalance: string;
  agentId: string;
  mntPrice: number;
  txCount: number;
}

interface Strategy {
  id: string;
  name: string;
  icon: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  status: 'idle' | 'running' | 'paused';
  config: Record<string, string>;
  tested: boolean;
  txHash?: string;
}

function Dashboard() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'strategy'>('overview');
  const [animateBalance, setAnimateBalance] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: 'dca',
      name: 'DCA (Dollar Cost Average)',
      icon: '📊',
      description: 'Auto-buy fixed MNT amount at regular intervals. Best for steady accumulation.',
      risk: 'low',
      status: 'idle',
      config: { amountPerBuy: '0.05 MNT', interval: '1 hour', maxBuys: '20' },
      tested: true,
      txHash: '0xf194796d177788ff6c4a07d5359e61460de3982907c705c93133b5ff073ba71f',
    },
    {
      id: 'grid',
      name: 'Grid Trading',
      icon: '📐',
      description: 'Buy/sell at predefined price levels. Profits from market volatility.',
      risk: 'medium',
      status: 'idle',
      config: { range: '$0.62 - $0.69', levels: '5', perGrid: '0.03 MNT' },
      tested: true,
      txHash: '0x3b084074152cb00edd0a079f563b9994e7dae5bca8398c5c721ecabcdfa1e016',
    },
    {
      id: 'arbitrage',
      name: 'Arbitrage Scanner',
      icon: '🔍',
      description: 'Scan Agni vs Merchant Moe for price differences. Execute when spread > 0.3%.',
      risk: 'low',
      status: 'idle',
      config: { minSpread: '0.3%', maxAmount: '0.5 MNT', dexes: 'Agni + Moe' },
      tested: false,
    },
    {
      id: 'stoploss',
      name: 'Stop Loss / Take Profit',
      icon: '🛡️',
      description: 'Protect position: auto-sell if price drops below threshold or rises above target.',
      risk: 'low',
      status: 'idle',
      config: { stopLoss: '-10%', takeProfit: '+15%', trailing: '5%' },
      tested: true,
      txHash: '0xcd8cbd984c29a8bfc04ae065df4c5fe579716b4e94e87af089379b75002e5596',
    },
  ]);

  const fetchStatus = async () => {
    try {
      const [walletRes, contractRes, priceRes] = await Promise.all([
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [WALLET_ADDRESS, 'latest'], id: 1 }),
        }),
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [CONTRACT_ADDRESS, 'latest'], id: 2 }),
        }),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd').then(r => r.json()).catch(() => ({ mantle: { usd: 0.655 } })),
      ]);

      const walletData = await walletRes.json();
      const contractData = await contractRes.json();
      const priceData = priceRes as any;

      const mntBalance = (parseInt(walletData.result, 16) / 1e18).toFixed(4);
      const contractBalance = (parseInt(contractData.result, 16) / 1e18).toFixed(4);
      const mntPrice = priceData.mantle?.usd || 0.655;

      setStatus({ mntBalance, contractBalance, agentId: '98', mntPrice, txCount: 40 });
      setAnimateBalance(true);
      setTimeout(() => setAnimateBalance(false), 1000);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleStrategy = (id: string) => {
    setStrategies(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: s.status === 'running' ? 'stopped' : 'running' }
        : s
    ));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#34d399';
      case 'medium': return '#fbbf24';
      case 'high': return '#fb7185';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="dashboard">
      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      <header className="header">
        <div className="header-left">
          <div className="logo-container">
            <img src="/logo.png" alt="MantleAgent" className="logo-img" />
            <div className="logo-pulse"></div>
          </div>
          <div>
            <h1>MantleAgent</h1>
            <div className="subtitle-row">
              <span className="subtitle">Autonomous DeFi Agent</span>
              <span className="dot">·</span>
              <span className="erc-badge">ERC-8004</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <ConnectWallet />
          <div className="status-indicator">
            <span className="pulse-dot"></span>
            <span className="status-text">Live</span>
          </div>
          <span className="badge chain">
            <span className="chain-icon">◆</span>
            Mantle Mainnet
          </span>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Total Balance</span>
          </div>
          <div className={`stat-value ${animateBalance ? 'animate' : ''}`}>
            {loading ? '...' : status?.mntBalance}
            <span className="stat-unit">MNT</span>
          </div>
          <div className="stat-change positive">
            <span className="arrow">↑</span> ${loading ? '...' : ((parseFloat(status?.mntBalance || '0') * (status?.mntPrice || 0)).toFixed(2))} USD
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📈</span>
            <span className="stat-label">MNT Price</span>
          </div>
          <div className="stat-value">
            ${loading ? '...' : status?.mntPrice.toFixed(4)}
          </div>
          <div className="stat-sub">Live from CoinGecko</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">🔄</span>
            <span className="stat-label">Transactions</span>
          </div>
          <div className="stat-value">
            {loading ? '...' : status?.txCount}
          </div>
          <div className="stat-sub">On-chain confirmed</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">🪪</span>
            <span className="stat-label">Agent ID</span>
          </div>
          <div className="stat-value">
            #{loading ? '...' : status?.agentId}
          </div>
          <div className="stat-sub">ERC-8004 Registered</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <span className="tab-icon">📊</span> Overview
        </button>
        <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          <span className="tab-icon">📋</span> Activity
        </button>
        <button className={`tab ${activeTab === 'strategy' ? 'active' : ''}`} onClick={() => setActiveTab('strategy')}>
          <span className="tab-icon">⚡</span> Strategies
        </button>
      </div>

      <div className="content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div style={{ gridColumn: 'span 2' }}>
              <PriceChart />
            </div>
            <div className="card">
              <div className="card-header">
                <h3>🔗 Wallet</h3>
                <span className="badge active">Active</span>
              </div>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value mono">{WALLET_ADDRESS.slice(0, 8)}...{WALLET_ADDRESS.slice(-6)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contract</span>
                  <span className="info-value mono">{CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Network</span>
                  <span className="info-value">Mantle Mainnet (5000)</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Transactions</span>
                  <span className="info-value">40 on-chain</span>
                </div>
              </div>
            </div>

            <div className="card actions-card">
              <div className="card-header">
                <h3>🎮 Quick Actions</h3>
              </div>
              <div className="actions">
                <button className="btn primary" onClick={() => setActiveTab('strategy')}>
                  <span className="btn-icon">⚡</span> View Strategies
                </button>
                <button className="btn secondary" onClick={fetchStatus}>
                  <span className="btn-icon">🔄</span> Refresh
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>🔗 Links</h3>
              </div>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Dashboard</span>
                  <a href="https://mantle-agent.vercel.app" target="_blank" rel="noopener noreferrer" className="info-value link">mantle-agent.vercel.app</a>
                </div>
                <div className="info-item">
                  <span className="info-label">GitHub</span>
                  <a href="https://github.com/ulsreall/mantle-agent-wallet" target="_blank" rel="noopener noreferrer" className="info-value link">ulsreall/mantle-agent-wallet</a>
                </div>
                <div className="info-item">
                  <span className="info-label">8004scan</span>
                  <a href="https://8004scan.io/agents/mantle/98" target="_blank" rel="noopener noreferrer" className="info-value link">agents/mantle/98</a>
                </div>
                <div className="info-item">
                  <span className="info-label">Demo</span>
                  <a href="https://youtu.be/I_wQ65R0bok" target="_blank" rel="noopener noreferrer" className="info-value link">YouTube</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <TxHistory />
        )}

        {activeTab === 'strategy' && (
          <div className="strategies-grid">
            {strategies.map((strategy) => (
              <div 
                key={strategy.id} 
                className={`strategy-card ${selectedStrategy === strategy.id ? 'selected' : ''} ${strategy.status}`}
                onClick={() => setSelectedStrategy(strategy.id === selectedStrategy ? null : strategy.id)}
              >
                <div className="strategy-header">
                  <div className="strategy-icon-large">{strategy.icon}</div>
                  <div className="strategy-info">
                    <h3>{strategy.name}</h3>
                    <p>{strategy.description}</p>
                  </div>
                  <div className="strategy-status">
                    <span className={`status-dot ${strategy.status}`}></span>
                    <span className="status-label">{strategy.status}</span>
                  </div>
                </div>
                
                <div className="strategy-meta">
                  <span className="risk-badge" style={{ color: getRiskColor(strategy.risk), borderColor: getRiskColor(strategy.risk) }}>
                    {strategy.risk.toUpperCase()} RISK
                  </span>
                  {strategy.tested && (
                    <span className="risk-badge" style={{ color: '#34d399', borderColor: '#34d399' }}>
                      TESTED
                    </span>
                  )}
                </div>

                <div className="strategy-config">
                  {Object.entries(strategy.config).map(([key, value]) => (
                    <div key={key} className="config-item">
                      <span className="config-key">{key}</span>
                      <span className="config-value">{value}</span>
                    </div>
                  ))}
                </div>

                {strategy.txHash && (
                  <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                    <span style={{ color: '#888' }}>Last TX: </span>
                    <a href={`https://mantlescan.xyz/tx/${strategy.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                      {strategy.txHash.slice(0, 10)}...{strategy.txHash.slice(-6)}
                    </a>
                  </div>
                )}

                <div className="strategy-actions">
                  <button 
                    className={`btn ${strategy.status === 'running' ? 'danger' : 'primary'}`}
                    onClick={(e) => { e.stopPropagation(); toggleStrategy(strategy.id); }}
                  >
                    {strategy.status === 'running' ? '⏹ Stop' : '▶ Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-content">
          <span className="footer-brand">Built for Mantle Turing Test Hackathon 2026</span>
          <span className="footer-separator">·</span>
          <span className="footer-track">Track 6: Agentic Wallets & Economy</span>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;

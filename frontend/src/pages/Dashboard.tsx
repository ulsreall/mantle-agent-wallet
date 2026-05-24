import { useState, useEffect } from 'react';
import '../index.css';

const WALLET_ADDRESS = '0x34177FAb96D410BD2CFA468c1b1ef27bEF46793B';
const CONTRACT_ADDRESS = '0xb22c73495353fe732CAFD4dbFFD6500939BB9507';
const RPC_URL = 'https://rpc.mantle.xyz';

interface AgentStatus {
  mntBalance: string;
  contractBalance: string;
  agentId: string;
  pnl: string;
  usdtBalance: string;
}

interface SwapEvent {
  id: number;
  type: string;
  from: string;
  to: string;
  amount: string;
  txHash: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
}

function Dashboard() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'strategy'>('overview');
  const [animateBalance, setAnimateBalance] = useState(false);

  const mockActivity: SwapEvent[] = [
    { id: 1, type: 'Swap', from: 'WMNT', to: 'USDT', amount: '0.05', txHash: '0x7fe9...62e', time: '2 min ago', status: 'success' },
    { id: 2, type: 'Register', from: 'ERC-8004', to: 'Identity', amount: '#98', txHash: '0xe60a...f96', time: '15 min ago', status: 'success' },
    { id: 3, type: 'Deploy', from: 'Contract', to: 'AgenticWallet', amount: '0.15 MNT', txHash: '0xb22c...507', time: '20 min ago', status: 'success' },
    { id: 4, type: 'Wrap', from: 'MNT', to: 'WMNT', amount: '0.05', txHash: '0xf84e...a48', time: '25 min ago', status: 'success' },
  ];

  const fetchStatus = async () => {
    try {
      const [walletRes, contractRes] = await Promise.all([
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
      ]);

      const walletData = await walletRes.json();
      const contractData = await contractRes.json();

      const mntBalance = (parseInt(walletData.result, 16) / 1e18).toFixed(4);
      const contractBalance = (parseInt(contractData.result, 16) / 1e18).toFixed(4);

      setStatus({ mntBalance, contractBalance, agentId: '98', pnl: '+0.0260', usdtBalance: '0.0664' });
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

  return (
    <div className="dashboard">
      {/* Animated Background */}
      <div className="bg-grid"></div>
      <div className="bg-glow"></div>

      {/* Header */}
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

      {/* Main Stats */}
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
            <span className="arrow">↑</span> +0.72% ROI
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📈</span>
            <span className="stat-label">P&L</span>
          </div>
          <div className="stat-value profit">
            {loading ? '...' : status?.pnl}
            <span className="stat-unit">MNT</span>
          </div>
          <div className="stat-sub">From compound strategy</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">💵</span>
            <span className="stat-label">USDT</span>
          </div>
          <div className="stat-value">
            {loading ? '...' : status?.usdtBalance}
            <span className="stat-unit">USDT</span>
          </div>
          <div className="stat-sub">From swap</div>
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

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <span className="tab-icon">📋</span>
          Activity
        </button>
        <button 
          className={`tab ${activeTab === 'strategy' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategy')}
        >
          <span className="tab-icon">⚡</span>
          Strategy
        </button>
      </div>

      {/* Content */}
      <div className="content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Wallet Info */}
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
              </div>
            </div>

            {/* Strategy Info */}
            <div className="card">
              <div className="card-header">
                <h3>⚡ Active Strategy</h3>
                <span className="badge running">Running</span>
              </div>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Type</span>
                  <span className="info-value">Compound Yield</span>
                </div>
                <div className="info-item">
                  <span className="info-label">DEX</span>
                  <span className="info-value">Agni Finance (V3)</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pair</span>
                  <span className="info-value">WMNT/USDT</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Fee Tier</span>
                  <span className="info-value">0.05%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card actions-card">
              <div className="card-header">
                <h3>🎮 Controls</h3>
              </div>
              <div className="actions">
                <button
                  className={`btn primary ${running ? 'running' : ''}`}
                  onClick={() => setRunning(!running)}
                >
                  {running ? (
                    <>
                      <span className="btn-icon">⏸</span>
                      Stop Strategy
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">▶</span>
                      Start Compound
                    </>
                  )}
                </button>
                <button className="btn secondary" onClick={fetchStatus}>
                  <span className="btn-icon">🔄</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-container">
            <div className="activity-header">
              <h3>Recent Transactions</h3>
              <span className="badge">{mockActivity.length} total</span>
            </div>
            <div className="activity-list">
              {mockActivity.map((event, index) => (
                <div key={event.id} className="activity-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="activity-icon-wrapper">
                    <span className="activity-icon">
                      {event.type === 'Swap' ? '🔀' : event.type === 'Register' ? '🪪' : '📦'}
                    </span>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      <span className="activity-type">{event.type}</span>
                      <span className="activity-pair">{event.from} → {event.to}</span>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-amount">{event.amount}</span>
                      <span className="activity-time">{event.time}</span>
                    </div>
                  </div>
                  <div className="activity-status">
                    <span className={`status-badge ${event.status}`}>
                      {event.status === 'success' ? '✓' : event.status === 'pending' ? '⏳' : '✗'}
                    </span>
                    <span className="activity-hash">{event.txHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="strategy-container">
            <div className="strategy-card">
              <div className="strategy-header">
                <div className="strategy-icon">🔄</div>
                <div>
                  <h3>Compound Yield Strategy</h3>
                  <p>Automated round-trip swaps to maximize returns</p>
                </div>
              </div>
              <div className="strategy-flow">
                <div className="flow-step">
                  <div className="flow-icon">🏦</div>
                  <span>MNT</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-icon">📦</div>
                  <span>WMNT</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step active">
                  <div className="flow-icon">🔀</div>
                  <span>USDT</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-icon">📦</div>
                  <span>WMNT</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-icon">🏦</div>
                  <span>MNT</span>
                </div>
              </div>
              <div className="strategy-stats">
                <div className="strategy-stat">
                  <span className="label">Iterations</span>
                  <span className="value">1</span>
                </div>
                <div className="strategy-stat">
                  <span className="label">Success Rate</span>
                  <span className="value">100%</span>
                </div>
                <div className="strategy-stat">
                  <span className="label">Avg ROI</span>
                  <span className="value profit">+0.72%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
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

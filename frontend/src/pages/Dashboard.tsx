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
}

function Dashboard() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

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

      setStatus({ mntBalance, contractBalance, agentId: '98', pnl: '0.0000' });
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
      <header className="header">
        <div className="header-left">
          <div className="logo">🤖</div>
          <div>
            <h1>MantleAgent</h1>
            <span className="subtitle">Autonomous DeFi Agent · ERC-8004</span>
          </div>
        </div>
        <div className="header-right">
          <span className="badge active">● Active</span>
          <span className="badge chain">Mantle Mainnet</span>
        </div>
      </header>

      <div className="grid">
        {/* Identity Card */}
        <div className="card">
          <h3>🪪 Agent Identity</h3>
          <div className="stat-row">
            <span className="label">ERC-8004 Token ID</span>
            <span className="value">#98</span>
          </div>
          <div className="stat-row">
            <span className="label">Registry</span>
            <span className="value mono">0x8004...a432</span>
          </div>
          <div className="stat-row">
            <span className="label">Status</span>
            <span className="value"><span className="badge active">Active</span> <span className="badge reputation">Reputation</span></span>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="card">
          <h3>💰 Wallet</h3>
          <div className="stat-row">
            <span className="label">Address</span>
            <span className="value mono">{WALLET_ADDRESS.slice(0, 10)}...{WALLET_ADDRESS.slice(-8)}</span>
          </div>
          <div className="stat-row">
            <span className="label">MNT Balance</span>
            <span className="value highlight">{loading ? '...' : status?.mntBalance} MNT</span>
          </div>
          <div className="stat-row">
            <span className="label">Contract Balance</span>
            <span className="value">{loading ? '...' : status?.contractBalance} MNT</span>
          </div>
        </div>

        {/* Strategy Card */}
        <div className="card">
          <h3>📊 Strategy</h3>
          <div className="stat-row">
            <span className="label">Active Strategy</span>
            <span className="value">Compound Yield</span>
          </div>
          <div className="stat-row">
            <span className="label">DEX</span>
            <span className="value">Agni Finance (V3)</span>
          </div>
          <div className="stat-row">
            <span className="label">Pair</span>
            <span className="value">WMNT/USDT</span>
          </div>
          <div className="stat-row">
            <span className="label">Fee Tier</span>
            <span className="value">0.05%</span>
          </div>
        </div>

        {/* P&L Card */}
        <div className="card">
          <h3>📈 Performance</h3>
          <div className="stat-row">
            <span className="label">Total P&L</span>
            <span className={`value ${parseFloat(status?.pnl || '0') >= 0 ? 'profit' : 'loss'}`}>
              {loading ? '...' : `${parseFloat(status?.pnl || '0') >= 0 ? '+' : ''}${status?.pnl}`} MNT
            </span>
          </div>
          <div className="stat-row">
            <span className="label">Swaps Executed</span>
            <span className="value">1</span>
          </div>
          <div className="stat-row">
            <span className="label">Success Rate</span>
            <span className="value">100%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card actions-card">
        <h3>⚡ Actions</h3>
        <div className="actions">
          <button
            className={`btn primary ${running ? 'running' : ''}`}
            onClick={() => setRunning(!running)}
          >
            {running ? '⏸ Stop Strategy' : '▶ Start Compound Strategy'}
          </button>
          <button className="btn secondary" onClick={fetchStatus}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3>📋 Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">🔀</span>
            <div className="activity-content">
              <span className="activity-title">Swap WMNT → USDT</span>
              <span className="activity-meta">Agni · Fee 500 · 0.05 MNT</span>
            </div>
            <span className="activity-status success">✅</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🪪</span>
            <div className="activity-content">
              <span className="activity-title">ERC-8004 Registered</span>
              <span className="activity-meta">Token ID #98 · Mantle Mainnet</span>
            </div>
            <span className="activity-status success">✅</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">📦</span>
            <div className="activity-content">
              <span className="activity-title">Contract Deployed</span>
              <span className="activity-meta">AgenticWallet · 0xb22c...9507</span>
            </div>
            <span className="activity-status success">✅</span>
          </div>
        </div>
      </div>

      <footer className="footer">
        <span>Built for Mantle Turing Test Hackathon 2026 · Track 6: Agentic Wallets & Economy</span>
      </footer>
    </div>
  );
}

export default Dashboard;

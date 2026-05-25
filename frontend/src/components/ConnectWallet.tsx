import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

// Inline styles matching the existing dark theme CSS variables
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  connectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  connectBtnHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
  },
  connectBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  walletInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 8px 8px 16px',
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  networkBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(124, 58, 237, 0.1)',
    color: '#a78bfa',
    border: '1px solid rgba(124, 58, 237, 0.3)',
  },
  wrongNetworkBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    cursor: 'pointer',
  },
  addressContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  address: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    fontWeight: 600,
    color: '#a78bfa',
    letterSpacing: '0.3px',
  },
  balance: {
    fontSize: '11px',
    color: '#888',
    fontWeight: 500,
  },
  disconnectBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    border: '1px solid #2a2a3e',
    background: '#12121a',
    color: '#666',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  disconnectBtnHover: {
    borderColor: '#ef4444',
    color: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
  },
  error: {
    fontSize: '12px',
    color: '#ef4444',
    maxWidth: '200px',
    textAlign: 'center' as const,
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    display: 'inline-block',
  },
};

export function ConnectWallet() {
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    error,
    isMantleNetwork,
    connect,
    disconnect,
    switchToMantle,
    truncateAddress,
  } = useWallet();

  const [hoverBtn, setHoverBtn] = useState<string | null>(null);

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          style={{
            ...styles.connectBtn,
            ...(isConnecting ? styles.connectBtnDisabled : {}),
            ...(hoverBtn === 'connect' && !isConnecting ? styles.connectBtnHover : {}),
          }}
          onClick={connect}
          disabled={isConnecting}
          onMouseEnter={() => setHoverBtn('connect')}
          onMouseLeave={() => setHoverBtn(null)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <span style={styles.error}>{error}</span>}
      </div>
    );
  }

  // Connected - show address, balance, network, disconnect
  return (
    <div style={styles.container}>
      {/* Network badge */}
      {isMantleNetwork ? (
        <span style={styles.networkBadge}>
          <span style={{ fontSize: '8px' }}>◆</span>
          Mantle
        </span>
      ) : (
        <span
          style={{
            ...styles.wrongNetworkBadge,
            ...(hoverBtn === 'switch' ? { background: 'rgba(245, 158, 11, 0.2)' } : {}),
          }}
          onClick={switchToMantle}
          onMouseEnter={() => setHoverBtn('switch')}
          onMouseLeave={() => setHoverBtn(null)}
          title="Click to switch to Mantle Mainnet"
        >
          ⚠ Switch Network
        </span>
      )}

      {/* Wallet info pill */}
      <div style={styles.walletInfo}>
        <div style={styles.dot} />
        <div style={styles.addressContainer}>
          <span style={styles.address}>
            {address ? truncateAddress(address) : ''}
          </span>
          <span style={styles.balance}>
            {balance ? `${balance} MNT` : '...'}
          </span>
        </div>

        {/* Disconnect button */}
        <button
          style={{
            ...styles.disconnectBtn,
            ...(hoverBtn === 'disconnect' ? styles.disconnectBtnHover : {}),
          }}
          onClick={disconnect}
          onMouseEnter={() => setHoverBtn('disconnect')}
          onMouseLeave={() => setHoverBtn(null)}
          title="Disconnect"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ConnectWallet;

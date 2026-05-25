import React, { useEffect, useState } from 'react';

interface Transaction {
  hash: string;
  methodId: string;
  functionName: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  timeStamp: string;
  isError: string;
  txreceipt_status: string;
  input: string;
}

const WALLET_ADDRESS = '0x34177FAb96D410BD2CFA468c1b1ef27bEF46793B';
const API_URL = `https://api.routescan.io/v2/network/mainnet/evm/5000/etherscan/api?module=account&action=txlist&address=${WALLET_ADDRESS}&startblock=0&endblock=99999999&sort=desc`;
const ITEMS_PER_PAGE = 10;

const truncateHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;

const formatValue = (wei: string) => {
  const val = parseFloat(wei) / 1e18;
  return val === 0 ? '0' : val.toFixed(4);
};

const formatTimestamp = (ts: string) => {
  const date = new Date(parseInt(ts) * 1000);
  return date.toLocaleString();
};

const getMethodName = (tx: Transaction): string => {
  if (tx.functionName && tx.functionName.trim()) return tx.functionName;
  if (tx.methodId === '0x' || tx.input === '0x') return 'Transfer';
  return tx.methodId ? `Call (${tx.methodId.slice(0, 10)})` : 'Unknown';
};

const TxHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === '1' && Array.isArray(data.result)) {
          setTransactions(data.result);
        } else {
          setError(data.message || 'Failed to fetch transactions');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const currentTxs = transactions.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Transaction History</h2>
      <div style={styles.addressBadge}>
        {WALLET_ADDRESS}
      </div>

      {loading && <div style={styles.status}>Loading transactions...</div>}
      {error && <div style={{ ...styles.status, color: '#ff6b6b' }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tx Hash</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Value (MNT)</th>
                  <th style={styles.th}>Gas Used</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentTxs.map((tx, i) => (
                  <tr key={tx.hash + i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>
                      <a
                        href={`https://mantlescan.xyz/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        {truncateHash(tx.hash)}
                      </a>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.methodBadge}>{getMethodName(tx)}</span>
                    </td>
                    <td style={styles.td}>{formatValue(tx.value)}</td>
                    <td style={styles.td}>{parseInt(tx.gasUsed).toLocaleString()}</td>
                    <td style={styles.td}>{formatTimestamp(tx.timeStamp)}</td>
                    <td style={styles.td}>
                      {tx.isError === '0' ? (
                        <span style={styles.statusSuccess}>✓ Success</span>
                      ) : (
                        <span style={styles.statusFail}>✗ Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={page === 1 ? styles.btnDisabled : styles.btn}
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                «
              </button>
              <button
                style={page === 1 ? styles.btnDisabled : styles.btn}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ‹
              </button>
              <span style={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                style={page === totalPages ? styles.btnDisabled : styles.btn}
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ›
              </button>
              <button
                style={page === totalPages ? styles.btnDisabled : styles.btn}
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </button>
            </div>
          )}

          <div style={styles.footer}>
            Showing {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, transactions.length)} of {transactions.length} transactions
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '100%',
    overflowX: 'auto',
  },
  title: {
    color: '#58a6ff',
    fontSize: '20px',
    marginBottom: '8px',
  },
  addressBadge: {
    backgroundColor: '#161b22',
    color: '#8b949e',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    marginBottom: '20px',
    display: 'inline-block',
  },
  status: {
    color: '#8b949e',
    padding: '20px',
    textAlign: 'center' as const,
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    borderRadius: '8px',
    border: '1px solid #21262d',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#161b22',
    color: '#58a6ff',
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 600,
    borderBottom: '1px solid #21262d',
    whiteSpace: 'nowrap' as const,
  },
  rowEven: {
    backgroundColor: '#0d1117',
  },
  rowOdd: {
    backgroundColor: '#161b22',
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid #21262d',
    whiteSpace: 'nowrap' as const,
  },
  link: {
    color: '#58a6ff',
    textDecoration: 'none',
    fontFamily: 'monospace',
  },
  methodBadge: {
    backgroundColor: '#1f2937',
    color: '#a5b4fc',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  statusSuccess: {
    color: '#3fb950',
    fontWeight: 600,
  },
  statusFail: {
    color: '#f85149',
    fontWeight: 600,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
  },
  btn: {
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnDisabled: {
    backgroundColor: '#161b22',
    color: '#484f58',
    border: '1px solid #21262d',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'not-allowed',
    fontSize: '14px',
  },
  pageInfo: {
    color: '#8b949e',
    fontSize: '13px',
    padding: '0 8px',
  },
  footer: {
    color: '#484f58',
    fontSize: '12px',
    textAlign: 'center' as const,
    marginTop: '12px',
  },
};

export default TxHistory;

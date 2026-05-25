import { useState, useEffect, useRef, useCallback } from 'react';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface ChartData {
  prices: [number, number][];
}

function PriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [high24h, setHigh24h] = useState<number>(0);
  const [low24h, setLow24h] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPriceData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/mantle/market_chart?vs_currency=usd&days=1'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }

      const data: ChartData = await response.json();
      
      if (data.prices && data.prices.length > 0) {
        const points: PricePoint[] = data.prices.map(([timestamp, price]) => ({
          timestamp,
          price,
        }));

        setPriceData(points);
        
        const prices = points.map(p => p.price);
        const current = prices[prices.length - 1];
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const first = prices[0];
        const change = ((current - first) / first) * 100;

        setCurrentPrice(current);
        setHigh24h(high);
        setLow24h(low);
        setPriceChange24h(change);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriceData();
    const interval = setInterval(fetchPriceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchPriceData]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate bounds
    const prices = priceData.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 0.001;

    // Add some padding to price range
    const paddedMin = minPrice - priceRange * 0.1;
    const paddedMax = maxPrice + priceRange * 0.1;
    const paddedRange = paddedMax - paddedMin;

    // Helper functions
    const getX = (index: number) => 
      padding.left + (index / (priceData.length - 1)) * (width - padding.left - padding.right);
    
    const getY = (price: number) => 
      padding.top + ((paddedMax - price) / paddedRange) * (height - padding.top - padding.bottom);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(42, 42, 62, 0.5)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const price = paddedMin + (paddedRange * i) / numGridLines;
      const y = getY(price);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      ctx.fillStyle = '#888';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toFixed(4)}`, padding.left - 10, y + 4);
    }

    // Time labels (every 4 hours)
    const timeLabels = [0, 4, 8, 12, 16, 20, 24];
    ctx.fillStyle = '#888';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    timeLabels.forEach(hour => {
      const index = Math.floor((hour / 24) * (priceData.length - 1));
      if (index < priceData.length) {
        const x = getX(index);
        ctx.fillText(`${hour}h`, x, height - 10);
      }
    });

    // Draw area fill (gradient under the line)
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    const isPositive = priceChange24h >= 0;
    
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    }

    ctx.beginPath();
    ctx.moveTo(getX(0), height - padding.bottom);
    
    priceData.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.price);
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        // Smooth curve using bezier
        const prevX = getX(index - 1);
        const prevY = getY(priceData[index - 1].price);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });

    ctx.lineTo(getX(priceData.length - 1), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw the price line
    ctx.beginPath();
    ctx.strokeStyle = isPositive ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    priceData.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.price);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = getX(index - 1);
        const prevY = getY(priceData[index - 1].price);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });

    ctx.stroke();

    // Draw current price dot (pulsing)
    const lastPoint = priceData[priceData.length - 1];
    const lastX = getX(priceData.length - 1);
    const lastY = getY(lastPoint.price);

    // Outer glow
    const glowGradient = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 12);
    glowGradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = isPositive ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw high/low markers
    const highIndex = prices.indexOf(maxPrice);
    const lowIndex = prices.indexOf(minPrice);

    // High marker
    const highX = getX(highIndex);
    const highY = getY(maxPrice);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(highX, highY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Low marker
    const lowX = getX(lowIndex);
    const lowY = getY(minPrice);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(lowX, lowY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  }, [priceData, priceChange24h]);

  useEffect(() => {
    drawChart();
    // Redraw on resize
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  const formatPrice = (price: number) => {
    if (price === 0) return '$0.0000';
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>📈 MNT Price Chart</h3>
          <span style={styles.badge}>Loading...</span>
        </div>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <span style={styles.loadingText}>Fetching price data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>📈 MNT Price Chart</h3>
          <span style={{ ...styles.badge, ...styles.badgeError }}>Error</span>
        </div>
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
          <button style={styles.retryButton} onClick={fetchPriceData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📈 MNT Price Chart</h3>
        <div style={styles.headerRight}>
          <span style={styles.liveBadge}>
            <span style={{
              ...styles.liveDot,
              animation: 'blink 1.5s infinite'
            }}></span>
            Live
          </span>
          <span style={styles.timeBadge}>{getTimeSinceUpdate()}</span>
        </div>
      </div>

      <div style={styles.priceHeader}>
        <div style={styles.currentPriceContainer}>
          <span style={styles.currentPrice}>{formatPrice(currentPrice)}</span>
          <span style={{
            ...styles.priceChange,
            color: priceChange24h >= 0 ? '#10b981' : '#ef4444',
            backgroundColor: priceChange24h >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          }}>
            {priceChange24h >= 0 ? '↑' : '↓'} {formatChange(priceChange24h)}
          </span>
        </div>
        <span style={styles.timeframe}>24H</span>
      </div>

      <div style={styles.chartContainer}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '250px',
            display: 'block',
          }}
        />
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>24h High</span>
          <span style={{ ...styles.statValue, color: '#10b981' }}>
            {formatPrice(high24h)}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>24h Low</span>
          <span style={{ ...styles.statValue, color: '#ef4444' }}>
            {formatPrice(low24h)}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Range</span>
          <span style={styles.statValue}>
            {formatPrice(low24h)} - {formatPrice(high24h)}
          </span>
        </div>
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>Data from CoinGecko · Auto-refreshes every 30s</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#10b981',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#10b981',
    borderRadius: '50%',
  },
  timeBadge: {
    padding: '6px 12px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  badge: {
    padding: '6px 12px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  badgeError: {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
  },
  priceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  currentPriceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  currentPrice: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#fff',
  },
  priceChange: {
    fontSize: '14px',
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: '8px',
  },
  timeframe: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--accent-light)',
    background: 'rgba(124, 58, 237, 0.1)',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(124, 58, 237, 0.2)',
  },
  chartContainer: {
    position: 'relative',
    marginBottom: '20px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
  },
  statItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  footer: {
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
  },
  errorText: {
    fontSize: '14px',
    color: '#ef4444',
  },
  retryButton: {
    padding: '10px 20px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default PriceChart;

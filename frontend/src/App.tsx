import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mantle, mantleSepolia } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';

import Dashboard from './pages/Dashboard';
import AgentExplorer from './pages/AgentExplorer';
import StrategyManager from './pages/StrategyManager';
import Layout from './components/Layout';

// ═══════════════════════════════════════════════════════════════
//                        CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Wagmi config
const config = createConfig({
  chains: [mantle, mantleSepolia],
  transports: {
    [mantle.id]: http('https://rpc.mantle.xyz'),
    [mantleSepolia.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
});

// React Query client
const queryClient = new QueryClient();

// ═══════════════════════════════════════════════════════════════
//                        APP
// ═══════════════════════════════════════════════════════════════

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/explorer" element={<AgentExplorer />} />
              <Route path="/strategies" element={<StrategyManager />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

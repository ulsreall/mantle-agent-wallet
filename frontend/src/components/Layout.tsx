import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  LayoutDashboard,
  Search,
  Settings,
  Wallet,
  Activity,
  ChevronRight,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
//                        CONSTANTS
// ═══════════════════════════════════════════════════════════════

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Agent Explorer',
    path: '/explorer',
    icon: <Search className="w-5 h-5" />,
  },
  {
    label: 'Strategies',
    path: '/strategies',
    icon: <Settings className="w-5 h-5" />,
  },
];

// ═══════════════════════════════════════════════════════════════
//                        COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Mantle Agent Wallet</h1>
                <p className="text-xs text-gray-400">
                  Agentic Wallet Economy
                </p>
              </div>
            </div>

            {/* Network Badge */}
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2" />
                Mantle Network
              </div>

              {/* Wallet Connect */}
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    <Wallet className="w-4 h-4 inline mr-2" />
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-full text-sm transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connect({ connector: injected() })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-800 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          {/* Agent Status */}
          <div className="p-4 border-t border-gray-800">
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Agent Active</span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Strategy:</span>
                  <span className="text-white">Swap</span>
                </div>
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span className="text-white">-- MNT</span>
                </div>
                <div className="flex justify-between">
                  <span>Trades:</span>
                  <span className="text-white">0</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

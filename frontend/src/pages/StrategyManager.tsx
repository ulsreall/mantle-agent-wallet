import React, { useState } from 'react';
import {
  Settings,
  Play,
  Pause,
  Trash2,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'swap' | 'lp' | 'yield' | 'arbitrage';
  status: 'active' | 'paused' | 'stopped';
  performance: {
    roi: number;
    trades: number;
    successRate: number;
  };
  config: {
    maxTradeSize: number;
    slippageTolerance: number;
    dex: string;
  };
  createdAt: string;
  lastExecuted: string;
}

// ═══════════════════════════════════════════════════════════════
//                        MOCK DATA
// ═══════════════════════════════════════════════════════════════

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'MNT-USDC Swap',
    description: 'Automated swap between MNT and USDC tokens',
    type: 'swap',
    status: 'active',
    performance: {
      roi: 12.5,
      trades: 47,
      successRate: 94.2,
    },
    config: {
      maxTradeSize: 1.0,
      slippageTolerance: 0.5,
      dex: 'Merchant Moe',
    },
    createdAt: '2026-05-20',
    lastExecuted: '2 minutes ago',
  },
  {
    id: '2',
    name: 'LP MNT-USDC',
    description: 'Liquidity provision with auto-rebalancing',
    type: 'lp',
    status: 'paused',
    performance: {
      roi: 8.3,
      trades: 12,
      successRate: 100,
    },
    config: {
      maxTradeSize: 5.0,
      slippageTolerance: 1.0,
      dex: 'Agni Finance',
    },
    createdAt: '2026-05-18',
    lastExecuted: '1 hour ago',
  },
  {
    id: '3',
    name: 'Yield Harvester',
    description: 'Automated reward harvesting from yield farms',
    type: 'yield',
    status: 'active',
    performance: {
      roi: 15.2,
      trades: 89,
      successRate: 97.8,
    },
    config: {
      maxTradeSize: 10.0,
      slippageTolerance: 0.3,
      dex: 'Multiple',
    },
    createdAt: '2026-05-15',
    lastExecuted: '30 minutes ago',
  },
  {
    id: '4',
    name: 'Cross-DEX Arbitrage',
    description: 'Detect and execute arbitrage opportunities',
    type: 'arbitrage',
    status: 'stopped',
    performance: {
      roi: 23.1,
      trades: 156,
      successRate: 89.7,
    },
    config: {
      maxTradeSize: 2.0,
      slippageTolerance: 0.2,
      dex: 'All DEXes',
    },
    createdAt: '2026-05-10',
    lastExecuted: '3 hours ago',
  },
];

// ═══════════════════════════════════════════════════════════════
//                        COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StrategyCard({
  strategy,
  onToggle,
  onDelete,
}: {
  strategy: Strategy;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    stopped: 'bg-red-500/20 text-red-400',
  };

  const typeIcons = {
    swap: <TrendingUp className="w-5 h-5" />,
    lp: <Activity className="w-5 h-5" />,
    yield: <TrendingUp className="w-5 h-5" />,
    arbitrage: <Activity className="w-5 h-5" />,
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            {typeIcons[strategy.type]}
          </div>
          <div>
            <h3 className="font-semibold">{strategy.name}</h3>
            <p className="text-sm text-gray-400">{strategy.description}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[strategy.status]}`}>
          {strategy.status}
        </span>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">ROI</p>
          <p className="text-lg font-semibold text-green-400">
            +{strategy.performance.roi}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Trades</p>
          <p className="text-lg font-semibold">{strategy.performance.trades}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Success</p>
          <p className="text-lg font-semibold">
            {strategy.performance.successRate}%
          </p>
        </div>
      </div>

      {/* Config */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Max Trade Size</p>
            <p className="font-medium">{strategy.config.maxTradeSize} MNT</p>
          </div>
          <div>
            <p className="text-gray-400">Slippage</p>
            <p className="font-medium">{strategy.config.slippageTolerance}%</p>
          </div>
          <div>
            <p className="text-gray-400">DEX</p>
            <p className="font-medium">{strategy.config.dex}</p>
          </div>
          <div>
            <p className="text-gray-400">Last Executed</p>
            <p className="font-medium">{strategy.lastExecuted}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggle(strategy.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            strategy.status === 'active'
              ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400'
              : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
          }`}
        >
          {strategy.status === 'active' ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(strategy.id)}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CreateStrategyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Strategy</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Strategy Name
            </label>
            <input
              type="text"
              placeholder="e.g., MNT-USDC Swap"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-600">
              <option value="swap">Swap</option>
              <option value="lp">Liquidity Provision</option>
              <option value="yield">Yield Farming</option>
              <option value="arbitrage">Arbitrage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Max Trade Size (MNT)
            </label>
            <input
              type="number"
              placeholder="1.0"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Slippage Tolerance (%)
            </label>
            <input
              type="number"
              placeholder="0.5"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//                        PAGE
// ═══════════════════════════════════════════════════════════════

export default function StrategyManager() {
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggle = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === 'active' ? 'paused' : 'active',
            }
          : s
      )
    );
  };

  const handleDelete = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  // Calculate summary stats
  const activeStrategies = strategies.filter((s) => s.status === 'active').length;
  const totalTrades = strategies.reduce((sum, s) => sum + s.performance.trades, 0);
  const avgROI =
    strategies.reduce((sum, s) => sum + s.performance.roi, 0) / strategies.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategy Manager</h2>
          <p className="text-gray-400 mt-1">
            Configure and manage your agent's DeFi strategies
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Strategy
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Strategies</p>
          <p className="text-2xl font-bold mt-1">{strategies.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-400">
            {activeStrategies}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold mt-1">{totalTrades}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Avg ROI</p>
          <p className="text-2xl font-bold mt-1 text-green-400">
            +{avgROI.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Empty State */}
      {strategies.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            No strategies configured
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Create your first strategy to get started
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Create Strategy
          </button>
        </div>
      )}

      {/* Create Strategy Modal */}
      <CreateStrategyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

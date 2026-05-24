import React, { useState } from 'react';
import { Search, ExternalLink, Star, Activity, Users, Globe } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════════

interface Agent {
  id: string;
  name: string;
  description: string;
  owner: string;
  score: number;
  feedbacks: number;
  status: 'active' | 'inactive';
  capabilities: string[];
  chain: string;
}

// ═══════════════════════════════════════════════════════════════
//                        MOCK DATA
// ═══════════════════════════════════════════════════════════════

const MOCK_AGENTS: Agent[] = [
  {
    id: '5000:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:1',
    name: 'MantleSwap Agent',
    description: 'Autonomous swap agent on Mantle Network',
    owner: '0x1234...5678',
    score: 95,
    feedbacks: 127,
    status: 'active',
    capabilities: ['swap', 'arbitrage'],
    chain: 'Mantle',
  },
  {
    id: '5000:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:2',
    name: 'Yield Farmer',
    description: 'Automated yield farming across protocols',
    owner: '0x2345...6789',
    score: 88,
    feedbacks: 89,
    status: 'active',
    capabilities: ['yield', 'lp'],
    chain: 'Mantle',
  },
  {
    id: '5000:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:3',
    name: 'Liquidity Manager',
    description: 'Smart liquidity management with auto-rebalancing',
    owner: '0x3456...7890',
    score: 82,
    feedbacks: 56,
    status: 'active',
    capabilities: ['lp', 'rebalance'],
    chain: 'Mantle',
  },
  {
    id: '5000:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:4',
    name: 'Arbitrage Hunter',
    description: 'Cross-DEX arbitrage detection and execution',
    owner: '0x4567...8901',
    score: 91,
    feedbacks: 203,
    status: 'active',
    capabilities: ['arbitrage', 'swap'],
    chain: 'Mantle',
  },
];

// ═══════════════════════════════════════════════════════════════
//                        COMPONENTS
// ═══════════════════════════════════════════════════════════════

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{agent.name}</h3>
          <p className="text-sm text-gray-400 mt-1">{agent.description}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            agent.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {agent.status}
        </span>
      </div>

      <div className="space-y-3">
        {/* Owner */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>{agent.owner}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="font-medium">{agent.score}/100</span>
          <span className="text-sm text-gray-400">
            ({agent.feedbacks} feedbacks)
          </span>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-300"
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Chain */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Globe className="w-4 h-4" />
          <span>{agent.chain}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
        <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
          View Details
        </button>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//                        PAGE
// ═══════════════════════════════════════════════════════════════

export default function AgentExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter agents
  const filteredAgents = MOCK_AGENTS.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || agent.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Agent Explorer</h2>
        <p className="text-gray-400 mt-1">
          Discover and explore AI agents on Mantle Network (ERC-8004)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-600 transition"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filterStatus === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Agents</p>
          <p className="text-2xl font-bold mt-1">526</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Active Agents</p>
          <p className="text-2xl font-bold mt-1">412</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Avg Score</p>
          <p className="text-2xl font-bold mt-1">87.3</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Feedbacks</p>
          <p className="text-2xl font-bold mt-1">12,847</p>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            No agents found
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { mantle, mantleTestnet } from 'wagmi/chains';
import {
  Wallet,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//                        COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatCard({
  title,
  value,
  change,
  icon,
  trend,
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {change && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RecentActivity({
  activities,
}: {
  activities: Array<{
    type: string;
    description: string;
    time: string;
    status: 'success' | 'pending' | 'failed';
  }>;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {activities.map((activity, i) => (
          <div key={i} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.status === 'success'
                    ? 'bg-green-500/20'
                    : activity.status === 'pending'
                    ? 'bg-yellow-500/20'
                    : 'bg-red-500/20'
                }`}
              >
                <Activity
                  className={`w-5 h-5 ${
                    activity.status === 'success'
                      ? 'text-green-400'
                      : activity.status === 'pending'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                />
              </div>
              <div>
                <p className="font-medium">{activity.type}</p>
                <p className="text-sm text-gray-400">{activity.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">{activity.time}</p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  activity.status === 'success'
                    ? 'bg-green-500/20 text-green-400'
                    : activity.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {activity.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyCard({
  name,
  description,
  status,
  performance,
}: {
  name: string;
  description: string;
  status: 'active' | 'paused' | 'stopped';
  performance: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : status === 'paused'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-green-400">
          {performance}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//                        PAGE
// ═══════════════════════════════════════════════════════════════

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
    chainId: mantleTestnet.id, // Use testnet for development
  });

  // Mock data for demonstration
  const recentActivities = [
    {
      type: 'Swap Executed',
      description: 'Swapped 0.5 MNT for USDC on Merchant Moe',
      time: '2 minutes ago',
      status: 'success' as const,
    },
    {
      type: 'Strategy Updated',
      description: 'Switched to arbitrage strategy',
      time: '15 minutes ago',
      status: 'success' as const,
    },
    {
      type: 'Liquidity Added',
      description: 'Added 1.0 MNT + 1.0 USDC to Agni pool',
      time: '1 hour ago',
      status: 'success' as const,
    },
    {
      type: 'Harvest Failed',
      description: 'Insufficient rewards to harvest',
      time: '2 hours ago',
      status: 'failed' as const,
    },
  ];

  const strategies = [
    {
      name: 'Swap Strategy',
      description: 'Automated token swaps across DEXes',
      status: 'active' as const,
      performance: '+12.5% ROI',
    },
    {
      name: 'LP Strategy',
      description: 'Liquidity provision with auto-rebalancing',
      status: 'paused' as const,
      performance: '+8.3% ROI',
    },
    {
      name: 'Yield Farming',
      description: 'Harvest rewards from yield farms',
      status: 'active' as const,
      performance: '+15.2% ROI',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-400 mt-1">
          Monitor your agent wallet performance and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Wallet Balance"
          value={balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 MNT'}
          icon={<Wallet className="w-6 h-6 text-blue-400" />}
        />
        <StatCard
          title="Total Trades"
          value="47"
          change="+12 today"
          icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
          trend="up"
        />
        <StatCard
          title="Total ROI"
          value="+18.7%"
          change="+2.3% this week"
          icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          trend="up"
        />
        <StatCard
          title="Active Strategies"
          value="2"
          icon={<Activity className="w-6 h-6 text-orange-400" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>

        {/* Active Strategies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Strategies</h3>
          {strategies.map((strategy, i) => (
            <StrategyCard key={i} {...strategy} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition text-left">
            <p className="font-medium text-blue-400">Execute Swap</p>
            <p className="text-sm text-gray-400 mt-1">
              Swap tokens on Mantle DEXes
            </p>
          </button>
          <button className="p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition text-left">
            <p className="font-medium text-purple-400">Add Liquidity</p>
            <p className="text-sm text-gray-400 mt-1">
              Provide liquidity to earn fees
            </p>
          </button>
          <button className="p-4 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition text-left">
            <p className="font-medium text-green-400">Harvest Rewards</p>
            <p className="text-sm text-gray-400 mt-1">
              Collect yield farming rewards
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

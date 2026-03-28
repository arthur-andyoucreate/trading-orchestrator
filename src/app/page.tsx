'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  RefreshCw,
  Settings,
  Bell,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { SignalList } from '@/components/dashboard/signal-list';
import { PortfolioOverview, PortfolioOverviewSkeleton } from '@/components/dashboard/portfolio-overview';
import { RiskPanel, RiskPanelSkeleton } from '@/components/dashboard/risk-panel';
import { FeatureStatusCompact } from '@/components/dashboard/feature-status';
import {
  CompositeSignal,
  PortfolioState,
  HeatMetrics,
  DrawdownAnalysis,
  FeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_SIGNAL_WEIGHTS,
} from '@/types/trading';
import { getFeatureFlags } from '@/lib/config/feature-flags';
import { formatRelativeTime } from '@/lib/utils';

// Mock data for demo purposes
function generateMockSignals(): CompositeSignal[] {
  const assets = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'AVAX', name: 'Avalanche' },
    { symbol: 'ARB', name: 'Arbitrum' },
    { symbol: 'OP', name: 'Optimism' },
  ];

  return assets.map((asset, i) => {
    const score = (Math.random() - 0.5) * 2;
    const direction = score > 0.15 ? 'LONG' : score < -0.15 ? 'SHORT' : 'NEUTRAL';
    const strength = Math.abs(score) > 0.7 ? 'STRONG' : Math.abs(score) > 0.4 ? 'MODERATE' : 'WEAK';
    const confidence = 0.4 + Math.random() * 0.5;

    return {
      id: `sig_${i}_${Date.now()}`,
      asset: { symbol: asset.symbol, name: asset.name, type: 'crypto' as const },
      direction,
      strength,
      compositeScore: score,
      confidence,
      components: {
        reddit: Math.random() > 0.2 ? { value: (Math.random() - 0.5) * 2, confidence: Math.random(), timestamp: new Date(), source: 'reddit_sentiment' as const } : null,
        tvl: Math.random() > 0.3 ? { value: (Math.random() - 0.5) * 2, confidence: Math.random(), timestamp: new Date(), source: 'defi_tvl' as const } : null,
        news: Math.random() > 0.4 ? { value: (Math.random() - 0.5) * 2, confidence: Math.random(), timestamp: new Date(), source: 'news_analysis' as const } : null,
        forecast: Math.random() > 0.2 ? { value: (Math.random() - 0.5) * 2, confidence: Math.random(), timestamp: new Date(), source: 'time_series_forecast' as const } : null,
      },
      weights: DEFAULT_SIGNAL_WEIGHTS,
      suggestedAction: {
        type: direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'HOLD',
        suggestedSize: Math.random() * 5,
        kellyFraction: Math.random() * 0.25,
        stopLoss: 3 + Math.random() * 3,
        takeProfit: 8 + Math.random() * 8,
        reason: `${strength} ${direction.toLowerCase()} signal with ${(confidence * 100).toFixed(0)}% confidence`,
      },
      riskMetrics: {
        volatility: 0.02 + Math.random() * 0.03,
        correlationWithBtc: 0.5 + Math.random() * 0.5,
        liquidityScore: 0.5 + Math.random() * 0.5,
        maxDrawdownRisk: Math.random() * 0.15,
      },
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      expiresAt: new Date(Date.now() + 3600000),
    } as CompositeSignal;
  });
}

function generateMockPortfolio(): PortfolioState {
  return {
    positions: [
      {
        id: 'pos_btc_1',
        asset: { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
        side: 'long',
        size: 0.5,
        entryPrice: 44500,
        currentPrice: 45200,
        unrealizedPnl: 350,
        unrealizedPnlPercent: 1.57,
        leverage: 2,
        margin: 11125,
        liquidationPrice: 38000,
        openedAt: new Date(Date.now() - 86400000),
        lastUpdated: new Date(),
      },
      {
        id: 'pos_eth_1',
        asset: { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
        side: 'long',
        size: 5,
        entryPrice: 2400,
        currentPrice: 2450,
        unrealizedPnl: 250,
        unrealizedPnlPercent: 2.08,
        leverage: 3,
        margin: 4000,
        liquidationPrice: 2000,
        openedAt: new Date(Date.now() - 43200000),
        lastUpdated: new Date(),
      },
      {
        id: 'pos_sol_1',
        asset: { symbol: 'SOL', name: 'Solana', type: 'crypto' },
        side: 'short',
        size: 20,
        entryPrice: 105,
        currentPrice: 102,
        unrealizedPnl: 60,
        unrealizedPnlPercent: 2.86,
        leverage: 2,
        margin: 1050,
        liquidationPrice: 115,
        openedAt: new Date(Date.now() - 21600000),
        lastUpdated: new Date(),
      },
    ],
    totalValue: 50000,
    availableBalance: 33825,
    totalMargin: 16175,
    unrealizedPnl: 660,
    realizedPnl: 1250,
    portfolioHeat: 22,
    maxDrawdown: 8.5,
    currentDrawdown: 2.1,
    lastUpdated: new Date(),
  };
}

function generateMockRiskMetrics(): { heat: HeatMetrics; drawdown: DrawdownAnalysis; score: number; warnings: string[]; recommendations: string[] } {
  return {
    heat: {
      currentHeat: 22,
      heatByAsset: new Map([['BTC', 12], ['ETH', 7], ['SOL', 3]]),
      heatTrend: 'stable',
      distanceToLimit: 8,
      warningLevel: 'caution',
    },
    drawdown: {
      currentDrawdown: 2.1,
      maxDrawdown: 8.5,
      avgDrawdown: 3.2,
      drawdownDuration: 2,
      recoveryTime: 4,
      peakValue: 51100,
      troughValue: 46700,
    },
    score: 35,
    warnings: [],
    recommendations: ['Portfolio heat is moderate. Room for one more position.'],
  };
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<CompositeSignal[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<ReturnType<typeof generateMockRiskMetrics> | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize with feature flags
    setFeatureFlags(getFeatureFlags());

    // Load initial data
    loadData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // In production, these would be API calls
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      setSignals(generateMockSignals());
      setPortfolio(generateMockPortfolio());
      setRiskMetrics(generateMockRiskMetrics());
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }

  function handleSignalClick(signal: CompositeSignal) {
    console.log('Signal clicked:', signal);
    // Would open signal detail modal
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Solide Intelligence</h1>
              </div>
              <FeatureStatusCompact flags={featureFlags} />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Last update: {formatRelativeTime(lastUpdate)}
              </span>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Signals */}
          <motion.div
            className="col-span-12 lg:col-span-5 xl:col-span-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="h-[calc(100vh-180px)] sticky top-24">
              <SignalList
                signals={signals}
                isLoading={isLoading}
                onRefresh={loadData}
                onSignalClick={handleSignalClick}
              />
            </div>
          </motion.div>

          {/* Right Column - Portfolio & Risk */}
          <motion.div
            className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {portfolio ? (
                <PortfolioOverview portfolio={portfolio} />
              ) : (
                <PortfolioOverviewSkeleton />
              )}

              {riskMetrics ? (
                <RiskPanel
                  heatMetrics={riskMetrics.heat}
                  drawdownAnalysis={riskMetrics.drawdown}
                  riskScore={riskMetrics.score}
                  warnings={riskMetrics.warnings}
                  recommendations={riskMetrics.recommendations}
                />
              ) : (
                <RiskPanelSkeleton />
              )}
            </div>

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {[
                { label: 'Active Signals', value: signals.filter(s => s.direction !== 'NEUTRAL').length, icon: Activity },
                { label: 'Strong Signals', value: signals.filter(s => s.strength === 'STRONG').length, icon: BarChart3 },
                { label: 'Open Positions', value: portfolio?.positions.length || 0, icon: BarChart3 },
                { label: 'Today\'s P&L', value: `+$${portfolio?.unrealizedPnl.toFixed(0) || 0}`, icon: BarChart3 },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-4 rounded-lg bg-card border"
                >
                  <div className="flex items-center justify-between">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

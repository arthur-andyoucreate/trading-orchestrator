'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioState, Position } from '@/types/trading';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { RISK_CONFIG } from '@/lib/config/constants';

interface PortfolioOverviewProps {
  portfolio: PortfolioState;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const variantStyles = {
    default: 'bg-muted',
    success: 'bg-bullish/10 text-bullish',
    danger: 'bg-bearish/10 text-bearish',
    warning: 'bg-yellow-500/10 text-yellow-500',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', variantStyles[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {change !== undefined && (
          <p
            className={cn(
              'text-xs',
              change >= 0 ? 'text-bullish' : 'text-bearish'
            )}
          >
            {formatPercent(change)}
          </p>
        )}
      </div>
    </div>
  );
}

function HeatGauge({ heat }: { heat: number }) {
  let color: string;
  let status: string;

  if (heat < RISK_CONFIG.HEAT_LEVEL_SAFE) {
    color = 'bg-green-500';
    status = 'Safe';
  } else if (heat < RISK_CONFIG.HEAT_LEVEL_CAUTION) {
    color = 'bg-yellow-500';
    status = 'Caution';
  } else if (heat < RISK_CONFIG.HEAT_LEVEL_WARNING) {
    color = 'bg-orange-500';
    status = 'Warning';
  } else {
    color = 'bg-red-500';
    status = 'Critical';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">Portfolio Heat</span>
        <span className={cn('text-sm font-medium', heat >= RISK_CONFIG.HEAT_LEVEL_WARNING ? 'text-red-500' : '')}>
          {heat.toFixed(1)}%
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, heat)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>{status}</span>
        <span>Limit: {RISK_CONFIG.MAX_PORTFOLIO_HEAT_DEFAULT}%</span>
      </div>
    </div>
  );
}

function PositionsList({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No open positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {positions.map((position) => (
        <motion.div
          key={position.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-2 h-8 rounded-full',
                position.side === 'long' ? 'bg-bullish' : 'bg-bearish'
              )}
            />
            <div>
              <p className="font-medium">{position.asset.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {position.side.toUpperCase()} @ {formatCurrency(position.entryPrice)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'font-semibold',
                position.unrealizedPnl >= 0 ? 'text-bullish' : 'text-bearish'
              )}
            >
              {formatCurrency(position.unrealizedPnl)}
            </p>
            <p
              className={cn(
                'text-xs',
                position.unrealizedPnlPercent >= 0 ? 'text-bullish' : 'text-bearish'
              )}
            >
              {formatPercent(position.unrealizedPnlPercent)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PortfolioOverview({ portfolio }: PortfolioOverviewProps) {
  const totalPnl = portfolio.unrealizedPnl + portfolio.realizedPnl;
  const pnlPercent = portfolio.totalValue > 0
    ? (totalPnl / (portfolio.totalValue - totalPnl)) * 100
    : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Portfolio Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={Wallet}
            label="Total Value"
            value={formatCurrency(portfolio.totalValue)}
          />
          <MetricCard
            icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
            label="Total P&L"
            value={formatCurrency(totalPnl)}
            change={pnlPercent}
            variant={totalPnl >= 0 ? 'success' : 'danger'}
          />
          <MetricCard
            icon={Activity}
            label="Available Balance"
            value={formatCurrency(portfolio.availableBalance)}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Margin Used"
            value={formatCurrency(portfolio.totalMargin)}
            variant={
              portfolio.totalMargin / portfolio.totalValue > 0.5
                ? 'warning'
                : 'default'
            }
          />
        </div>

        {/* Portfolio Heat */}
        <HeatGauge heat={portfolio.portfolioHeat} />

        {/* Drawdown Warning */}
        {portfolio.currentDrawdown > 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500"
          >
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Drawdown Warning</p>
              <p className="text-sm">
                Current drawdown: {portfolio.currentDrawdown.toFixed(1)}% / Max:{' '}
                {portfolio.maxDrawdown.toFixed(1)}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Positions */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            Open Positions ({portfolio.positions.length})
          </h4>
          <PositionsList positions={portfolio.positions.slice(0, 5)} />
          {portfolio.positions.length > 5 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              +{portfolio.positions.length - 5} more positions
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioOverviewSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-3 w-16 bg-muted rounded mb-1" />
                <div className="h-5 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-12 bg-muted rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

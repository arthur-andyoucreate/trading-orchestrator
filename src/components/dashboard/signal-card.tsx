'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompositeSignal, SignalDirection, SignalStrength } from '@/types/trading';
import { formatPercent, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  signal: CompositeSignal;
  onClick?: () => void;
  compact?: boolean;
}

function getDirectionIcon(direction: SignalDirection) {
  switch (direction) {
    case 'LONG':
      return <TrendingUp className="h-5 w-5" />;
    case 'SHORT':
      return <TrendingDown className="h-5 w-5" />;
    default:
      return <Minus className="h-5 w-5" />;
  }
}

function getDirectionColor(direction: SignalDirection) {
  switch (direction) {
    case 'LONG':
      return 'text-bullish bg-bullish/10 border-bullish/20';
    case 'SHORT':
      return 'text-bearish bg-bearish/10 border-bearish/20';
    default:
      return 'text-neutral bg-neutral/10 border-neutral/20';
  }
}

function getStrengthBadge(strength: SignalStrength) {
  const colors = {
    STRONG: 'bg-green-500',
    MODERATE: 'bg-yellow-500',
    WEAK: 'bg-gray-500',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium text-white',
        colors[strength]
      )}
    >
      {strength}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = confidence * 100;
  const color =
    percentage >= 70
      ? 'bg-green-500'
      : percentage >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-10">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

function ComponentIndicator({
  name,
  score,
  available,
}: {
  name: string;
  score: number | null;
  available: boolean;
}) {
  if (!available || score === null) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">{name}</span>
      </div>
    );
  }

  const isPositive = score > 0;
  const color = isPositive ? 'text-bullish' : score < 0 ? 'text-bearish' : 'text-neutral';

  return (
    <div className={cn('flex items-center gap-1', color)}>
      <CheckCircle className="h-3 w-3" />
      <span className="text-xs">{name}</span>
      <span className="text-xs font-mono">{formatPercent(score * 100, 0)}</span>
    </div>
  );
}

export function SignalCard({ signal, onClick, compact = false }: SignalCardProps) {
  const directionColor = getDirectionColor(signal.direction);
  const isExpired = new Date() > signal.expiresAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card
        className={cn(
          'card-hover border-l-4 transition-all',
          directionColor,
          isExpired && 'opacity-50'
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  signal.direction === 'LONG'
                    ? 'bg-bullish/20'
                    : signal.direction === 'SHORT'
                    ? 'bg-bearish/20'
                    : 'bg-neutral/20'
                )}
              >
                {getDirectionIcon(signal.direction)}
              </div>
              <div>
                <CardTitle className="text-lg">{signal.asset.symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">{signal.asset.name}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStrengthBadge(signal.strength)}
              <span
                className={cn(
                  'text-2xl font-bold',
                  signal.compositeScore > 0
                    ? 'text-bullish'
                    : signal.compositeScore < 0
                    ? 'text-bearish'
                    : 'text-neutral'
                )}
              >
                {formatPercent(signal.compositeScore * 100, 1)}
              </span>
            </div>
          </div>
        </CardHeader>

        {!compact && (
          <CardContent>
            {/* Confidence Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Confidence</span>
              </div>
              <ConfidenceBar confidence={signal.confidence} />
            </div>

            {/* Signal Components */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <ComponentIndicator
                name="Reddit"
                score={signal.components.reddit?.value ?? null}
                available={signal.components.reddit !== null}
              />
              <ComponentIndicator
                name="TVL"
                score={signal.components.tvl?.value ?? null}
                available={signal.components.tvl !== null}
              />
              <ComponentIndicator
                name="News"
                score={signal.components.news?.value ?? null}
                available={signal.components.news !== null}
              />
              <ComponentIndicator
                name="Forecast"
                score={signal.components.forecast?.value ?? null}
                available={signal.components.forecast !== null}
              />
            </div>

            {/* Suggested Action */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Suggested Action</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    signal.suggestedAction.type === 'BUY'
                      ? 'bg-bullish text-white'
                      : signal.suggestedAction.type === 'SELL'
                      ? 'bg-bearish text-white'
                      : 'bg-neutral text-white'
                  )}
                >
                  {signal.suggestedAction.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {signal.suggestedAction.reason}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Size: {signal.suggestedAction.suggestedSize.toFixed(1)}%</span>
                <span>SL: {signal.suggestedAction.stopLoss.toFixed(1)}%</span>
                <span>TP: {signal.suggestedAction.takeProfit.toFixed(1)}%</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(signal.timestamp)}</span>
              </div>
              {isExpired && (
                <span className="text-destructive font-medium">Expired</span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

export function SignalCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg" />
            <div>
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded mt-1" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-8 w-20 bg-muted rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-2 bg-muted rounded-full mb-4" />
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-muted rounded" />
          ))}
        </div>
        <div className="h-20 bg-muted rounded-lg" />
      </CardContent>
    </Card>
  );
}

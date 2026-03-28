'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignalCard, SignalCardSkeleton } from './signal-card';
import { CompositeSignal, SignalDirection, SignalStrength } from '@/types/trading';
import { cn } from '@/lib/utils';

interface SignalListProps {
  signals: CompositeSignal[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSignalClick?: (signal: CompositeSignal) => void;
}

type FilterOption = 'all' | 'long' | 'short' | 'strong' | 'actionable';

export function SignalList({
  signals,
  isLoading = false,
  onRefresh,
  onSignalClick,
}: SignalListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  // Filter signals
  const filteredSignals = signals.filter((signal) => {
    // Search filter
    const searchMatch =
      searchTerm === '' ||
      signal.asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.asset.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Direction/strength filter
    let filterMatch = true;
    switch (activeFilter) {
      case 'long':
        filterMatch = signal.direction === 'LONG';
        break;
      case 'short':
        filterMatch = signal.direction === 'SHORT';
        break;
      case 'strong':
        filterMatch = signal.strength === 'STRONG';
        break;
      case 'actionable':
        filterMatch =
          signal.confidence >= 0.5 &&
          signal.direction !== 'NEUTRAL' &&
          Math.abs(signal.compositeScore) >= 0.2;
        break;
    }

    return searchMatch && filterMatch;
  });

  // Summary stats
  const summary = {
    total: signals.length,
    long: signals.filter((s) => s.direction === 'LONG').length,
    short: signals.filter((s) => s.direction === 'SHORT').length,
    strong: signals.filter((s) => s.strength === 'STRONG').length,
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Trading Signals
          </CardTitle>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-lg hover:bg-muted transition-colors',
                isLoading && 'animate-spin'
              )}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {summary.total} signals
          </span>
          <span className="flex items-center gap-1 text-bullish">
            <TrendingUp className="h-3 w-3" />
            {summary.long} long
          </span>
          <span className="flex items-center gap-1 text-bearish">
            <TrendingDown className="h-3 w-3" />
            {summary.short} short
          </span>
          <span className="flex items-center gap-1 text-green-500">
            {summary.strong} strong
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Search and Filter */}
        <div className="space-y-3 mb-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'long', label: 'Long', icon: TrendingUp },
              { key: 'short', label: 'Short', icon: TrendingDown },
              { key: 'strong', label: 'Strong' },
              { key: 'actionable', label: 'Actionable' },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key as FilterOption)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                  activeFilter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Signal List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <SignalCardSkeleton key={i} />
              ))}
            </>
          ) : filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Filter className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No signals found</p>
              <p className="text-sm">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : 'Adjust filters to see more signals'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SignalCard
                    signal={signal}
                    onClick={() => onSignalClick?.(signal)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

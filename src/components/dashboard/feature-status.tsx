'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Settings,
  MessageSquare,
  BarChart3,
  Newspaper,
  LineChart,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureFlags } from '@/types/trading';
import { FEATURE_FLAG_DESCRIPTIONS } from '@/lib/config/feature-flags';
import { cn } from '@/lib/utils';

interface FeatureStatusProps {
  flags: FeatureFlags;
  onToggle?: (feature: keyof FeatureFlags) => void;
  readOnly?: boolean;
}

const FEATURE_ICONS: Record<keyof FeatureFlags, React.ElementType> = {
  redditSentiment: MessageSquare,
  defiTvl: BarChart3,
  newsAnalysis: Newspaper,
  forecasting: LineChart,
  liveTrading: Zap,
  kellyPositionSizing: Activity,
  portfolioHeatLimits: Shield,
  advancedRiskManagement: Shield,
  realtimeUpdates: Activity,
  backtesting: LineChart,
  alertSystem: Activity,
};

const FEATURE_CATEGORIES = {
  'Intelligence Sources': ['redditSentiment', 'defiTvl', 'newsAnalysis', 'forecasting'],
  'Trading Features': ['liveTrading', 'kellyPositionSizing'],
  'Risk Management': ['portfolioHeatLimits', 'advancedRiskManagement'],
  'System Features': ['realtimeUpdates', 'backtesting', 'alertSystem'],
};

function FeatureToggle({
  feature,
  enabled,
  description,
  icon: Icon,
  onToggle,
  readOnly,
}: {
  feature: string;
  enabled: boolean;
  description: string;
  icon: React.ElementType;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        enabled ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/50 border-muted',
        !readOnly && 'cursor-pointer hover:bg-muted'
      )}
      onClick={!readOnly ? onToggle : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            enabled ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{feature.replace(/([A-Z])/g, ' $1').trim()}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className={cn('transition-colors', enabled ? 'text-green-500' : 'text-muted-foreground')}>
        {enabled ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
      </div>
    </motion.div>
  );
}

export function FeatureStatus({
  flags,
  onToggle,
  readOnly = false,
}: FeatureStatusProps) {
  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Status
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {enabledCount}/{totalCount} enabled
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(FEATURE_CATEGORIES).map(([category, features]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {features.map((feature) => (
                <FeatureToggle
                  key={feature}
                  feature={feature}
                  enabled={flags[feature as keyof FeatureFlags]}
                  description={FEATURE_FLAG_DESCRIPTIONS[feature as keyof FeatureFlags]}
                  icon={FEATURE_ICONS[feature as keyof FeatureFlags]}
                  onToggle={onToggle ? () => onToggle(feature as keyof FeatureFlags) : undefined}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Warning for live trading */}
        {flags.liveTrading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <Zap className="h-4 w-4" />
              <span className="font-medium text-sm">Live Trading Enabled</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real orders will be executed on Hyperliquid. Use with caution.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export function FeatureStatusCompact({ flags }: { flags: FeatureFlags }) {
  const intelligenceFlags = [
    { key: 'redditSentiment', label: 'Reddit', icon: MessageSquare },
    { key: 'defiTvl', label: 'TVL', icon: BarChart3 },
    { key: 'newsAnalysis', label: 'News', icon: Newspaper },
    { key: 'forecasting', label: 'Forecast', icon: LineChart },
  ];

  return (
    <div className="flex items-center gap-2">
      {intelligenceFlags.map(({ key, label, icon: Icon }) => {
        const enabled = flags[key as keyof FeatureFlags];
        return (
          <div
            key={key}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
              enabled
                ? 'bg-green-500/10 text-green-500'
                : 'bg-muted text-muted-foreground'
            )}
            title={`${label}: ${enabled ? 'Enabled' : 'Disabled'}`}
          >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

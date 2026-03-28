'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Thermometer,
  Activity,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeatMetrics, DrawdownAnalysis, RiskParameters } from '@/types/trading';
import { formatPercent, cn } from '@/lib/utils';
import { RISK_CONFIG, DEFAULT_RISK_PARAMETERS } from '@/lib/config/constants';

interface RiskPanelProps {
  heatMetrics: HeatMetrics;
  drawdownAnalysis: DrawdownAnalysis;
  riskScore: number;
  warnings: string[];
  recommendations: string[];
  riskParams?: RiskParameters;
}

function RiskScoreGauge({ score }: { score: number }) {
  // 0-100 scale, lower is better
  const color =
    score < 30
      ? 'text-green-500'
      : score < 60
      ? 'text-yellow-500'
      : 'text-red-500';

  const label =
    score < 30
      ? 'Low Risk'
      : score < 60
      ? 'Moderate Risk'
      : 'High Risk';

  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Gauge background */}
        <div className="absolute inset-0 border-8 border-muted rounded-t-full border-b-0" />

        {/* Gauge segments */}
        <div className="absolute inset-0 border-8 border-transparent rounded-t-full border-b-0 border-l-green-500 border-t-yellow-500 border-r-red-500 opacity-30" />

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-1 h-14 bg-foreground origin-bottom"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ marginLeft: '-2px' }}
        />

        {/* Center point */}
        <div className="absolute bottom-0 left-1/2 w-4 h-4 -ml-2 bg-foreground rounded-full" />
      </div>

      <div className="text-center mt-2">
        <p className={cn('text-2xl font-bold', color)}>{score.toFixed(0)}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function HeatLevelBar({ heat, maxHeat }: { heat: number; maxHeat: number }) {
  const percentage = (heat / maxHeat) * 100;
  const segments = [
    { limit: 15, color: 'bg-green-500', label: 'Safe' },
    { limit: 25, color: 'bg-yellow-500', label: 'Caution' },
    { limit: 35, color: 'bg-orange-500', label: 'Warning' },
    { limit: 100, color: 'bg-red-500', label: 'Critical' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium flex items-center gap-1">
          <Thermometer className="h-4 w-4" />
          Portfolio Heat
        </span>
        <span className="text-sm font-mono">{heat.toFixed(1)}%</span>
      </div>

      <div className="relative h-6 bg-muted rounded-lg overflow-hidden">
        {/* Segment markers */}
        <div className="absolute inset-0 flex">
          {segments.map((segment, i) => (
            <div
              key={i}
              className={cn('h-full opacity-20', segment.color)}
              style={{
                width: `${(segment.limit - (i > 0 ? segments[i - 1].limit : 0))}%`,
              }}
            />
          ))}
        </div>

        {/* Current heat indicator */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary/50"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percentage)}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Limit marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-destructive"
          style={{ left: `${(maxHeat / 100) * 100}%` }}
        />
      </div>

      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>0%</span>
        <span>Limit: {maxHeat}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function DrawdownChart({ analysis }: { analysis: DrawdownAnalysis }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1">
          <TrendingDown className="h-4 w-4" />
          Drawdown Analysis
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Current</p>
          <p
            className={cn(
              'text-lg font-semibold',
              analysis.currentDrawdown > 5 ? 'text-red-500' : 'text-foreground'
            )}
          >
            {formatPercent(-analysis.currentDrawdown)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Max</p>
          <p className="text-lg font-semibold text-red-500">
            {formatPercent(-analysis.maxDrawdown)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="text-lg font-semibold">
            {analysis.drawdownDuration.toFixed(0)}d
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Est. Recovery</p>
          <p className="text-lg font-semibold">
            {analysis.recoveryTime.toFixed(0)}d
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertsList({
  warnings,
  recommendations,
}: {
  warnings: string[];
  recommendations: string[];
}) {
  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            Warnings
          </h4>
          {warnings.map((warning, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </motion.div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1 text-blue-500">
            <Target className="h-4 w-4" />
            Recommendations
          </h4>
          {recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (warnings.length + i) * 0.1 }}
              className="p-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm flex items-start gap-2"
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{rec}</span>
            </motion.div>
          ))}
        </div>
      )}

      {warnings.length === 0 && recommendations.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>All risk metrics within safe limits</p>
        </div>
      )}
    </div>
  );
}

export function RiskPanel({
  heatMetrics,
  drawdownAnalysis,
  riskScore,
  warnings,
  recommendations,
  riskParams = DEFAULT_RISK_PARAMETERS,
}: RiskPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Score Gauge */}
        <RiskScoreGauge score={riskScore} />

        {/* Heat Level */}
        <HeatLevelBar
          heat={heatMetrics.currentHeat}
          maxHeat={riskParams.maxPortfolioHeat}
        />

        {/* Drawdown Analysis */}
        <DrawdownChart analysis={drawdownAnalysis} />

        {/* Alerts */}
        <AlertsList warnings={warnings} recommendations={recommendations} />
      </CardContent>
    </Card>
  );
}

export function RiskPanelSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="w-32 h-20 bg-muted rounded-t-full" />
        </div>
        <div className="h-10 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Signal Generator Tests
 */

import {
  filterSignals,
  getActionableSignals,
  summarizeSignals,
} from '@/lib/trading/signal-generator';
import {
  CompositeSignal,
  SignalDirection,
  SignalStrength,
  DEFAULT_SIGNAL_WEIGHTS,
} from '@/types/trading';

// Helper to create mock signals
function createMockSignal(overrides: Partial<CompositeSignal> = {}): CompositeSignal {
  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    asset: { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    direction: 'LONG',
    strength: 'MODERATE',
    compositeScore: 0.5,
    confidence: 0.7,
    components: {
      reddit: { value: 0.3, confidence: 0.7, timestamp: new Date(), source: 'reddit_sentiment' },
      tvl: { value: 0.5, confidence: 0.8, timestamp: new Date(), source: 'defi_tvl' },
      news: { value: 0.4, confidence: 0.6, timestamp: new Date(), source: 'news_analysis' },
      forecast: { value: 0.6, confidence: 0.75, timestamp: new Date(), source: 'time_series_forecast' },
    },
    weights: DEFAULT_SIGNAL_WEIGHTS,
    suggestedAction: {
      type: 'BUY',
      suggestedSize: 2.5,
      kellyFraction: 0.15,
      stopLoss: 5,
      takeProfit: 15,
      reason: 'Test signal',
    },
    riskMetrics: {
      volatility: 0.02,
      correlationWithBtc: 1,
      liquidityScore: 0.9,
      maxDrawdownRisk: 0.08,
    },
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    ...overrides,
  };
}

describe('Signal Generator', () => {
  describe('filterSignals', () => {
    const signals: CompositeSignal[] = [
      createMockSignal({ direction: 'LONG', strength: 'STRONG', confidence: 0.8, compositeScore: 0.7 }),
      createMockSignal({ direction: 'LONG', strength: 'MODERATE', confidence: 0.6, compositeScore: 0.4 }),
      createMockSignal({ direction: 'SHORT', strength: 'WEAK', confidence: 0.4, compositeScore: -0.3 }),
      createMockSignal({ direction: 'NEUTRAL', strength: 'WEAK', confidence: 0.3, compositeScore: 0.05 }),
    ];

    it('should filter by direction', () => {
      const longSignals = filterSignals(signals, { direction: 'LONG' });
      expect(longSignals).toHaveLength(2);
      expect(longSignals.every(s => s.direction === 'LONG')).toBe(true);
    });

    it('should filter by minimum strength', () => {
      const strongSignals = filterSignals(signals, { minStrength: 'MODERATE' });
      expect(strongSignals).toHaveLength(2);
      expect(strongSignals.every(s => s.strength !== 'WEAK')).toBe(true);
    });

    it('should filter by minimum confidence', () => {
      const confidentSignals = filterSignals(signals, { minConfidence: 0.5 });
      expect(confidentSignals).toHaveLength(2);
      expect(confidentSignals.every(s => s.confidence >= 0.5)).toBe(true);
    });

    it('should filter by minimum absolute score', () => {
      const strongScoreSignals = filterSignals(signals, { minAbsScore: 0.35 });
      expect(strongScoreSignals).toHaveLength(2);
      expect(strongScoreSignals.every(s => Math.abs(s.compositeScore) >= 0.35)).toBe(true);
    });

    it('should exclude neutral signals', () => {
      const nonNeutral = filterSignals(signals, { excludeNeutral: true });
      expect(nonNeutral).toHaveLength(3);
      expect(nonNeutral.every(s => s.direction !== 'NEUTRAL')).toBe(true);
    });

    it('should combine multiple filters', () => {
      const filtered = filterSignals(signals, {
        direction: 'LONG',
        minStrength: 'MODERATE',
        minConfidence: 0.7,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].strength).toBe('STRONG');
    });
  });

  describe('getActionableSignals', () => {
    it('should return only actionable signals', () => {
      const signals = [
        createMockSignal({ direction: 'LONG', confidence: 0.8, compositeScore: 0.6 }),
        createMockSignal({ direction: 'SHORT', confidence: 0.3, compositeScore: -0.5 }), // Low confidence
        createMockSignal({ direction: 'NEUTRAL', confidence: 0.8, compositeScore: 0.1 }), // Neutral
        createMockSignal({ direction: 'LONG', confidence: 0.6, compositeScore: 0.1 }), // Low score
      ];

      const actionable = getActionableSignals(signals);

      expect(actionable).toHaveLength(1);
      expect(actionable[0].direction).toBe('LONG');
      expect(actionable[0].confidence).toBe(0.8);
    });
  });

  describe('summarizeSignals', () => {
    it('should correctly summarize signals', () => {
      const signals = [
        createMockSignal({ direction: 'LONG', strength: 'STRONG', confidence: 0.8 }),
        createMockSignal({ direction: 'LONG', strength: 'MODERATE', confidence: 0.6 }),
        createMockSignal({ direction: 'SHORT', strength: 'WEAK', confidence: 0.4 }),
        createMockSignal({ direction: 'NEUTRAL', strength: 'WEAK', confidence: 0.3 }),
      ];

      const summary = summarizeSignals(signals);

      expect(summary.total).toBe(4);
      expect(summary.bullish).toBe(2);
      expect(summary.bearish).toBe(1);
      expect(summary.neutral).toBe(1);
      expect(summary.strongSignals).toBe(1);
      expect(summary.avgConfidence).toBeCloseTo(0.525);
    });

    it('should handle empty signals array', () => {
      const summary = summarizeSignals([]);

      expect(summary.total).toBe(0);
      expect(summary.bullish).toBe(0);
      expect(summary.bearish).toBe(0);
      expect(summary.neutral).toBe(0);
      expect(summary.avgConfidence).toBe(0);
    });
  });
});

/**
 * Risk Manager Tests
 */

import {
  calculateKellySize,
  calculateKellyFromSignal,
  calculatePortfolioHeat,
  analyzeDrawdown,
  canOpenPosition,
  calculateStopLoss,
  calculateTakeProfit,
  generateRiskReport,
} from '@/lib/trading/risk-manager';
import {
  CompositeSignal,
  PortfolioState,
  Position,
  DEFAULT_RISK_PARAMETERS,
} from '@/types/trading';

describe('Risk Manager', () => {
  describe('calculateKellySize', () => {
    it('should calculate optimal Kelly fraction', () => {
      const result = calculateKellySize(
        0.6, // 60% win rate
        10,  // 10% average win
        5,   // 5% average loss
        100000, // $100k portfolio
        0.25    // Quarter Kelly
      );

      expect(result.optimalFraction).toBeGreaterThan(0);
      expect(result.adjustedFraction).toBeLessThanOrEqual(result.optimalFraction);
      expect(result.suggestedSize).toBeGreaterThan(0);
      expect(result.suggestedSize).toBeLessThan(100000);
    });

    it('should return zero for negative edge', () => {
      const result = calculateKellySize(
        0.4, // 40% win rate (negative edge)
        5,
        10,
        100000,
        0.25
      );

      expect(result.optimalFraction).toBeLessThanOrEqual(0);
      expect(result.adjustedFraction).toBe(0);
      expect(result.suggestedSize).toBe(0);
    });

    it('should throw error for invalid win probability', () => {
      expect(() => {
        calculateKellySize(1.5, 10, 5, 100000, 0.25);
      }).toThrow('Win probability must be between 0 and 1');
    });

    it('should respect Kelly fraction multiplier', () => {
      const fullKelly = calculateKellySize(0.6, 10, 5, 100000, 1);
      const quarterKelly = calculateKellySize(0.6, 10, 5, 100000, 0.25);

      expect(quarterKelly.suggestedSize).toBeCloseTo(fullKelly.suggestedSize * 0.25, 0);
    });
  });

  describe('calculatePortfolioHeat', () => {
    const mockPositions: Position[] = [
      {
        id: 'pos1',
        asset: { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
        side: 'long',
        size: 0.5,
        entryPrice: 45000,
        currentPrice: 46000,
        unrealizedPnl: 500,
        unrealizedPnlPercent: 2.22,
        leverage: 2,
        margin: 11250,
        liquidationPrice: 38000,
        openedAt: new Date(),
        lastUpdated: new Date(),
      },
      {
        id: 'pos2',
        asset: { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
        side: 'short',
        size: 5,
        entryPrice: 2500,
        currentPrice: 2450,
        unrealizedPnl: 250,
        unrealizedPnlPercent: 2,
        leverage: 3,
        margin: 4166,
        liquidationPrice: 2750,
        openedAt: new Date(),
        lastUpdated: new Date(),
      },
    ];

    it('should calculate total portfolio heat', () => {
      const heat = calculatePortfolioHeat(mockPositions, 50000);

      expect(heat.currentHeat).toBeGreaterThan(0);
      expect(heat.heatByAsset.size).toBe(2);
      expect(heat.heatByAsset.has('BTC')).toBe(true);
      expect(heat.heatByAsset.has('ETH')).toBe(true);
    });

    it('should determine warning level correctly', () => {
      // Low heat portfolio
      const lowHeat = calculatePortfolioHeat([], 50000);
      expect(lowHeat.warningLevel).toBe('safe');
      expect(lowHeat.currentHeat).toBe(0);
    });

    it('should return safe warning for empty portfolio', () => {
      const heat = calculatePortfolioHeat([], 50000);
      expect(heat.warningLevel).toBe('safe');
      expect(heat.distanceToLimit).toBe(30);
    });
  });

  describe('analyzeDrawdown', () => {
    it('should calculate drawdown metrics', () => {
      const equityHistory = [
        { timestamp: new Date('2024-01-01'), equity: 100000 },
        { timestamp: new Date('2024-01-02'), equity: 102000 },
        { timestamp: new Date('2024-01-03'), equity: 98000 },
        { timestamp: new Date('2024-01-04'), equity: 95000 },
        { timestamp: new Date('2024-01-05'), equity: 97000 },
      ];

      const analysis = analyzeDrawdown(equityHistory);

      expect(analysis.maxDrawdown).toBeGreaterThan(0);
      expect(analysis.peakValue).toBe(102000);
      expect(analysis.troughValue).toBe(95000);
    });

    it('should handle empty history', () => {
      const analysis = analyzeDrawdown([]);

      expect(analysis.currentDrawdown).toBe(0);
      expect(analysis.maxDrawdown).toBe(0);
    });

    it('should handle always increasing equity', () => {
      const equityHistory = [
        { timestamp: new Date('2024-01-01'), equity: 100000 },
        { timestamp: new Date('2024-01-02'), equity: 105000 },
        { timestamp: new Date('2024-01-03'), equity: 110000 },
      ];

      const analysis = analyzeDrawdown(equityHistory);
      expect(analysis.currentDrawdown).toBe(0);
    });
  });

  describe('canOpenPosition', () => {
    const mockPortfolio: PortfolioState = {
      positions: [],
      totalValue: 50000,
      availableBalance: 40000,
      totalMargin: 10000,
      unrealizedPnl: 0,
      realizedPnl: 0,
      portfolioHeat: 10,
      maxDrawdown: 5,
      currentDrawdown: 2,
      lastUpdated: new Date(),
    };

    it('should allow position within limits', () => {
      const result = canOpenPosition(mockPortfolio, 2000, 2);

      expect(result.allowed).toBe(true);
    });

    it('should reject position exceeding max size', () => {
      const result = canOpenPosition(mockPortfolio, 10000, 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds max');
    });

    it('should reject position exceeding leverage limit', () => {
      const result = canOpenPosition(mockPortfolio, 1000, 10);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Leverage');
    });

    it('should reject when insufficient margin', () => {
      const limitedPortfolio = {
        ...mockPortfolio,
        availableBalance: 100,
      };

      const result = canOpenPosition(limitedPortfolio, 1000, 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient margin');
    });
  });

  describe('calculateStopLoss', () => {
    it('should calculate stop loss for long position', () => {
      const stopLoss = calculateStopLoss(100, 'long', 0.02);

      expect(stopLoss).toBeLessThan(100);
      expect(stopLoss).toBeGreaterThan(90); // Should be within 10%
    });

    it('should calculate stop loss for short position', () => {
      const stopLoss = calculateStopLoss(100, 'short', 0.02);

      expect(stopLoss).toBeGreaterThan(100);
      expect(stopLoss).toBeLessThan(110); // Should be within 10%
    });

    it('should use higher stop for volatile assets', () => {
      const lowVolStop = calculateStopLoss(100, 'long', 0.01);
      const highVolStop = calculateStopLoss(100, 'long', 0.05);

      expect(highVolStop).toBeLessThan(lowVolStop);
    });
  });

  describe('calculateTakeProfit', () => {
    it('should calculate take profit for long position', () => {
      const takeProfit = calculateTakeProfit(100, 'long', 0.02);

      expect(takeProfit).toBeGreaterThan(100);
    });

    it('should calculate take profit for short position', () => {
      const takeProfit = calculateTakeProfit(100, 'short', 0.02);

      expect(takeProfit).toBeLessThan(100);
    });

    it('should maintain risk-reward ratio', () => {
      const entryPrice = 100;
      const volatility = 0.02;

      const stopLoss = calculateStopLoss(entryPrice, 'long', volatility);
      const takeProfit = calculateTakeProfit(entryPrice, 'long', volatility);

      const risk = entryPrice - stopLoss;
      const reward = takeProfit - entryPrice;

      // Should have at least 2:1 risk-reward
      expect(reward / risk).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('generateRiskReport', () => {
    it('should generate comprehensive risk report', () => {
      const mockPortfolio: PortfolioState = {
        positions: [],
        totalValue: 50000,
        availableBalance: 50000,
        totalMargin: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        portfolioHeat: 0,
        maxDrawdown: 0,
        currentDrawdown: 0,
        lastUpdated: new Date(),
      };

      const equityHistory = [
        { timestamp: new Date(), equity: 50000 },
      ];

      const report = generateRiskReport(mockPortfolio, equityHistory);

      expect(report.riskScore).toBeDefined();
      expect(report.heatMetrics).toBeDefined();
      expect(report.drawdownAnalysis).toBeDefined();
      expect(Array.isArray(report.warnings)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should include warnings for high-risk situations', () => {
      const riskyPortfolio: PortfolioState = {
        positions: [],
        totalValue: 50000,
        availableBalance: 5000,
        totalMargin: 45000,
        unrealizedPnl: -5000,
        realizedPnl: 0,
        portfolioHeat: 50,
        maxDrawdown: 15,
        currentDrawdown: 12,
        lastUpdated: new Date(),
      };

      const report = generateRiskReport(riskyPortfolio, []);

      // Should have warnings due to high heat and drawdown
      expect(report.riskScore).toBeGreaterThan(50);
    });
  });
});

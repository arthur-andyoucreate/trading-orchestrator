/**
 * Enhanced Risk Management Module
 * Kelly Criterion position sizing and portfolio heat management
 */

import {
  Position,
  PortfolioState,
  RiskParameters,
  KellyResult,
  HeatMetrics,
  DrawdownAnalysis,
  CompositeSignal,
  DEFAULT_RISK_PARAMETERS,
} from '@/types/trading';
import { RISK_CONFIG } from '@/lib/config/constants';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

/**
 * Calculate Kelly Criterion optimal position size
 *
 * Kelly Fraction = (W × R - L) / R
 * Where:
 *   W = Win probability
 *   L = Loss probability (1 - W)
 *   R = Reward/Risk ratio (average win / average loss)
 */
export function calculateKellySize(
  winProbability: number,
  avgWinPercent: number,
  avgLossPercent: number,
  portfolioValue: number,
  kellyFraction: number = DEFAULT_RISK_PARAMETERS.kellyFraction
): KellyResult {
  // Validate inputs
  if (winProbability < 0 || winProbability > 1) {
    throw new Error('Win probability must be between 0 and 1');
  }
  if (avgWinPercent <= 0 || avgLossPercent <= 0) {
    throw new Error('Average win/loss must be positive');
  }

  const lossProbability = 1 - winProbability;
  const rewardRiskRatio = avgWinPercent / avgLossPercent;

  // Kelly formula
  const optimalFraction = (winProbability * rewardRiskRatio - lossProbability) / rewardRiskRatio;

  // Apply Kelly fraction (fractional Kelly for reduced risk)
  const adjustedFraction = Math.max(0, optimalFraction * kellyFraction);

  // Calculate suggested position size
  const suggestedSize = portfolioValue * adjustedFraction;

  // Expected return
  const expectedReturn = winProbability * avgWinPercent - lossProbability * avgLossPercent;

  // Maximum potential loss
  const maxLoss = suggestedSize * (avgLossPercent / 100);

  // Confidence based on edge quality
  const edge = winProbability - 0.5;
  const confidence = Math.min(1, Math.abs(edge) * 4);

  return {
    optimalFraction: Math.max(0, optimalFraction),
    adjustedFraction,
    suggestedSize,
    expectedReturn,
    maxLoss,
    confidence,
  };
}

/**
 * Calculate Kelly size from signal confidence
 */
export function calculateKellyFromSignal(
  signal: CompositeSignal,
  portfolioValue: number,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): KellyResult {
  if (!isFeatureEnabled('kellyPositionSizing')) {
    return {
      optimalFraction: 0,
      adjustedFraction: 0,
      suggestedSize: 0,
      expectedReturn: 0,
      maxLoss: 0,
      confidence: 0,
    };
  }

  // Estimate win probability from confidence and signal strength
  const baseWinRate = 0.5;
  const confidenceBoost = signal.confidence * 0.2; // Up to 20% boost
  const strengthBoost = signal.strength === 'STRONG' ? 0.1 :
    signal.strength === 'MODERATE' ? 0.05 : 0;

  const winProbability = Math.min(0.75, baseWinRate + confidenceBoost + strengthBoost);

  // Use risk metrics for win/loss estimation
  const volatility = signal.riskMetrics.volatility;
  const avgWinPercent = Math.max(5, volatility * 200); // 2x volatility
  const avgLossPercent = Math.max(3, volatility * 100); // 1x volatility (asymmetric)

  return calculateKellySize(
    winProbability,
    avgWinPercent,
    avgLossPercent,
    portfolioValue,
    riskParams.kellyFraction
  );
}

/**
 * Calculate portfolio heat (aggregate risk exposure)
 */
export function calculatePortfolioHeat(
  positions: Position[],
  portfolioValue: number
): HeatMetrics {
  if (!isFeatureEnabled('portfolioHeatLimits')) {
    return {
      currentHeat: 0,
      heatByAsset: new Map(),
      heatTrend: 'stable',
      distanceToLimit: 100,
      warningLevel: 'safe',
    };
  }

  const heatByAsset = new Map<string, number>();
  let totalHeat = 0;

  for (const position of positions) {
    // Heat = (Position Size × Leverage × |Unrealized PnL Factor|) / Portfolio Value
    const positionValue = position.size * position.currentPrice;
    const leveragedValue = positionValue * position.leverage;
    const unrealizedFactor = 1 + Math.abs(position.unrealizedPnlPercent) / 100;

    const positionHeat = (leveragedValue * unrealizedFactor / portfolioValue) * 100;

    heatByAsset.set(position.asset.symbol, positionHeat);
    totalHeat += positionHeat;
  }

  // Determine warning level
  let warningLevel: 'safe' | 'caution' | 'warning' | 'critical';
  if (totalHeat < RISK_CONFIG.HEAT_LEVEL_SAFE) {
    warningLevel = 'safe';
  } else if (totalHeat < RISK_CONFIG.HEAT_LEVEL_CAUTION) {
    warningLevel = 'caution';
  } else if (totalHeat < RISK_CONFIG.HEAT_LEVEL_WARNING) {
    warningLevel = 'warning';
  } else {
    warningLevel = 'critical';
  }

  const distanceToLimit = Math.max(0, RISK_CONFIG.MAX_PORTFOLIO_HEAT_DEFAULT - totalHeat);

  return {
    currentHeat: totalHeat,
    heatByAsset,
    heatTrend: 'stable', // Would need historical data to determine
    distanceToLimit,
    warningLevel,
  };
}

/**
 * Calculate maximum allowed position size based on heat
 */
export function getMaxAllowedSize(
  portfolioValue: number,
  currentHeat: number,
  leverage: number = 1,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): number {
  const remainingHeatBudget = riskParams.maxPortfolioHeat - currentHeat;

  if (remainingHeatBudget <= 0) {
    return 0;
  }

  // Convert heat budget to position size
  const maxPositionHeat = Math.min(
    remainingHeatBudget,
    riskParams.maxPositionSize
  );

  return (portfolioValue * maxPositionHeat / 100) / leverage;
}

/**
 * Analyze portfolio drawdown
 */
export function analyzeDrawdown(
  equityHistory: Array<{ timestamp: Date; equity: number }>
): DrawdownAnalysis {
  if (equityHistory.length === 0) {
    return {
      currentDrawdown: 0,
      maxDrawdown: 0,
      avgDrawdown: 0,
      drawdownDuration: 0,
      recoveryTime: 0,
      peakValue: 0,
      troughValue: 0,
    };
  }

  let peakValue = equityHistory[0].equity;
  let troughValue = equityHistory[0].equity;
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let drawdownSum = 0;
  let drawdownCount = 0;
  let drawdownStartTime: Date | null = null;
  let drawdownDuration = 0;

  const currentEquity = equityHistory[equityHistory.length - 1].equity;

  for (let i = 0; i < equityHistory.length; i++) {
    const equity = equityHistory[i].equity;

    // Update peak
    if (equity > peakValue) {
      peakValue = equity;
      drawdownStartTime = null;
    }

    // Calculate drawdown from peak
    const drawdown = ((peakValue - equity) / peakValue) * 100;

    if (drawdown > 0) {
      if (!drawdownStartTime) {
        drawdownStartTime = equityHistory[i].timestamp;
      }
      drawdownSum += drawdown;
      drawdownCount++;
    }

    // Update max drawdown
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      troughValue = equity;
    }

    // Current drawdown
    if (i === equityHistory.length - 1) {
      currentDrawdown = drawdown;
      if (drawdownStartTime) {
        drawdownDuration = (equityHistory[i].timestamp.getTime() - drawdownStartTime.getTime()) /
          (1000 * 60 * 60 * 24); // Days
      }
    }
  }

  const avgDrawdown = drawdownCount > 0 ? drawdownSum / drawdownCount : 0;

  // Estimate recovery time based on historical recovery rate
  const recoveryRate = 0.5; // Assume 0.5% recovery per day (adjustable)
  const recoveryTime = currentDrawdown / recoveryRate;

  return {
    currentDrawdown,
    maxDrawdown,
    avgDrawdown,
    drawdownDuration,
    recoveryTime,
    peakValue,
    troughValue,
  };
}

/**
 * Check if trading should be allowed based on risk limits
 */
export function canOpenPosition(
  portfolioState: PortfolioState,
  proposedSize: number,
  leverage: number,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): { allowed: boolean; reason: string } {
  if (!isFeatureEnabled('advancedRiskManagement')) {
    return { allowed: true, reason: 'Risk management disabled' };
  }

  // Check portfolio heat
  const heatMetrics = calculatePortfolioHeat(
    portfolioState.positions,
    portfolioState.totalValue
  );

  if (heatMetrics.warningLevel === 'critical') {
    return {
      allowed: false,
      reason: `Portfolio heat (${heatMetrics.currentHeat.toFixed(1)}%) exceeds critical threshold`,
    };
  }

  // Check max position size
  const proposedValue = proposedSize;
  const maxPositionValue = portfolioState.totalValue * (riskParams.maxPositionSize / 100);

  if (proposedValue > maxPositionValue) {
    return {
      allowed: false,
      reason: `Position size ($${proposedValue.toFixed(0)}) exceeds max ($${maxPositionValue.toFixed(0)})`,
    };
  }

  // Check leverage
  if (leverage > riskParams.maxLeverage) {
    return {
      allowed: false,
      reason: `Leverage (${leverage}x) exceeds max (${riskParams.maxLeverage}x)`,
    };
  }

  // Check drawdown
  if (portfolioState.currentDrawdown > riskParams.maxDrawdownLimit) {
    return {
      allowed: false,
      reason: `Current drawdown (${portfolioState.currentDrawdown.toFixed(1)}%) exceeds limit (${riskParams.maxDrawdownLimit}%)`,
    };
  }

  // Check available balance
  const requiredMargin = proposedSize / leverage;
  if (requiredMargin > portfolioState.availableBalance) {
    return {
      allowed: false,
      reason: `Insufficient margin. Required: $${requiredMargin.toFixed(0)}, Available: $${portfolioState.availableBalance.toFixed(0)}`,
    };
  }

  // Check remaining heat budget
  const maxAllowedSize = getMaxAllowedSize(
    portfolioState.totalValue,
    heatMetrics.currentHeat,
    leverage,
    riskParams
  );

  if (proposedSize > maxAllowedSize) {
    return {
      allowed: false,
      reason: `Position would exceed heat limit. Max size: $${maxAllowedSize.toFixed(0)}`,
    };
  }

  return {
    allowed: true,
    reason: 'Position meets all risk criteria',
  };
}

/**
 * Calculate recommended stop loss based on risk parameters
 */
export function calculateStopLoss(
  entryPrice: number,
  side: 'long' | 'short',
  volatility: number,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): number {
  // Use volatility-adjusted stop loss
  const stopPercent = Math.max(
    riskParams.stopLossDefault,
    volatility * 150 // 1.5x daily volatility
  ) / 100;

  if (side === 'long') {
    return entryPrice * (1 - stopPercent);
  } else {
    return entryPrice * (1 + stopPercent);
  }
}

/**
 * Calculate recommended take profit based on risk parameters
 */
export function calculateTakeProfit(
  entryPrice: number,
  side: 'long' | 'short',
  volatility: number,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): number {
  // Use risk-reward ratio of 2:1 minimum
  const takeProfitPercent = Math.max(
    riskParams.takeProfitDefault,
    volatility * 300 // 3x daily volatility
  ) / 100;

  if (side === 'long') {
    return entryPrice * (1 + takeProfitPercent);
  } else {
    return entryPrice * (1 - takeProfitPercent);
  }
}

/**
 * Calculate trailing stop parameters
 */
export function calculateTrailingStop(
  entryPrice: number,
  currentPrice: number,
  side: 'long' | 'short',
  volatility: number,
  activationPercent: number = RISK_CONFIG.TRAILING_STOP_ACTIVATION
): {
  isActivated: boolean;
  trailDistance: number;
  stopPrice: number;
} {
  const pnlPercent = side === 'long'
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;

  const isActivated = pnlPercent >= activationPercent;

  // Trail distance based on volatility
  const trailDistance = Math.max(2, volatility * 100);

  let stopPrice: number;
  if (side === 'long') {
    stopPrice = isActivated
      ? currentPrice * (1 - trailDistance / 100)
      : entryPrice * (1 - RISK_CONFIG.DEFAULT_STOP_LOSS_PERCENT / 100);
  } else {
    stopPrice = isActivated
      ? currentPrice * (1 + trailDistance / 100)
      : entryPrice * (1 + RISK_CONFIG.DEFAULT_STOP_LOSS_PERCENT / 100);
  }

  return {
    isActivated,
    trailDistance,
    stopPrice,
  };
}

/**
 * Get position sizing recommendation
 */
export function getPositionSizeRecommendation(
  signal: CompositeSignal,
  portfolioState: PortfolioState,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): {
  recommendedSize: number;
  kellyResult: KellyResult;
  adjustments: string[];
  finalSize: number;
} {
  const adjustments: string[] = [];

  // Calculate Kelly-based size
  const kellyResult = calculateKellyFromSignal(
    signal,
    portfolioState.totalValue,
    riskParams
  );

  let recommendedSize = kellyResult.suggestedSize;
  adjustments.push(`Kelly suggested: $${recommendedSize.toFixed(0)}`);

  // Adjust for portfolio heat
  const heatMetrics = calculatePortfolioHeat(
    portfolioState.positions,
    portfolioState.totalValue
  );

  if (heatMetrics.warningLevel !== 'safe') {
    const heatMultiplier = heatMetrics.warningLevel === 'caution' ? 0.7 :
      heatMetrics.warningLevel === 'warning' ? 0.4 : 0.1;
    recommendedSize *= heatMultiplier;
    adjustments.push(`Heat adjustment (${heatMetrics.warningLevel}): -${((1 - heatMultiplier) * 100).toFixed(0)}%`);
  }

  // Adjust for drawdown
  if (portfolioState.currentDrawdown > RISK_CONFIG.DRAWDOWN_WARNING_THRESHOLD) {
    const drawdownMultiplier = 1 - (portfolioState.currentDrawdown / riskParams.maxDrawdownLimit);
    recommendedSize *= Math.max(0.2, drawdownMultiplier);
    adjustments.push(`Drawdown adjustment: -${((1 - drawdownMultiplier) * 100).toFixed(0)}%`);
  }

  // Cap at max position size
  const maxSize = portfolioState.totalValue * (riskParams.maxPositionSize / 100);
  if (recommendedSize > maxSize) {
    recommendedSize = maxSize;
    adjustments.push(`Capped at max position size: $${maxSize.toFixed(0)}`);
  }

  // Ensure minimum viable size
  const minSize = 100; // Minimum $100 position
  const finalSize = Math.max(0, recommendedSize < minSize ? 0 : recommendedSize);

  if (finalSize === 0 && recommendedSize > 0) {
    adjustments.push('Position too small - not recommended');
  }

  return {
    recommendedSize,
    kellyResult,
    adjustments,
    finalSize,
  };
}

/**
 * Generate risk report for portfolio
 */
export function generateRiskReport(
  portfolioState: PortfolioState,
  equityHistory: Array<{ timestamp: Date; equity: number }>,
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): {
  heatMetrics: HeatMetrics;
  drawdownAnalysis: DrawdownAnalysis;
  riskScore: number;
  recommendations: string[];
  warnings: string[];
} {
  const heatMetrics = calculatePortfolioHeat(
    portfolioState.positions,
    portfolioState.totalValue
  );

  const drawdownAnalysis = analyzeDrawdown(equityHistory);

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Generate warnings
  if (heatMetrics.warningLevel === 'critical') {
    warnings.push('CRITICAL: Portfolio heat exceeds safe limits. Reduce exposure immediately.');
  } else if (heatMetrics.warningLevel === 'warning') {
    warnings.push('WARNING: Portfolio heat is elevated. Consider reducing position sizes.');
  }

  if (drawdownAnalysis.currentDrawdown > RISK_CONFIG.DRAWDOWN_CRITICAL_THRESHOLD) {
    warnings.push(`CRITICAL: Current drawdown (${drawdownAnalysis.currentDrawdown.toFixed(1)}%) approaching limit.`);
  }

  // Generate recommendations
  if (heatMetrics.currentHeat < RISK_CONFIG.HEAT_LEVEL_SAFE) {
    recommendations.push('Portfolio heat is low. Room for additional positions.');
  }

  if (drawdownAnalysis.maxDrawdown > riskParams.maxDrawdownLimit) {
    recommendations.push('Consider implementing tighter stop losses to prevent future max drawdowns.');
  }

  // Calculate overall risk score (0-100, lower is better)
  const heatScore = (heatMetrics.currentHeat / riskParams.maxPortfolioHeat) * 40;
  const drawdownScore = (drawdownAnalysis.currentDrawdown / riskParams.maxDrawdownLimit) * 40;
  const exposureScore = portfolioState.positions.length > 5 ? 20 : portfolioState.positions.length * 4;

  const riskScore = Math.min(100, heatScore + drawdownScore + exposureScore);

  return {
    heatMetrics,
    drawdownAnalysis,
    riskScore,
    recommendations,
    warnings,
  };
}

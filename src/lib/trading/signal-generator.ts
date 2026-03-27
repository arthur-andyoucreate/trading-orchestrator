/**
 * Multi-Factor Signal Generation Engine
 * Combines Reddit, TVL, News, and Forecasting signals with configurable weights
 *
 * Default weights: 25% Reddit + 25% TVL + 20% News + 30% Forecasting
 */

import {
  CompositeSignal,
  SignalScore,
  SignalWeights,
  SignalDirection,
  SignalStrength,
  TradingAction,
  SignalRiskMetrics,
  Asset,
  DEFAULT_SIGNAL_WEIGHTS,
  DEFAULT_RISK_PARAMETERS,
} from '@/types/trading';
import { analyzeRedditSentiment, redditSentimentToSignal } from '@/lib/sentiment/reddit-analyzer';
import { analyzeTVL, tvlToSignal } from '@/lib/analysis/tvl-analyzer';
import { analyzeNewsForAsset, newsToSignal } from '@/lib/sentiment/news-analyzer';
import { generateForecast, forecastToSignal, generateMockPriceData } from '@/lib/forecasting/time-series';
import { SIGNAL_CONFIG, SUPPORTED_ASSETS } from '@/lib/config/constants';
import { getAdjustedWeights, isFeatureEnabled } from '@/lib/config/feature-flags';
import { v4 as uuidv4 } from 'uuid';

// UUID alternative if uuid package not installed
function generateId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate signal component from Reddit sentiment
 */
async function generateRedditSignal(asset: string): Promise<SignalScore | null> {
  if (!isFeatureEnabled('redditSentiment')) {
    return null;
  }

  try {
    const sentimentResult = await analyzeRedditSentiment(asset);
    if (!sentimentResult) return null;
    return redditSentimentToSignal(sentimentResult);
  } catch (error) {
    console.error(`Reddit signal error for ${asset}:`, error);
    return null;
  }
}

/**
 * Generate signal component from TVL analysis
 */
async function generateTVLSignal(asset: string): Promise<SignalScore | null> {
  if (!isFeatureEnabled('defiTvl')) {
    return null;
  }

  try {
    const tvlResult = await analyzeTVL(asset);
    if (!tvlResult) return null;
    return tvlToSignal(tvlResult);
  } catch (error) {
    console.error(`TVL signal error for ${asset}:`, error);
    return null;
  }
}

/**
 * Generate signal component from news analysis
 */
async function generateNewsSignal(asset: string): Promise<SignalScore | null> {
  if (!isFeatureEnabled('newsAnalysis')) {
    return null;
  }

  try {
    const newsResult = await analyzeNewsForAsset(asset);
    if (!newsResult) return null;
    return newsToSignal(newsResult);
  } catch (error) {
    console.error(`News signal error for ${asset}:`, error);
    return null;
  }
}

/**
 * Generate signal component from forecasting
 */
async function generateForecastSignal(asset: string): Promise<SignalScore | null> {
  if (!isFeatureEnabled('forecasting')) {
    return null;
  }

  try {
    // In production, fetch real price data from Hyperliquid
    const priceData = generateMockPriceData(asset, 168);
    const forecastResult = await generateForecast(priceData);
    if (!forecastResult) return null;
    return forecastToSignal(forecastResult);
  } catch (error) {
    console.error(`Forecast signal error for ${asset}:`, error);
    return null;
  }
}

/**
 * Calculate composite signal score from component signals
 */
function calculateCompositeScore(
  components: {
    reddit: SignalScore | null;
    tvl: SignalScore | null;
    news: SignalScore | null;
    forecast: SignalScore | null;
  },
  weights: SignalWeights
): { score: number; confidence: number } {
  const adjustedWeights = getAdjustedWeights(weights);

  let weightedSum = 0;
  let totalWeight = 0;
  let confidenceSum = 0;

  if (components.reddit && adjustedWeights.reddit > 0) {
    weightedSum += components.reddit.value * adjustedWeights.reddit;
    totalWeight += adjustedWeights.reddit;
    confidenceSum += components.reddit.confidence * adjustedWeights.reddit;
  }

  if (components.tvl && adjustedWeights.tvl > 0) {
    weightedSum += components.tvl.value * adjustedWeights.tvl;
    totalWeight += adjustedWeights.tvl;
    confidenceSum += components.tvl.confidence * adjustedWeights.tvl;
  }

  if (components.news && adjustedWeights.news > 0) {
    weightedSum += components.news.value * adjustedWeights.news;
    totalWeight += adjustedWeights.news;
    confidenceSum += components.news.confidence * adjustedWeights.news;
  }

  if (components.forecast && adjustedWeights.forecast > 0) {
    weightedSum += components.forecast.value * adjustedWeights.forecast;
    totalWeight += adjustedWeights.forecast;
    confidenceSum += components.forecast.confidence * adjustedWeights.forecast;
  }

  if (totalWeight === 0) {
    return { score: 0, confidence: 0 };
  }

  return {
    score: weightedSum / totalWeight,
    confidence: confidenceSum / totalWeight,
  };
}

/**
 * Determine signal direction from composite score
 */
function determineDirection(score: number): SignalDirection {
  if (score > 0.15) return 'LONG';
  if (score < -0.15) return 'SHORT';
  return 'NEUTRAL';
}

/**
 * Determine signal strength from composite score
 */
function determineStrength(score: number): SignalStrength {
  const absScore = Math.abs(score);
  if (absScore >= SIGNAL_CONFIG.STRONG_SIGNAL_THRESHOLD) return 'STRONG';
  if (absScore >= SIGNAL_CONFIG.MODERATE_SIGNAL_THRESHOLD) return 'MODERATE';
  return 'WEAK';
}

/**
 * Calculate risk metrics for the signal
 */
function calculateRiskMetrics(
  asset: string,
  components: {
    reddit: SignalScore | null;
    tvl: SignalScore | null;
    news: SignalScore | null;
    forecast: SignalScore | null;
  }
): SignalRiskMetrics {
  // Extract volatility from forecast if available
  const volatility = components.forecast?.metadata?.volatilityForecast ?? 0.02;

  // Estimate correlation with BTC (simplified)
  const btcCorrelation = asset.toUpperCase() === 'BTC' ? 1 :
    asset.toUpperCase() === 'ETH' ? 0.85 :
    0.6; // Default for other assets

  // Liquidity score based on TVL health
  const liquidityScore = components.tvl?.confidence ?? 0.5;

  // Max drawdown risk based on volatility
  const maxDrawdownRisk = Math.min(0.3, volatility * 5);

  return {
    volatility,
    correlationWithBtc: btcCorrelation,
    liquidityScore,
    maxDrawdownRisk,
  };
}

/**
 * Suggest trading action based on signal
 */
function suggestTradingAction(
  direction: SignalDirection,
  strength: SignalStrength,
  confidence: number,
  riskMetrics: SignalRiskMetrics
): TradingAction {
  // Base position size as percentage of portfolio
  let suggestedSize = 0;

  if (direction !== 'NEUTRAL' && confidence >= SIGNAL_CONFIG.MIN_CONFIDENCE_FOR_TRADE) {
    // Base size by strength
    switch (strength) {
      case 'STRONG':
        suggestedSize = DEFAULT_RISK_PARAMETERS.maxPositionSize;
        break;
      case 'MODERATE':
        suggestedSize = DEFAULT_RISK_PARAMETERS.maxPositionSize * 0.5;
        break;
      case 'WEAK':
        suggestedSize = DEFAULT_RISK_PARAMETERS.maxPositionSize * 0.25;
        break;
    }

    // Adjust for confidence
    suggestedSize *= confidence;

    // Adjust for risk metrics
    if (riskMetrics.liquidityScore < 0.5) {
      suggestedSize *= 0.7;
    }
    if (riskMetrics.maxDrawdownRisk > 0.1) {
      suggestedSize *= (1 - riskMetrics.maxDrawdownRisk);
    }
  }

  // Calculate Kelly fraction (simplified)
  const winRate = 0.5 + (confidence * 0.15); // Estimate win rate from confidence
  const avgWin = 0.05; // 5% average win
  const avgLoss = 0.03; // 3% average loss
  const kellyFraction = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;

  // Stop loss and take profit based on volatility
  const stopLoss = Math.max(
    DEFAULT_RISK_PARAMETERS.stopLossDefault,
    riskMetrics.volatility * 100 * 1.5
  );
  const takeProfit = Math.max(
    DEFAULT_RISK_PARAMETERS.takeProfitDefault,
    riskMetrics.volatility * 100 * 3
  );

  // Determine action type
  let type: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  let reason: string;

  if (direction === 'NEUTRAL') {
    type = 'HOLD';
    reason = 'Neutral signal - no clear direction';
  } else if (direction === 'LONG') {
    type = 'BUY';
    reason = `${strength} bullish signal with ${(confidence * 100).toFixed(0)}% confidence`;
  } else {
    type = 'SELL';
    reason = `${strength} bearish signal with ${(confidence * 100).toFixed(0)}% confidence`;
  }

  return {
    type,
    suggestedSize: Math.round(suggestedSize * 100) / 100,
    kellyFraction: Math.max(0, kellyFraction),
    stopLoss,
    takeProfit,
    reason,
  };
}

/**
 * Generate a composite signal for an asset
 */
export async function generateCompositeSignal(
  asset: string,
  weights: SignalWeights = DEFAULT_SIGNAL_WEIGHTS
): Promise<CompositeSignal | null> {
  console.log(`Generating composite signal for ${asset}...`);

  // Get asset info
  const assetInfo = SUPPORTED_ASSETS.find(a => a.symbol === asset.toUpperCase());
  const assetObj: Asset = assetInfo
    ? { symbol: assetInfo.symbol, name: assetInfo.name, type: assetInfo.type as any }
    : { symbol: asset, name: asset, type: 'crypto' };

  try {
    // Generate all component signals in parallel
    const [redditSignal, tvlSignal, newsSignal, forecastSignal] = await Promise.all([
      generateRedditSignal(asset),
      generateTVLSignal(asset),
      generateNewsSignal(asset),
      generateForecastSignal(asset),
    ]);

    const components = {
      reddit: redditSignal,
      tvl: tvlSignal,
      news: newsSignal,
      forecast: forecastSignal,
    };

    // Check if we have at least one signal
    const hasSignal = Object.values(components).some(s => s !== null);
    if (!hasSignal) {
      console.log(`No signals generated for ${asset}`);
      return null;
    }

    // Calculate composite score
    const { score, confidence } = calculateCompositeScore(components, weights);

    // Determine direction and strength
    const direction = determineDirection(score);
    const strength = determineStrength(score);

    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(asset, components);

    // Suggest trading action
    const suggestedAction = suggestTradingAction(
      direction,
      strength,
      confidence,
      riskMetrics
    );

    // Create composite signal
    const signal: CompositeSignal = {
      id: generateId(),
      asset: assetObj,
      direction,
      strength,
      compositeScore: score,
      confidence,
      components,
      weights,
      suggestedAction,
      riskMetrics,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + SIGNAL_CONFIG.SIGNAL_EXPIRATION_MS),
    };

    console.log(`Signal generated for ${asset}: ${direction} (${strength}) - Score: ${score.toFixed(3)}`);

    return signal;
  } catch (error) {
    console.error(`Error generating composite signal for ${asset}:`, error);
    return null;
  }
}

/**
 * Generate signals for multiple assets
 */
export async function generateMultipleSignals(
  assets: string[],
  weights: SignalWeights = DEFAULT_SIGNAL_WEIGHTS
): Promise<CompositeSignal[]> {
  const signals: CompositeSignal[] = [];

  for (const asset of assets) {
    const signal = await generateCompositeSignal(asset, weights);
    if (signal) {
      signals.push(signal);
    }

    // Rate limit between assets
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Sort by absolute composite score (strongest signals first)
  signals.sort((a, b) => Math.abs(b.compositeScore) - Math.abs(a.compositeScore));

  return signals;
}

/**
 * Get signals for all supported assets
 */
export async function getAllAssetSignals(
  weights: SignalWeights = DEFAULT_SIGNAL_WEIGHTS
): Promise<CompositeSignal[]> {
  const assets = SUPPORTED_ASSETS.map(a => a.symbol);
  return generateMultipleSignals(assets, weights);
}

/**
 * Filter signals by criteria
 */
export function filterSignals(
  signals: CompositeSignal[],
  options: {
    direction?: SignalDirection;
    minStrength?: SignalStrength;
    minConfidence?: number;
    minAbsScore?: number;
    excludeNeutral?: boolean;
  }
): CompositeSignal[] {
  return signals.filter(signal => {
    if (options.direction && signal.direction !== options.direction) {
      return false;
    }

    if (options.minStrength) {
      const strengthOrder = { 'WEAK': 0, 'MODERATE': 1, 'STRONG': 2 };
      if (strengthOrder[signal.strength] < strengthOrder[options.minStrength]) {
        return false;
      }
    }

    if (options.minConfidence && signal.confidence < options.minConfidence) {
      return false;
    }

    if (options.minAbsScore && Math.abs(signal.compositeScore) < options.minAbsScore) {
      return false;
    }

    if (options.excludeNeutral && signal.direction === 'NEUTRAL') {
      return false;
    }

    return true;
  });
}

/**
 * Get actionable signals (strong enough to trade)
 */
export function getActionableSignals(signals: CompositeSignal[]): CompositeSignal[] {
  return filterSignals(signals, {
    minConfidence: SIGNAL_CONFIG.MIN_CONFIDENCE_FOR_TRADE,
    minAbsScore: SIGNAL_CONFIG.WEAK_SIGNAL_THRESHOLD,
    excludeNeutral: true,
  });
}

/**
 * Summarize signals for dashboard
 */
export function summarizeSignals(signals: CompositeSignal[]): {
  total: number;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  strongSignals: number;
  actionableSignals: number;
} {
  const bullish = signals.filter(s => s.direction === 'LONG').length;
  const bearish = signals.filter(s => s.direction === 'SHORT').length;
  const neutral = signals.filter(s => s.direction === 'NEUTRAL').length;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length || 0;
  const strongSignals = signals.filter(s => s.strength === 'STRONG').length;
  const actionableSignals = getActionableSignals(signals).length;

  return {
    total: signals.length,
    bullish,
    bearish,
    neutral,
    avgConfidence,
    strongSignals,
    actionableSignals,
  };
}

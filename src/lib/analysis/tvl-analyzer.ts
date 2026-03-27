/**
 * TVL Signal Analyzer
 * Analyzes DeFi TVL data to generate trading signals
 */

import {
  TVLData,
  TVLSignalResult,
  SignalScore,
} from '@/types/trading';
import {
  fetchAllProtocols,
  fetchProtocolTVL,
  fetchHistoricalTVL,
  fetchProtocolsBySymbol,
} from '@/lib/api/defillama';
import { TVL_CONFIG, SIGNAL_CONFIG } from '@/lib/config/constants';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

/**
 * Calculate TVL momentum over a period
 */
function calculateMomentum(
  history: Array<{ date: Date; tvl: number }>
): number {
  if (history.length < 2) return 0;

  // Calculate average daily change
  let totalChange = 0;
  for (let i = 1; i < history.length; i++) {
    const prevTvl = history[i - 1].tvl;
    const currTvl = history[i].tvl;
    if (prevTvl > 0) {
      totalChange += (currTvl - prevTvl) / prevTvl;
    }
  }

  const avgChange = totalChange / (history.length - 1);

  // Normalize to -1 to 1 scale
  return Math.max(-1, Math.min(1, avgChange * 10));
}

/**
 * Assess protocol health based on TVL metrics
 */
function assessHealth(tvlData: TVLData): {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
} {
  let score = 0.5; // Start neutral

  // TVL size factor
  if (tvlData.tvl >= TVL_CONFIG.HEALTHY_TVL_THRESHOLD) {
    score += 0.2;
  } else if (tvlData.tvl >= TVL_CONFIG.HEALTHY_TVL_THRESHOLD / 10) {
    score += 0.1;
  } else {
    score -= 0.1;
  }

  // Growth factor (7-day change)
  if (tvlData.change7d > 10) {
    score += 0.15;
  } else if (tvlData.change7d > 0) {
    score += 0.05;
  } else if (tvlData.change7d < -10) {
    score -= 0.2;
  } else if (tvlData.change7d < 0) {
    score -= 0.1;
  }

  // Volatility factor (large swings are risky)
  if (Math.abs(tvlData.change24h) > 20) {
    score -= 0.1;
  }

  // MCap/TVL ratio (if available)
  if (tvlData.mcapTvl !== undefined) {
    if (tvlData.mcapTvl > 1 && tvlData.mcapTvl < 5) {
      score += 0.1; // Healthy ratio
    } else if (tvlData.mcapTvl > 10) {
      score -= 0.1; // Potentially overvalued
    }
  }

  score = Math.max(0, Math.min(1, score));

  let riskLevel: 'low' | 'medium' | 'high';
  if (score >= 0.7) {
    riskLevel = 'low';
  } else if (score >= 0.4) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return { score, riskLevel };
}

/**
 * Calculate TVL signal score
 */
function calculateTVLScore(
  change24h: number,
  change7d: number,
  momentum: number,
  healthScore: number
): number {
  // Weight factors
  const weights = {
    change24h: 0.2,
    change7d: 0.3,
    momentum: 0.25,
    health: 0.25,
  };

  // Normalize changes to -1 to 1
  const normalizedChange24h = Math.tanh(change24h / TVL_CONFIG.SIGNIFICANT_CHANGE_24H);
  const normalizedChange7d = Math.tanh(change7d / TVL_CONFIG.SIGNIFICANT_CHANGE_7D);

  const score =
    normalizedChange24h * weights.change24h +
    normalizedChange7d * weights.change7d +
    momentum * weights.momentum +
    (healthScore - 0.5) * 2 * weights.health; // Convert 0-1 to -1 to 1

  return Math.max(-1, Math.min(1, score));
}

/**
 * Analyze TVL for a specific asset/protocol
 */
export async function analyzeTVL(
  asset: string
): Promise<TVLSignalResult | null> {
  // Check feature flag
  if (!isFeatureEnabled('defiTvl')) {
    console.log('DeFi TVL analysis is disabled');
    return null;
  }

  try {
    // Find protocols associated with the asset
    const protocolsResult = await fetchProtocolsBySymbol(asset);

    if (!protocolsResult.success || !protocolsResult.data || protocolsResult.data.length === 0) {
      console.log(`No TVL data found for ${asset}`);
      return null;
    }

    // Use the largest protocol by TVL
    const mainProtocol = protocolsResult.data[0];

    // Fetch historical data for momentum calculation
    const historyResult = await fetchHistoricalTVL(mainProtocol.protocol, 30);
    const history = historyResult.success && historyResult.data
      ? historyResult.data
      : [];

    // Calculate momentum
    const momentum = calculateMomentum(history);

    // Assess health
    const { score: healthScore, riskLevel } = assessHealth(mainProtocol);

    // Calculate overall TVL score
    const tvlScore = calculateTVLScore(
      mainProtocol.change24h,
      mainProtocol.change7d,
      momentum,
      healthScore
    );

    // Determine trend
    let tvlTrend: 'increasing' | 'decreasing' | 'stable';
    if (tvlScore > 0.2) {
      tvlTrend = 'increasing';
    } else if (tvlScore < -0.2) {
      tvlTrend = 'decreasing';
    } else {
      tvlTrend = 'stable';
    }

    // Calculate relative strength (vs all protocols)
    const allProtocolsResult = await fetchAllProtocols();
    let protocolRank = 0;
    let relativeStrength = 0;

    if (allProtocolsResult.success && allProtocolsResult.data) {
      const sortedByTvl = allProtocolsResult.data.sort((a, b) => b.tvl - a.tvl);
      const index = sortedByTvl.findIndex(
        p => p.protocol.toLowerCase() === mainProtocol.protocol.toLowerCase()
      );
      if (index >= 0) {
        protocolRank = index + 1;
        relativeStrength = 1 - (index / sortedByTvl.length);
      }
    }

    // Calculate confidence
    const confidence = Math.min(
      1,
      (history.length >= 14 ? 0.4 : history.length / 35) +
      (mainProtocol.tvl >= TVL_CONFIG.HEALTHY_TVL_THRESHOLD ? 0.3 : mainProtocol.tvl / (TVL_CONFIG.HEALTHY_TVL_THRESHOLD * 3.33)) +
      0.3 // Base confidence
    );

    return {
      asset,
      currentTvl: mainProtocol.tvl,
      tvlTrend,
      tvlScore,
      momentum,
      healthScore,
      riskLevel,
      relativeStrength,
      protocolRank,
      confidence,
      breakdown: {
        shortTermTrend: Math.tanh(mainProtocol.change24h / TVL_CONFIG.SIGNIFICANT_CHANGE_24H),
        mediumTermTrend: Math.tanh(mainProtocol.change7d / TVL_CONFIG.SIGNIFICANT_CHANGE_7D),
        longTermTrend: momentum,
        volumeChange: 0, // Would need separate volume data
      },
    };
  } catch (error) {
    console.error('Error analyzing TVL:', error);
    return null;
  }
}

/**
 * Convert TVL analysis result to signal score
 */
export function tvlToSignal(result: TVLSignalResult): SignalScore {
  // Combine TVL score with health and momentum factors
  let signalValue = result.tvlScore;

  // Boost based on relative strength
  if (result.relativeStrength > 0.9) {
    signalValue = Math.min(1, signalValue + 0.1);
  }

  // Reduce signal for high-risk protocols
  if (result.riskLevel === 'high') {
    signalValue *= 0.7;
  } else if (result.riskLevel === 'medium') {
    signalValue *= 0.85;
  }

  return {
    value: Math.max(-1, Math.min(1, signalValue)),
    confidence: result.confidence,
    timestamp: new Date(),
    source: 'defi_tvl',
    metadata: {
      currentTvl: result.currentTvl,
      tvlTrend: result.tvlTrend,
      momentum: result.momentum,
      healthScore: result.healthScore,
      riskLevel: result.riskLevel,
      protocolRank: result.protocolRank,
    },
  };
}

/**
 * Get market-wide TVL analysis
 */
export async function getMarketTVLAnalysis(): Promise<{
  totalTvl: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  avgChange24h: number;
  avgChange7d: number;
  topGainers: TVLData[];
  topLosers: TVLData[];
  confidence: number;
}> {
  try {
    const result = await fetchAllProtocols();

    if (!result.success || !result.data) {
      throw new Error('Failed to fetch protocol data');
    }

    const protocols = result.data;
    const totalTvl = protocols.reduce((sum, p) => sum + p.tvl, 0);

    // Calculate weighted averages
    let weightedChange24h = 0;
    let weightedChange7d = 0;

    for (const p of protocols) {
      const weight = p.tvl / totalTvl;
      weightedChange24h += p.change24h * weight;
      weightedChange7d += p.change7d * weight;
    }

    // Determine market trend
    let marketTrend: 'bullish' | 'bearish' | 'neutral';
    if (weightedChange7d > 5) {
      marketTrend = 'bullish';
    } else if (weightedChange7d < -5) {
      marketTrend = 'bearish';
    } else {
      marketTrend = 'neutral';
    }

    // Get top gainers and losers
    const sortedByChange = [...protocols].sort((a, b) => b.change24h - a.change24h);
    const topGainers = sortedByChange.slice(0, 5);
    const topLosers = sortedByChange.slice(-5).reverse();

    return {
      totalTvl,
      marketTrend,
      avgChange24h: weightedChange24h,
      avgChange7d: weightedChange7d,
      topGainers,
      topLosers,
      confidence: Math.min(1, protocols.length / 100),
    };
  } catch (error) {
    console.error('Error getting market TVL analysis:', error);
    return {
      totalTvl: 0,
      marketTrend: 'neutral',
      avgChange24h: 0,
      avgChange7d: 0,
      topGainers: [],
      topLosers: [],
      confidence: 0,
    };
  }
}

/**
 * Analyze multiple assets in batch
 */
export async function analyzeMultipleAssetsTVL(
  assets: string[]
): Promise<Map<string, TVLSignalResult>> {
  const results = new Map<string, TVLSignalResult>();

  for (const asset of assets) {
    const result = await analyzeTVL(asset);
    if (result) {
      results.set(asset, result);
    }

    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

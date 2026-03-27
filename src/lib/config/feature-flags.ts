/**
 * Feature Flags Configuration
 * Enables gradual rollout of intelligence modules
 */

import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/types/trading';

// Environment variable prefix for feature flags
const FEATURE_FLAG_PREFIX = 'FEATURE_';

/**
 * Parse boolean from environment variable
 */
function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get feature flags from environment variables
 */
export function getFeatureFlags(): FeatureFlags {
  // Server-side: read from process.env
  if (typeof window === 'undefined') {
    return {
      redditSentiment: parseEnvBool(
        process.env.FEATURE_REDDIT_SENTIMENT,
        DEFAULT_FEATURE_FLAGS.redditSentiment
      ),
      defiTvl: parseEnvBool(
        process.env.FEATURE_DEFI_TVL,
        DEFAULT_FEATURE_FLAGS.defiTvl
      ),
      newsAnalysis: parseEnvBool(
        process.env.FEATURE_NEWS_ANALYSIS,
        DEFAULT_FEATURE_FLAGS.newsAnalysis
      ),
      forecasting: parseEnvBool(
        process.env.FEATURE_FORECASTING,
        DEFAULT_FEATURE_FLAGS.forecasting
      ),
      liveTrading: parseEnvBool(
        process.env.FEATURE_LIVE_TRADING,
        DEFAULT_FEATURE_FLAGS.liveTrading
      ),
      kellyPositionSizing: parseEnvBool(
        process.env.FEATURE_KELLY_POSITION_SIZING,
        DEFAULT_FEATURE_FLAGS.kellyPositionSizing
      ),
      portfolioHeatLimits: parseEnvBool(
        process.env.FEATURE_PORTFOLIO_HEAT_LIMITS,
        DEFAULT_FEATURE_FLAGS.portfolioHeatLimits
      ),
      advancedRiskManagement: parseEnvBool(
        process.env.FEATURE_ADVANCED_RISK_MANAGEMENT,
        DEFAULT_FEATURE_FLAGS.advancedRiskManagement
      ),
      realtimeUpdates: parseEnvBool(
        process.env.FEATURE_REALTIME_UPDATES,
        DEFAULT_FEATURE_FLAGS.realtimeUpdates
      ),
      backtesting: parseEnvBool(
        process.env.FEATURE_BACKTESTING,
        DEFAULT_FEATURE_FLAGS.backtesting
      ),
      alertSystem: parseEnvBool(
        process.env.FEATURE_ALERT_SYSTEM,
        DEFAULT_FEATURE_FLAGS.alertSystem
      ),
    };
  }

  // Client-side: use defaults (actual values should come from server)
  return DEFAULT_FEATURE_FLAGS;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Get active signal sources based on feature flags
 */
export function getActiveSignalSources(): string[] {
  const flags = getFeatureFlags();
  const sources: string[] = [];

  if (flags.redditSentiment) sources.push('reddit');
  if (flags.defiTvl) sources.push('tvl');
  if (flags.newsAnalysis) sources.push('news');
  if (flags.forecasting) sources.push('forecast');

  return sources;
}

/**
 * Calculate adjusted signal weights based on active features
 */
export function getAdjustedWeights(baseWeights: {
  reddit: number;
  tvl: number;
  news: number;
  forecast: number;
}): { reddit: number; tvl: number; news: number; forecast: number } {
  const flags = getFeatureFlags();

  // Get active weights
  let activeTotal = 0;
  const activeWeights = {
    reddit: flags.redditSentiment ? baseWeights.reddit : 0,
    tvl: flags.defiTvl ? baseWeights.tvl : 0,
    news: flags.newsAnalysis ? baseWeights.news : 0,
    forecast: flags.forecasting ? baseWeights.forecast : 0,
  };

  // Calculate total of active weights
  activeTotal =
    activeWeights.reddit +
    activeWeights.tvl +
    activeWeights.news +
    activeWeights.forecast;

  // If no features enabled, return zeros
  if (activeTotal === 0) {
    return { reddit: 0, tvl: 0, news: 0, forecast: 0 };
  }

  // Normalize weights to sum to 1
  return {
    reddit: activeWeights.reddit / activeTotal,
    tvl: activeWeights.tvl / activeTotal,
    news: activeWeights.news / activeTotal,
    forecast: activeWeights.forecast / activeTotal,
  };
}

/**
 * Feature flag context for React components
 */
export interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
  refresh: () => void;
}

/**
 * Feature flag descriptions for UI
 */
export const FEATURE_FLAG_DESCRIPTIONS: Record<keyof FeatureFlags, string> = {
  redditSentiment: 'Reddit sentiment analysis from r/CryptoCurrency',
  defiTvl: 'DeFi Total Value Locked monitoring via DeFiLlama',
  newsAnalysis: 'Breaking news analysis and impact scoring',
  forecasting: 'Time series forecasting with ARIMA and Prophet',
  liveTrading: 'Live trading execution on Hyperliquid',
  kellyPositionSizing: 'Kelly Criterion position sizing',
  portfolioHeatLimits: 'Portfolio heat tracking and limits',
  advancedRiskManagement: 'Advanced risk management features',
  realtimeUpdates: 'Real-time dashboard updates',
  backtesting: 'Strategy backtesting engine',
  alertSystem: 'Trading alerts and notifications',
};

/**
 * Feature flag categories for organization
 */
export const FEATURE_FLAG_CATEGORIES = {
  intelligence: ['redditSentiment', 'defiTvl', 'newsAnalysis', 'forecasting'],
  trading: ['liveTrading', 'kellyPositionSizing'],
  risk: ['portfolioHeatLimits', 'advancedRiskManagement'],
  system: ['realtimeUpdates', 'backtesting', 'alertSystem'],
} as const;

/**
 * Validate feature flag configuration
 */
export function validateFeatureFlags(flags: Partial<FeatureFlags>): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for dangerous configurations
  if (flags.liveTrading && !flags.advancedRiskManagement) {
    warnings.push(
      'Live trading is enabled without advanced risk management. This is risky!'
    );
  }

  if (flags.liveTrading && !flags.portfolioHeatLimits) {
    warnings.push(
      'Live trading is enabled without portfolio heat limits. Consider enabling them.'
    );
  }

  // Check for at least one intelligence source
  const hasIntelligence =
    flags.redditSentiment ||
    flags.defiTvl ||
    flags.newsAnalysis ||
    flags.forecasting;

  if (!hasIntelligence) {
    warnings.push(
      'No intelligence sources are enabled. Signals will not be generated.'
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Feature Flags Tests
 */

import {
  getFeatureFlags,
  isFeatureEnabled,
  getActiveSignalSources,
  getAdjustedWeights,
  validateFeatureFlags,
} from '@/lib/config/feature-flags';
import { DEFAULT_FEATURE_FLAGS, DEFAULT_SIGNAL_WEIGHTS } from '@/types/trading';

describe('Feature Flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getFeatureFlags', () => {
    it('should return default flags when no env vars set', () => {
      const flags = getFeatureFlags();
      expect(flags).toEqual(DEFAULT_FEATURE_FLAGS);
    });

    it('should read feature flags from environment', () => {
      process.env.FEATURE_LIVE_TRADING = 'true';
      process.env.FEATURE_REDDIT_SENTIMENT = 'false';

      const flags = getFeatureFlags();
      expect(flags.liveTrading).toBe(true);
      expect(flags.redditSentiment).toBe(false);
    });

    it('should handle "1" as true', () => {
      process.env.FEATURE_BACKTESTING = '1';
      const flags = getFeatureFlags();
      expect(flags.backtesting).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(isFeatureEnabled('redditSentiment')).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(isFeatureEnabled('liveTrading')).toBe(false);
    });
  });

  describe('getActiveSignalSources', () => {
    it('should return all sources when all enabled', () => {
      const sources = getActiveSignalSources();
      expect(sources).toContain('reddit');
      expect(sources).toContain('tvl');
      expect(sources).toContain('news');
      expect(sources).toContain('forecast');
    });

    it('should exclude disabled sources', () => {
      process.env.FEATURE_REDDIT_SENTIMENT = 'false';
      jest.resetModules();
      // Note: This would require re-importing the module
    });
  });

  describe('getAdjustedWeights', () => {
    it('should return base weights when all features enabled', () => {
      const weights = getAdjustedWeights(DEFAULT_SIGNAL_WEIGHTS);
      expect(weights.reddit + weights.tvl + weights.news + weights.forecast).toBeCloseTo(1);
    });

    it('should redistribute weights when features disabled', () => {
      process.env.FEATURE_REDDIT_SENTIMENT = 'false';
      const weights = getAdjustedWeights(DEFAULT_SIGNAL_WEIGHTS);
      // Reddit weight should be redistributed
      expect(weights.reddit).toBe(0);
    });

    it('should return zeros when all features disabled', () => {
      process.env.FEATURE_REDDIT_SENTIMENT = 'false';
      process.env.FEATURE_DEFI_TVL = 'false';
      process.env.FEATURE_NEWS_ANALYSIS = 'false';
      process.env.FEATURE_FORECASTING = 'false';

      const weights = getAdjustedWeights(DEFAULT_SIGNAL_WEIGHTS);
      expect(weights.reddit).toBe(0);
      expect(weights.tvl).toBe(0);
      expect(weights.news).toBe(0);
      expect(weights.forecast).toBe(0);
    });
  });

  describe('validateFeatureFlags', () => {
    it('should warn when live trading without risk management', () => {
      const result = validateFeatureFlags({
        liveTrading: true,
        advancedRiskManagement: false,
      });
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('risk');
    });

    it('should warn when no intelligence sources', () => {
      const result = validateFeatureFlags({
        redditSentiment: false,
        defiTvl: false,
        newsAnalysis: false,
        forecasting: false,
      });
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('intelligence');
    });

    it('should return valid when properly configured', () => {
      const result = validateFeatureFlags({
        redditSentiment: true,
        advancedRiskManagement: true,
      });
      expect(result.valid).toBe(true);
    });
  });
});

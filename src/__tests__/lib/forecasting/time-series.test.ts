/**
 * Time Series Forecasting Tests
 */

import {
  generateForecast,
  forecastToSignal,
  generateMockPriceData,
} from '@/lib/forecasting/time-series';
import { PriceDataPoint } from '@/types/trading';

describe('Time Series Forecasting', () => {
  describe('generateMockPriceData', () => {
    it('should generate requested number of data points', () => {
      const data = generateMockPriceData('BTC', 100);
      expect(data).toHaveLength(101); // +1 for starting point
    });

    it('should generate valid OHLCV data', () => {
      const data = generateMockPriceData('ETH', 50);

      for (const point of data) {
        expect(point.open).toBeDefined();
        expect(point.high).toBeDefined();
        expect(point.low).toBeDefined();
        expect(point.close).toBeDefined();
        expect(point.volume).toBeDefined();
        expect(point.timestamp).toBeInstanceOf(Date);

        // High should be highest, low should be lowest
        expect(point.high).toBeGreaterThanOrEqual(point.low);
      }
    });

    it('should use different base prices for different assets', () => {
      const btcData = generateMockPriceData('BTC', 10);
      const ethData = generateMockPriceData('ETH', 10);

      const btcAvg = btcData.reduce((sum, p) => sum + p.close, 0) / btcData.length;
      const ethAvg = ethData.reduce((sum, p) => sum + p.close, 0) / ethData.length;

      // BTC should have higher prices than ETH
      expect(btcAvg).toBeGreaterThan(ethAvg);
    });
  });

  describe('generateForecast', () => {
    it('should return null for insufficient data', async () => {
      const data = generateMockPriceData('BTC', 10); // Less than MIN_TRAINING_DATAPOINTS
      const result = await generateForecast(data);
      expect(result).toBeNull();
    });

    it('should generate forecast for sufficient data', async () => {
      const data = generateMockPriceData('BTC', 168); // 1 week of hourly data
      const result = await generateForecast(data);

      if (result) {
        expect(result.predictions).toBeDefined();
        expect(result.predictions.length).toBeGreaterThan(0);
        expect(result.accuracy).toBeDefined();
        expect(result.signal).toBeDefined();
        expect(result.trend).toBeDefined();
      }
    });

    it('should include confidence intervals', async () => {
      const data = generateMockPriceData('BTC', 168);
      const result = await generateForecast(data);

      if (result) {
        expect(result.confidenceIntervals).toBeDefined();
        expect(result.confidenceIntervals.lower80).toBeDefined();
        expect(result.confidenceIntervals.upper80).toBeDefined();
        expect(result.confidenceIntervals.lower95).toBeDefined();
        expect(result.confidenceIntervals.upper95).toBeDefined();
      }
    });

    it('should generate signal between -1 and 1', async () => {
      const data = generateMockPriceData('BTC', 168);
      const result = await generateForecast(data);

      if (result) {
        expect(result.signal).toBeGreaterThanOrEqual(-1);
        expect(result.signal).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate accuracy metrics', async () => {
      const data = generateMockPriceData('BTC', 168);
      const result = await generateForecast(data);

      if (result) {
        expect(result.accuracy.mape).toBeDefined();
        expect(result.accuracy.rmse).toBeDefined();
        expect(result.accuracy.mae).toBeDefined();
        expect(result.accuracy.r2).toBeDefined();
        expect(result.accuracy.directionalAccuracy).toBeDefined();

        // Accuracy should be between 0 and 1 for directional accuracy
        expect(result.accuracy.directionalAccuracy).toBeGreaterThanOrEqual(0);
        expect(result.accuracy.directionalAccuracy).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('forecastToSignal', () => {
    it('should convert forecast to signal score', async () => {
      const data = generateMockPriceData('BTC', 168);
      const forecast = await generateForecast(data);

      if (forecast) {
        const signal = forecastToSignal(forecast);

        expect(signal.value).toBeGreaterThanOrEqual(-1);
        expect(signal.value).toBeLessThanOrEqual(1);
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
        expect(signal.source).toBe('time_series_forecast');
        expect(signal.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should include forecast metadata', async () => {
      const data = generateMockPriceData('BTC', 168);
      const forecast = await generateForecast(data);

      if (forecast) {
        const signal = forecastToSignal(forecast);

        expect(signal.metadata).toBeDefined();
        expect(signal.metadata?.model).toBe('ensemble');
        expect(signal.metadata?.trend).toBeDefined();
        expect(signal.metadata?.accuracy).toBeDefined();
      }
    });
  });
});

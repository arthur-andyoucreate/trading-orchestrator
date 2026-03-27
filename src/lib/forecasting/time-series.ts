/**
 * Time Series Forecasting Engine
 * ARIMA and Prophet-style forecasting for price prediction
 *
 * Note: This is a TypeScript implementation that approximates ARIMA and Prophet
 * For production, consider using a Python backend with statsmodels/prophet
 */

import {
  PriceDataPoint,
  ForecastResult,
  ForecastPoint,
  ForecastAccuracy,
  ARIMAParams,
  SignalScore,
} from '@/types/trading';
import { FORECAST_CONFIG } from '@/lib/config/constants';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

/**
 * Simple moving average
 */
function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * Exponential moving average
 */
function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result.push(sum / period);

  // Calculate EMA for rest
  for (let i = period; i < data.length; i++) {
    const emaValue = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
    result.push(emaValue);
  }

  return result;
}

/**
 * Calculate differencing for stationarity
 */
function difference(data: number[], order: number = 1): number[] {
  let result = [...data];
  for (let d = 0; d < order; d++) {
    const diffed: number[] = [];
    for (let i = 1; i < result.length; i++) {
      diffed.push(result[i] - result[i - 1]);
    }
    result = diffed;
  }
  return result;
}

/**
 * Reverse differencing
 */
function undifference(diffed: number[], originalStart: number, order: number = 1): number[] {
  let result = [...diffed];
  for (let d = 0; d < order; d++) {
    const undiffed: number[] = [originalStart];
    for (let i = 0; i < result.length; i++) {
      undiffed.push(undiffed[undiffed.length - 1] + result[i]);
    }
    result = undiffed;
  }
  return result;
}

/**
 * Calculate autocorrelation
 */
function autocorrelation(data: number[], lag: number): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  let numerator = 0;
  let denominator = 0;

  for (let i = lag; i < data.length; i++) {
    numerator += (data[i] - mean) * (data[i - lag] - mean);
  }

  for (let i = 0; i < data.length; i++) {
    denominator += Math.pow(data[i] - mean, 2);
  }

  return numerator / denominator;
}

/**
 * Simple AR(p) model fitting using least squares approximation
 */
function fitAR(data: number[], p: number): number[] {
  if (data.length < p + 1) return new Array(p).fill(0);

  // Use simple approach: estimate coefficients from autocorrelation
  const coefficients: number[] = [];
  for (let i = 1; i <= p; i++) {
    coefficients.push(autocorrelation(data, i));
  }

  return coefficients;
}

/**
 * ARIMA forecast
 */
function arimaForecast(
  data: number[],
  params: ARIMAParams,
  horizonSteps: number
): { forecast: number[]; confidence: number } {
  const { p, d, q } = params;

  // Apply differencing
  const diffed = difference(data, d);

  // Fit AR model
  const arCoeffs = fitAR(diffed, p);

  // Generate forecasts
  const forecasts: number[] = [];
  let extendedData = [...diffed];

  for (let i = 0; i < horizonSteps; i++) {
    let forecast = 0;
    for (let j = 0; j < p; j++) {
      const idx = extendedData.length - 1 - j;
      if (idx >= 0) {
        forecast += arCoeffs[j] * extendedData[idx];
      }
    }
    forecasts.push(forecast);
    extendedData.push(forecast);
  }

  // Reverse differencing
  const lastValue = data[data.length - 1];
  const undiffedForecasts = undifference(forecasts, lastValue, d);

  // Calculate confidence based on autocorrelation strength
  const acf1 = Math.abs(autocorrelation(data, 1));
  const confidence = Math.min(0.9, 0.3 + acf1 * 0.6);

  return {
    forecast: undiffedForecasts.slice(1), // Skip the initial value
    confidence,
  };
}

/**
 * Prophet-style decomposition (simplified)
 * Decomposes into trend, weekly seasonality, and residuals
 */
function prophetStyleDecomposition(
  data: number[],
  timestamps: Date[]
): {
  trend: number[];
  weekly: number[];
  residuals: number[];
} {
  // Calculate trend using moving average
  const trendPeriod = Math.min(7, Math.floor(data.length / 3));
  const rawTrend = sma(data, trendPeriod);

  // Pad trend to match data length
  const trend: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < trendPeriod - 1) {
      trend.push(data[i]);
    } else {
      trend.push(rawTrend[i - trendPeriod + 1]);
    }
  }

  // Calculate detrended data
  const detrended = data.map((v, i) => v - trend[i]);

  // Estimate weekly seasonality
  const weeklyEffects = new Array(7).fill(0);
  const weekdayCounts = new Array(7).fill(0);

  for (let i = 0; i < timestamps.length; i++) {
    const dayOfWeek = timestamps[i].getDay();
    weeklyEffects[dayOfWeek] += detrended[i];
    weekdayCounts[dayOfWeek]++;
  }

  for (let i = 0; i < 7; i++) {
    weeklyEffects[i] = weekdayCounts[i] > 0 ? weeklyEffects[i] / weekdayCounts[i] : 0;
  }

  // Apply weekly seasonality
  const weekly = timestamps.map(t => weeklyEffects[t.getDay()]);

  // Calculate residuals
  const residuals = data.map((v, i) => v - trend[i] - weekly[i]);

  return { trend, weekly, residuals };
}

/**
 * Prophet-style forecast
 */
function prophetForecast(
  data: number[],
  timestamps: Date[],
  horizonSteps: number
): { forecast: number[]; confidence: number } {
  const { trend, weekly } = prophetStyleDecomposition(data, timestamps);

  // Project trend forward
  const trendSlope = (trend[trend.length - 1] - trend[trend.length - 7]) / 7;

  // Generate future timestamps
  const lastTimestamp = timestamps[timestamps.length - 1];
  const forecasts: number[] = [];

  for (let i = 1; i <= horizonSteps; i++) {
    const futureDate = new Date(lastTimestamp.getTime() + i * 3600000); // Hourly
    const projectedTrend = trend[trend.length - 1] + trendSlope * i;
    const seasonality = weekly[futureDate.getDay()];

    forecasts.push(projectedTrend + seasonality);
  }

  // Calculate confidence based on trend stability
  const trendVar = calculateVariance(trend.slice(-14));
  const dataVar = calculateVariance(data.slice(-14));
  const trendStability = 1 - Math.min(1, trendVar / (dataVar + 0.0001));
  const confidence = Math.min(0.9, 0.4 + trendStability * 0.5);

  return { forecast: forecasts, confidence };
}

/**
 * Calculate variance
 */
function calculateVariance(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(data: number[]): number {
  return Math.sqrt(calculateVariance(data));
}

/**
 * Calculate confidence intervals
 */
function calculateConfidenceIntervals(
  forecasts: number[],
  historicalStd: number
): {
  lower80: number[];
  upper80: number[];
  lower95: number[];
  upper95: number[];
} {
  const z80 = 1.28;
  const z95 = 1.96;

  const lower80: number[] = [];
  const upper80: number[] = [];
  const lower95: number[] = [];
  const upper95: number[] = [];

  for (let i = 0; i < forecasts.length; i++) {
    // Uncertainty grows with horizon
    const uncertaintyMultiplier = Math.sqrt(i + 1);
    const uncertainty = historicalStd * uncertaintyMultiplier;

    lower80.push(forecasts[i] - z80 * uncertainty);
    upper80.push(forecasts[i] + z80 * uncertainty);
    lower95.push(forecasts[i] - z95 * uncertainty);
    upper95.push(forecasts[i] + z95 * uncertainty);
  }

  return { lower80, upper80, lower95, upper95 };
}

/**
 * Calculate forecast accuracy metrics
 */
function calculateAccuracy(
  actual: number[],
  predicted: number[]
): ForecastAccuracy {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) {
    return { mape: 100, rmse: 0, mae: 0, r2: 0, directionalAccuracy: 0 };
  }

  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumAbsPercentError = 0;
  let correctDirections = 0;

  let sumActual = 0;
  let sumPredicted = 0;

  for (let i = 0; i < n; i++) {
    const error = predicted[i] - actual[i];
    sumAbsError += Math.abs(error);
    sumSquaredError += error * error;

    if (actual[i] !== 0) {
      sumAbsPercentError += Math.abs(error / actual[i]) * 100;
    }

    // Direction accuracy
    if (i > 0) {
      const actualDir = actual[i] - actual[i - 1];
      const predictedDir = predicted[i] - predicted[i - 1];
      if ((actualDir >= 0 && predictedDir >= 0) || (actualDir < 0 && predictedDir < 0)) {
        correctDirections++;
      }
    }

    sumActual += actual[i];
    sumPredicted += predicted[i];
  }

  const meanActual = sumActual / n;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssTot += Math.pow(actual[i] - meanActual, 2);
  }

  const r2 = ssTot > 0 ? 1 - (sumSquaredError / ssTot) : 0;

  return {
    mape: sumAbsPercentError / n,
    rmse: Math.sqrt(sumSquaredError / n),
    mae: sumAbsError / n,
    r2: Math.max(0, r2),
    directionalAccuracy: n > 1 ? correctDirections / (n - 1) : 0,
  };
}

/**
 * Ensemble forecast combining ARIMA and Prophet
 */
export async function generateForecast(
  priceData: PriceDataPoint[],
  horizonHours: number = FORECAST_CONFIG.FORECAST_HORIZON_HOURS
): Promise<ForecastResult | null> {
  // Check feature flag
  if (!isFeatureEnabled('forecasting')) {
    console.log('Forecasting is disabled');
    return null;
  }

  if (priceData.length < FORECAST_CONFIG.MIN_TRAINING_DATAPOINTS) {
    console.log(`Insufficient data for forecast: ${priceData.length} points`);
    return null;
  }

  try {
    // Extract close prices and timestamps
    const prices = priceData.map(p => p.close);
    const timestamps = priceData.map(p => p.timestamp);

    // Split for validation
    const splitIndex = Math.floor(prices.length * (1 - FORECAST_CONFIG.VALIDATION_SPLIT));
    const trainPrices = prices.slice(0, splitIndex);
    const trainTimestamps = timestamps.slice(0, splitIndex);
    const validPrices = prices.slice(splitIndex);

    // ARIMA forecast
    const arimaParams: ARIMAParams = {
      p: FORECAST_CONFIG.ARIMA_DEFAULT_P,
      d: FORECAST_CONFIG.ARIMA_DEFAULT_D,
      q: FORECAST_CONFIG.ARIMA_DEFAULT_Q,
    };
    const arimaResult = arimaForecast(trainPrices, arimaParams, horizonHours);

    // Prophet forecast
    const prophetResult = prophetForecast(trainPrices, trainTimestamps, horizonHours);

    // Ensemble combination
    const ensembleForecasts = arimaResult.forecast.map((arima, i) => {
      const prophet = prophetResult.forecast[i] || arima;
      return FORECAST_CONFIG.ARIMA_WEIGHT * arima + FORECAST_CONFIG.PROPHET_WEIGHT * prophet;
    });

    // Calculate historical standard deviation for confidence intervals
    const recentPrices = prices.slice(-30);
    const historicalStd = standardDeviation(recentPrices);

    // Generate confidence intervals
    const intervals = calculateConfidenceIntervals(ensembleForecasts, historicalStd);

    // Create forecast points
    const lastTimestamp = timestamps[timestamps.length - 1];
    const predictions: ForecastPoint[] = ensembleForecasts.map((predicted, i) => ({
      timestamp: new Date(lastTimestamp.getTime() + (i + 1) * 3600000),
      predicted,
      lower: intervals.lower80[i],
      upper: intervals.upper80[i],
      confidence: Math.max(0.3, arimaResult.confidence * prophetResult.confidence * (1 - i * 0.02)),
    }));

    // Validate on held-out data
    const validationForecasts = ensembleForecasts.slice(0, validPrices.length);
    const accuracy = calculateAccuracy(validPrices, validationForecasts);

    // Calculate signal from forecast
    const lastPrice = prices[prices.length - 1];
    const avgForecast = ensembleForecasts.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const expectedReturn = (avgForecast - lastPrice) / lastPrice;

    // Determine trend
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (expectedReturn > 0.02) {
      trend = 'bullish';
    } else if (expectedReturn < -0.02) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }

    // Signal: tanh of expected return (bounded -1 to 1)
    const signal = Math.tanh(expectedReturn * 20);

    // Forecast volatility
    const forecastReturns = ensembleForecasts.map((f, i) => {
      if (i === 0) return (f - lastPrice) / lastPrice;
      return (f - ensembleForecasts[i - 1]) / ensembleForecasts[i - 1];
    });
    const volatilityForecast = standardDeviation(forecastReturns);

    return {
      asset: priceData[0]?.symbol || 'UNKNOWN',
      model: 'ensemble',
      predictions,
      accuracy,
      signal,
      trend,
      volatilityForecast,
      confidenceIntervals: intervals,
    };
  } catch (error) {
    console.error('Error generating forecast:', error);
    return null;
  }
}

/**
 * Convert forecast result to signal score
 */
export function forecastToSignal(result: ForecastResult): SignalScore {
  // Combine signal with accuracy metrics
  let signalValue = result.signal;

  // Adjust based on directional accuracy
  if (result.accuracy.directionalAccuracy > 0.6) {
    signalValue *= 1.2;
  } else if (result.accuracy.directionalAccuracy < 0.4) {
    signalValue *= 0.7;
  }

  // Reduce confidence for high volatility
  let confidence = Math.min(
    1,
    (result.accuracy.directionalAccuracy + result.accuracy.r2) / 2
  );

  if (result.volatilityForecast > 0.05) {
    confidence *= 0.8;
  }

  return {
    value: Math.max(-1, Math.min(1, signalValue)),
    confidence,
    timestamp: new Date(),
    source: 'time_series_forecast',
    metadata: {
      model: result.model,
      trend: result.trend,
      accuracy: result.accuracy,
      volatilityForecast: result.volatilityForecast,
      horizonHours: result.predictions.length,
    },
  };
}

/**
 * Get price data from Hyperliquid or mock data
 * In production, this would fetch real market data
 */
export function generateMockPriceData(
  asset: string,
  dataPoints: number = 168 // 1 week of hourly data
): PriceDataPoint[] {
  const data: PriceDataPoint[] = [];
  const now = Date.now();

  // Base prices for different assets
  const basePrices: Record<string, number> = {
    'BTC': 45000,
    'ETH': 2500,
    'SOL': 100,
    'AVAX': 35,
    'ARB': 1.2,
    'OP': 2.5,
    'LINK': 15,
    'UNI': 6,
    'AAVE': 90,
    'GMX': 50,
    'DYDX': 3,
    'MKR': 1500,
  };

  const basePrice = basePrices[asset.toUpperCase()] || 100;
  let price = basePrice;

  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);

    // Random walk with slight trend
    const trend = Math.sin(i / 24) * 0.001; // Daily cycle
    const noise = (Math.random() - 0.5) * 0.02;
    const change = 1 + trend + noise;
    price *= change;

    // OHLC approximation
    const volatility = Math.abs(noise) * price;
    const open = price - volatility / 2;
    const high = price + volatility;
    const low = price - volatility;
    const close = price;
    const volume = Math.random() * 1000000;

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}

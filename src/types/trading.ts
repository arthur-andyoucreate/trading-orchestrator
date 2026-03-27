/**
 * Core Trading Type Definitions
 * Solide Intelligence Enhancement - Multi-Source Trading System
 */

// ==================== Base Types ====================

export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';
export type SignalStrength = 'STRONG' | 'MODERATE' | 'WEAK';
export type AssetType = 'crypto' | 'token' | 'defi_protocol';
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  chain?: string;
  contractAddress?: string;
}

// ==================== Signal Types ====================

export interface SignalScore {
  value: number; // -1 to 1 (bearish to bullish)
  confidence: number; // 0 to 1
  timestamp: Date;
  source: SignalSource;
  metadata?: Record<string, unknown>;
}

export type SignalSource =
  | 'reddit_sentiment'
  | 'defi_tvl'
  | 'news_analysis'
  | 'time_series_forecast'
  | 'composite';

export interface CompositeSignal {
  id: string;
  asset: Asset;
  direction: SignalDirection;
  strength: SignalStrength;
  compositeScore: number; // -1 to 1
  confidence: number; // 0 to 1
  components: {
    reddit: SignalScore | null;
    tvl: SignalScore | null;
    news: SignalScore | null;
    forecast: SignalScore | null;
  };
  weights: SignalWeights;
  suggestedAction: TradingAction;
  riskMetrics: SignalRiskMetrics;
  timestamp: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export interface SignalWeights {
  reddit: number;    // 0.25 default
  tvl: number;       // 0.25 default
  news: number;      // 0.20 default
  forecast: number;  // 0.30 default
}

export interface SignalRiskMetrics {
  volatility: number;
  correlationWithBtc: number;
  liquidityScore: number;
  maxDrawdownRisk: number;
}

export interface TradingAction {
  type: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  suggestedSize: number;
  kellyFraction: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
}

// ==================== Reddit Sentiment Types ====================

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  createdUtc: number;
  url: string;
  flair?: string;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  createdUtc: number;
  parentId: string;
}

export interface RedditSentimentResult {
  asset: string;
  overallSentiment: number; // -1 to 1
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  volumeScore: number; // Normalized mention volume
  engagementScore: number;
  topMentions: RedditMention[];
  trendDirection: 'rising' | 'falling' | 'stable';
  analyzedPosts: number;
  analyzedComments: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  confidence: number;
}

export interface RedditMention {
  postId: string;
  title: string;
  sentiment: number;
  score: number;
  timestamp: Date;
}

// ==================== DeFi TVL Types ====================

export interface TVLData {
  protocol: string;
  chain: string;
  tvl: number;
  tvlPrevDay: number;
  tvlPrevWeek: number;
  tvlPrevMonth: number;
  change24h: number;
  change7d: number;
  change30d: number;
  category: string;
  mcapTvl?: number;
  symbol?: string;
}

export interface TVLSignalResult {
  asset: string;
  currentTvl: number;
  tvlTrend: 'increasing' | 'decreasing' | 'stable';
  tvlScore: number; // -1 to 1
  momentum: number;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  relativeStrength: number;
  protocolRank: number;
  confidence: number;
  breakdown: {
    shortTermTrend: number;
    mediumTermTrend: number;
    longTermTrend: number;
    volumeChange: number;
  };
}

export interface ChainTVLData {
  chain: string;
  tvl: number;
  protocols: number;
  change24h: number;
  change7d: number;
}

// ==================== News Analysis Types ====================

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  publishedAt: string;
  urlToImage: string | null;
}

export interface NewsAnalysisResult {
  asset: string;
  overallSentiment: number; // -1 to 1
  impactScore: number; // 0 to 1
  urgency: 'breaking' | 'developing' | 'standard';
  categories: NewsCategory[];
  keyTopics: string[];
  namedEntities: NamedEntity[];
  articleCount: number;
  sourcesDiversity: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topArticles: ProcessedNewsArticle[];
  confidence: number;
}

export type NewsCategory =
  | 'regulatory'
  | 'adoption'
  | 'technical'
  | 'market'
  | 'security'
  | 'partnership'
  | 'competition'
  | 'other';

export interface NamedEntity {
  text: string;
  type: 'PERSON' | 'ORG' | 'PRODUCT' | 'LOCATION' | 'EVENT';
  sentiment: number;
  count: number;
}

export interface ProcessedNewsArticle {
  id: string;
  title: string;
  sentiment: number;
  impact: number;
  category: NewsCategory;
  source: string;
  publishedAt: Date;
  url: string;
}

// ==================== Time Series Forecasting Types ====================

export interface PriceDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ForecastResult {
  asset: string;
  model: 'arima' | 'prophet' | 'ensemble';
  predictions: ForecastPoint[];
  accuracy: ForecastAccuracy;
  signal: number; // -1 to 1
  trend: 'bullish' | 'bearish' | 'neutral';
  volatilityForecast: number;
  confidenceIntervals: {
    lower80: number[];
    upper80: number[];
    lower95: number[];
    upper95: number[];
  };
  backtestResults?: BacktestMetrics;
}

export interface ForecastPoint {
  timestamp: Date;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

export interface ForecastAccuracy {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number;  // Mean Absolute Error
  r2: number;   // R-squared
  directionalAccuracy: number; // Percentage of correct direction predictions
}

export interface ARIMAParams {
  p: number; // AR order
  d: number; // Differencing order
  q: number; // MA order
  seasonal?: {
    P: number;
    D: number;
    Q: number;
    period: number;
  };
}

export interface ProphetParams {
  changepoints?: Date[];
  seasonalityMode: 'additive' | 'multiplicative';
  yearlySeasonality: boolean;
  weeklySeasonality: boolean;
  dailySeasonality: boolean;
  holidays?: ProphetHoliday[];
}

export interface ProphetHoliday {
  name: string;
  date: Date;
  lowerWindow?: number;
  upperWindow?: number;
}

// ==================== Risk Management Types ====================

export interface Position {
  id: string;
  asset: Asset;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: Date;
  lastUpdated: Date;
}

export interface PortfolioState {
  positions: Position[];
  totalValue: number;
  availableBalance: number;
  totalMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  portfolioHeat: number; // 0 to 100
  maxDrawdown: number;
  currentDrawdown: number;
  lastUpdated: Date;
}

export interface RiskParameters {
  maxPortfolioHeat: number; // Default 30%
  maxPositionSize: number; // As % of portfolio
  maxSingleAssetExposure: number;
  maxLeverage: number;
  maxDrawdownLimit: number;
  stopLossDefault: number;
  takeProfitDefault: number;
  kellyFraction: number; // Default 0.25 (quarter Kelly)
  minWinRate: number;
  riskFreeRate: number;
}

export interface KellyResult {
  optimalFraction: number;
  adjustedFraction: number; // After applying kelly fraction multiplier
  suggestedSize: number;
  expectedReturn: number;
  maxLoss: number;
  confidence: number;
}

export interface HeatMetrics {
  currentHeat: number;
  heatByAsset: Map<string, number>;
  heatTrend: 'increasing' | 'decreasing' | 'stable';
  distanceToLimit: number;
  warningLevel: 'safe' | 'caution' | 'warning' | 'critical';
}

export interface DrawdownAnalysis {
  currentDrawdown: number;
  maxDrawdown: number;
  avgDrawdown: number;
  drawdownDuration: number; // Days
  recoveryTime: number; // Estimated days to recover
  peakValue: number;
  troughValue: number;
}

// ==================== Hyperliquid Integration Types ====================

export interface HyperliquidConfig {
  apiKey: string;
  privateKey: string;
  testnet: boolean;
  baseUrl: string;
}

export interface HyperliquidOrder {
  id: string;
  asset: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop_limit' | 'stop_market';
  size: number;
  price?: number;
  stopPrice?: number;
  reduceOnly?: boolean;
  postOnly?: boolean;
  timeInForce?: 'gtc' | 'ioc' | 'fok';
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
  filledSize: number;
  avgFillPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HyperliquidMarketData {
  asset: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  nextFundingTime: Date;
  openInterest: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
}

export interface HyperliquidAccountInfo {
  totalEquity: number;
  freeCollateral: number;
  marginRatio: number;
  positions: HyperliquidPosition[];
  openOrders: HyperliquidOrder[];
}

export interface HyperliquidPosition {
  asset: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  marginUsed: number;
}

// ==================== Backtesting Types ====================

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  assets: string[];
  signalWeights: SignalWeights;
  riskParameters: RiskParameters;
  slippage: number;
  commission: number;
  useFeatureFlags: boolean;
}

export interface BacktestMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgHoldingPeriod: number;
  calmarRatio: number;
  volatility: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  metrics: BacktestMetrics;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
  signals: CompositeSignal[];
  drawdownPeriods: DrawdownPeriod[];
}

export interface EquityPoint {
  timestamp: Date;
  equity: number;
  drawdown: number;
  positions: number;
}

export interface BacktestTrade {
  id: string;
  asset: string;
  direction: SignalDirection;
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  signal: CompositeSignal;
}

export interface DrawdownPeriod {
  startDate: Date;
  endDate: Date;
  peakValue: number;
  troughValue: number;
  drawdownPercent: number;
  recoveryDate?: Date;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    cached?: boolean;
    rateLimitRemaining?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== Dashboard Types ====================

export interface DashboardState {
  signals: CompositeSignal[];
  portfolio: PortfolioState;
  marketData: Map<string, HyperliquidMarketData>;
  alerts: Alert[];
  systemHealth: SystemHealth;
  featureFlags: FeatureFlags;
}

export interface Alert {
  id: string;
  type: 'signal' | 'risk' | 'system' | 'execution';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  lastCheck: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  lastError?: string;
  lastCheck: Date;
}

// ==================== Feature Flags ====================

export interface FeatureFlags {
  redditSentiment: boolean;
  defiTvl: boolean;
  newsAnalysis: boolean;
  forecasting: boolean;
  liveTrading: boolean;
  kellyPositionSizing: boolean;
  portfolioHeatLimits: boolean;
  advancedRiskManagement: boolean;
  realtimeUpdates: boolean;
  backtesting: boolean;
  alertSystem: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  redditSentiment: true,
  defiTvl: true,
  newsAnalysis: true,
  forecasting: true,
  liveTrading: false, // Disabled by default for safety
  kellyPositionSizing: true,
  portfolioHeatLimits: true,
  advancedRiskManagement: true,
  realtimeUpdates: true,
  backtesting: true,
  alertSystem: true,
};

export const DEFAULT_SIGNAL_WEIGHTS: SignalWeights = {
  reddit: 0.25,
  tvl: 0.25,
  news: 0.20,
  forecast: 0.30,
};

export const DEFAULT_RISK_PARAMETERS: RiskParameters = {
  maxPortfolioHeat: 30,
  maxPositionSize: 10,
  maxSingleAssetExposure: 20,
  maxLeverage: 5,
  maxDrawdownLimit: 10,
  stopLossDefault: 5,
  takeProfitDefault: 15,
  kellyFraction: 0.25,
  minWinRate: 0.55,
  riskFreeRate: 0.05,
};

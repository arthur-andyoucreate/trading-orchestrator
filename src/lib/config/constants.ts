/**
 * Application Constants
 * Centralized configuration values
 */

// ==================== API Endpoints ====================

export const API_ENDPOINTS = {
  // Reddit API
  REDDIT_BASE_URL: 'https://oauth.reddit.com',
  REDDIT_AUTH_URL: 'https://www.reddit.com/api/v1/access_token',
  REDDIT_SUBREDDITS: ['CryptoCurrency', 'Bitcoin', 'ethereum', 'defi'],

  // DeFiLlama API
  DEFILLAMA_BASE_URL: 'https://api.llama.fi',
  DEFILLAMA_TVL_ENDPOINT: '/tvl',
  DEFILLAMA_PROTOCOLS_ENDPOINT: '/protocols',
  DEFILLAMA_CHAINS_ENDPOINT: '/v2/chains',

  // News API
  NEWS_API_BASE_URL: 'https://newsapi.org/v2',
  NEWS_API_EVERYTHING_ENDPOINT: '/everything',
  NEWS_API_TOP_HEADLINES_ENDPOINT: '/top-headlines',

  // Hyperliquid API
  HYPERLIQUID_MAINNET_URL: 'https://api.hyperliquid.xyz',
  HYPERLIQUID_TESTNET_URL: 'https://api.hyperliquid-testnet.xyz',
} as const;

// ==================== Rate Limits ====================

export const RATE_LIMITS = {
  REDDIT_REQUESTS_PER_MINUTE: 60,
  REDDIT_DELAY_MS: 1000,
  DEFILLAMA_REQUESTS_PER_MINUTE: 30,
  DEFILLAMA_DELAY_MS: 2000,
  NEWS_API_REQUESTS_PER_DAY: 100, // Free tier
  NEWS_API_DELAY_MS: 1000,
  HYPERLIQUID_REQUESTS_PER_SECOND: 10,
} as const;

// ==================== Cache TTL (seconds) ====================

export const CACHE_TTL = {
  REDDIT_SENTIMENT: 300, // 5 minutes
  DEFILLAMA_TVL: 600, // 10 minutes
  NEWS_ARTICLES: 300, // 5 minutes
  FORECAST: 3600, // 1 hour
  MARKET_DATA: 10, // 10 seconds
  SIGNALS: 60, // 1 minute
  PORTFOLIO: 30, // 30 seconds
} as const;

// ==================== Signal Configuration ====================

export const SIGNAL_CONFIG = {
  // Default weights (must sum to 1)
  DEFAULT_WEIGHTS: {
    reddit: 0.25,
    tvl: 0.25,
    news: 0.20,
    forecast: 0.30,
  },

  // Signal thresholds
  STRONG_SIGNAL_THRESHOLD: 0.7,
  MODERATE_SIGNAL_THRESHOLD: 0.4,
  WEAK_SIGNAL_THRESHOLD: 0.2,

  // Confidence thresholds
  MIN_CONFIDENCE_FOR_TRADE: 0.5,
  HIGH_CONFIDENCE_THRESHOLD: 0.8,

  // Signal expiration (ms)
  SIGNAL_EXPIRATION_MS: 3600000, // 1 hour

  // Minimum data requirements
  MIN_REDDIT_POSTS: 10,
  MIN_NEWS_ARTICLES: 5,
  MIN_PRICE_DATAPOINTS: 100,
} as const;

// ==================== Risk Management ====================

export const RISK_CONFIG = {
  // Portfolio limits
  MAX_PORTFOLIO_HEAT_DEFAULT: 30, // 30% of portfolio
  MAX_POSITION_SIZE_DEFAULT: 10, // 10% of portfolio
  MAX_SINGLE_ASSET_EXPOSURE: 20, // 20% of portfolio
  MAX_LEVERAGE_DEFAULT: 5,

  // Kelly Criterion
  KELLY_FRACTION_DEFAULT: 0.25, // Quarter Kelly
  KELLY_FRACTION_MIN: 0.1,
  KELLY_FRACTION_MAX: 0.5,

  // Drawdown limits
  MAX_DRAWDOWN_LIMIT: 10, // 10%
  DRAWDOWN_WARNING_THRESHOLD: 5, // 5%
  DRAWDOWN_CRITICAL_THRESHOLD: 8, // 8%

  // Stop loss / Take profit
  DEFAULT_STOP_LOSS_PERCENT: 5,
  DEFAULT_TAKE_PROFIT_PERCENT: 15,
  TRAILING_STOP_ACTIVATION: 5, // Activate at 5% profit

  // Portfolio heat levels
  HEAT_LEVEL_SAFE: 15,
  HEAT_LEVEL_CAUTION: 25,
  HEAT_LEVEL_WARNING: 35,
  HEAT_LEVEL_CRITICAL: 45,
} as const;

// ==================== Forecasting Configuration ====================

export const FORECAST_CONFIG = {
  // ARIMA defaults
  ARIMA_DEFAULT_P: 5,
  ARIMA_DEFAULT_D: 1,
  ARIMA_DEFAULT_Q: 0,

  // Prophet settings
  PROPHET_CHANGEPOINT_PRIOR_SCALE: 0.05,
  PROPHET_SEASONALITY_PRIOR_SCALE: 10,

  // General settings
  FORECAST_HORIZON_HOURS: 24,
  MIN_TRAINING_DATAPOINTS: 100,
  VALIDATION_SPLIT: 0.2,

  // Ensemble weights
  ARIMA_WEIGHT: 0.4,
  PROPHET_WEIGHT: 0.6,
} as const;

// ==================== Sentiment Analysis ====================

export const SENTIMENT_CONFIG = {
  // Keywords for crypto sentiment
  BULLISH_KEYWORDS: [
    'moon', 'bullish', 'buy', 'long', 'pump', 'breakout', 'ath',
    'adoption', 'partnership', 'upgrade', 'launch', 'gains', 'surge',
    'rally', 'accumulate', 'hodl', 'dip', 'opportunity', 'undervalued',
  ],
  BEARISH_KEYWORDS: [
    'dump', 'bearish', 'sell', 'short', 'crash', 'scam', 'rug',
    'hack', 'exploit', 'sec', 'lawsuit', 'ban', 'regulation', 'fear',
    'ponzi', 'overvalued', 'bubble', 'dead', 'exit', 'collapse',
  ],
  NEUTRAL_KEYWORDS: [
    'hold', 'wait', 'consolidation', 'sideways', 'range', 'stable',
  ],

  // Sentiment score bounds
  SENTIMENT_MIN: -1,
  SENTIMENT_MAX: 1,

  // Engagement weights
  UPVOTE_WEIGHT: 1,
  COMMENT_WEIGHT: 2,
  AWARD_WEIGHT: 5,
} as const;

// ==================== TVL Analysis ====================

export const TVL_CONFIG = {
  // Change thresholds
  SIGNIFICANT_CHANGE_24H: 5, // 5% change is significant
  SIGNIFICANT_CHANGE_7D: 15, // 15% change is significant
  SIGNIFICANT_CHANGE_30D: 30, // 30% change is significant

  // Health score thresholds
  HEALTHY_TVL_THRESHOLD: 100000000, // $100M minimum for "healthy"
  TVL_MOMENTUM_PERIOD: 7, // Days for momentum calculation

  // Protocol categories
  DEFI_CATEGORIES: [
    'dex', 'lending', 'yield', 'derivatives', 'bridge',
    'staking', 'cdp', 'insurance', 'options', 'perpetuals',
  ],
} as const;

// ==================== News Analysis ====================

export const NEWS_CONFIG = {
  // Impact scoring
  BREAKING_NEWS_KEYWORDS: [
    'breaking', 'urgent', 'just in', 'alert', 'emergency',
  ],
  HIGH_IMPACT_SOURCES: [
    'coindesk', 'cointelegraph', 'bloomberg', 'reuters', 'wsj',
    'ft', 'cnbc', 'decrypt', 'theblock',
  ],

  // Categories for classification
  REGULATORY_KEYWORDS: [
    'sec', 'regulation', 'ban', 'legal', 'lawsuit', 'compliance',
    'cftc', 'doj', 'investigation', 'enforcement',
  ],
  ADOPTION_KEYWORDS: [
    'adoption', 'partnership', 'integration', 'launch', 'accept',
    'mainstream', 'institutional', 'enterprise',
  ],
  SECURITY_KEYWORDS: [
    'hack', 'exploit', 'vulnerability', 'breach', 'theft',
    'stolen', 'attack', 'compromised',
  ],

  // Freshness weighting
  NEWS_FRESHNESS_HOURS: 24,
  NEWS_DECAY_FACTOR: 0.1, // Score decay per hour
} as const;

// ==================== Supported Assets ====================

export const SUPPORTED_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
  { symbol: 'ARB', name: 'Arbitrum', type: 'token' },
  { symbol: 'OP', name: 'Optimism', type: 'token' },
  { symbol: 'LINK', name: 'Chainlink', type: 'token' },
  { symbol: 'UNI', name: 'Uniswap', type: 'defi_protocol' },
  { symbol: 'AAVE', name: 'Aave', type: 'defi_protocol' },
  { symbol: 'GMX', name: 'GMX', type: 'defi_protocol' },
  { symbol: 'DYDX', name: 'dYdX', type: 'defi_protocol' },
  { symbol: 'MKR', name: 'Maker', type: 'defi_protocol' },
] as const;

// ==================== Risk Management Defaults ====================

export const DEFAULT_RISK_PARAMETERS = {
  // Kelly Criterion
  KELLY_FRACTION: 0.25, // Quarter Kelly for safety
  
  // Position sizing
  MIN_POSITION_SIZE: 0.02, // 2%
  MAX_POSITION_SIZE: 0.15, // 15%
  DEFAULT_POSITION_SIZE: 0.05, // 5%
  
  // Portfolio limits
  MAX_PORTFOLIO_HEAT: 0.80, // 80% max exposure
  MAX_CORRELATED_EXPOSURE: 0.40, // 40%
  
  // Drawdown controls
  DAILY_DRAWDOWN_LIMIT: 0.03, // 3%
  WEEKLY_DRAWDOWN_LIMIT: 0.07, // 7%
  MONTHLY_DRAWDOWN_LIMIT: 0.10, // 10%
  
  // Stop loss levels
  TECHNICAL_STOP_MULTIPLIER: 2.5, // 2.5x ATR
  VOLATILITY_STOP_BASE: 0.05, // 5% base
  VOLATILITY_STOP_MAX: 0.12, // 12% max
  
  // Circuit breaker
  EMERGENCY_LIQUIDATION_THRESHOLD: 0.15, // 15%
} as const;

// ==================== Dashboard Configuration ====================

export const DASHBOARD_CONFIG = {
  // Refresh intervals (ms)
  SIGNAL_REFRESH_INTERVAL: 60000, // 1 minute
  PORTFOLIO_REFRESH_INTERVAL: 30000, // 30 seconds
  MARKET_DATA_REFRESH_INTERVAL: 10000, // 10 seconds

  // Display limits
  MAX_SIGNALS_DISPLAYED: 20,
  MAX_ALERTS_DISPLAYED: 10,
  MAX_POSITIONS_DISPLAYED: 20,

  // Chart settings
  CHART_DEFAULT_TIMEFRAME: '1h',
  CHART_DEFAULT_PERIODS: 100,
} as const;

// ==================== Error Codes ====================

export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',

  // API errors
  API_RATE_LIMITED: 'API_001',
  API_SERVICE_UNAVAILABLE: 'API_002',
  API_INVALID_RESPONSE: 'API_003',

  // Trading errors
  TRADE_INSUFFICIENT_BALANCE: 'TRADE_001',
  TRADE_INVALID_SIZE: 'TRADE_002',
  TRADE_RISK_LIMIT_EXCEEDED: 'TRADE_003',
  TRADE_EXECUTION_FAILED: 'TRADE_004',

  // Signal errors
  SIGNAL_INSUFFICIENT_DATA: 'SIGNAL_001',
  SIGNAL_EXPIRED: 'SIGNAL_002',
  SIGNAL_INVALID_WEIGHTS: 'SIGNAL_003',

  // System errors
  SYSTEM_DATABASE_ERROR: 'SYS_001',
  SYSTEM_CACHE_ERROR: 'SYS_002',
  SYSTEM_CONFIGURATION_ERROR: 'SYS_003',
} as const;

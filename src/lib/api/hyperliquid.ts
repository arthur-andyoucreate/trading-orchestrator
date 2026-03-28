/**
 * Hyperliquid API Client
 * Integration with Hyperliquid perpetuals exchange
 *
 * This preserves existing Hyperliquid integration patterns while
 * adding enhanced functionality for the intelligence layer
 */

import {
  HyperliquidConfig,
  HyperliquidOrder,
  HyperliquidMarketData,
  HyperliquidAccountInfo,
  HyperliquidPosition,
  Position,
  PortfolioState,
  Asset,
  ApiResponse,
  ApiError,
} from '@/types/trading';
import { API_ENDPOINTS, RATE_LIMITS } from '@/lib/config/constants';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

let lastRequestTime = 0;

/**
 * Rate limiter for Hyperliquid API
 */
async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const minDelay = 1000 / RATE_LIMITS.HYPERLIQUID_REQUESTS_PER_SECOND;
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Get Hyperliquid configuration from environment
 */
function getConfig(): HyperliquidConfig {
  const apiKey = process.env.HYPERLIQUID_API_KEY;
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY;
  const testnet = process.env.HYPERLIQUID_TESTNET === 'true';

  if (!apiKey || !privateKey) {
    throw new Error('Hyperliquid credentials not configured');
  }

  return {
    apiKey,
    privateKey,
    testnet,
    baseUrl: testnet
      ? API_ENDPOINTS.HYPERLIQUID_TESTNET_URL
      : API_ENDPOINTS.HYPERLIQUID_MAINNET_URL,
  };
}

/**
 * Make request to Hyperliquid API
 */
async function hyperliquidFetch<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  await rateLimitDelay();

  const config = getConfig();
  const url = `${config.baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authentication for private endpoints
  if (endpoint.includes('/private') || method === 'POST') {
    // In production, implement proper signature
    headers['X-API-KEY'] = config.apiKey;
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Hyperliquid API error: ${response.status} - ${errorData.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get market data for all assets
 */
export async function getAllMarketData(): Promise<ApiResponse<HyperliquidMarketData[]>> {
  try {
    const data = await hyperliquidFetch<{
      markets: Array<{
        name: string;
        markPx: string;
        indexPx: string;
        fundingRate: string;
        nextFundingTime: number;
        openInterest: string;
        volume24h: string;
        high24h: string;
        low24h: string;
        lastPx: string;
        bestBid: string;
        bestAsk: string;
        bestBidSz: string;
        bestAskSz: string;
      }>;
    }>('/info/meta');

    const marketData: HyperliquidMarketData[] = data.markets.map(m => ({
      asset: m.name,
      markPrice: parseFloat(m.markPx),
      indexPrice: parseFloat(m.indexPx),
      fundingRate: parseFloat(m.fundingRate),
      nextFundingTime: new Date(m.nextFundingTime),
      openInterest: parseFloat(m.openInterest),
      volume24h: parseFloat(m.volume24h),
      high24h: parseFloat(m.high24h),
      low24h: parseFloat(m.low24h),
      lastPrice: parseFloat(m.lastPx),
      bidPrice: parseFloat(m.bestBid),
      askPrice: parseFloat(m.bestAsk),
      bidSize: parseFloat(m.bestBidSz),
      askSize: parseFloat(m.bestAskSz),
    }));

    return {
      success: true,
      data: marketData,
      metadata: {
        timestamp: new Date(),
        requestId: `hl-markets-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'HYPERLIQUID_MARKET_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching market data',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get market data for a specific asset
 */
export async function getMarketData(
  asset: string
): Promise<ApiResponse<HyperliquidMarketData>> {
  const result = await getAllMarketData();

  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const marketData = result.data.find(
    m => m.asset.toUpperCase() === asset.toUpperCase()
  );

  if (!marketData) {
    return {
      success: false,
      error: {
        code: 'ASSET_NOT_FOUND',
        message: `Market data not found for ${asset}`,
      },
    };
  }

  return {
    success: true,
    data: marketData,
    metadata: {
      timestamp: new Date(),
      requestId: `hl-market-${asset}-${Date.now()}`,
    },
  };
}

/**
 * Get account information
 */
export async function getAccountInfo(
  address?: string
): Promise<ApiResponse<HyperliquidAccountInfo>> {
  try {
    const data = await hyperliquidFetch<{
      marginSummary: {
        accountValue: string;
        totalMarginUsed: string;
        totalNtlPos: string;
        withdrawable: string;
      };
      assetPositions: Array<{
        position: {
          coin: string;
          szi: string;
          entryPx: string;
          positionValue: string;
          unrealizedPnl: string;
          returnOnEquity: string;
          leverage: string;
          liquidationPx: string;
          marginUsed: string;
        };
      }>;
      openOrders: Array<{
        oid: number;
        coin: string;
        side: string;
        limitPx: string;
        sz: string;
        origSz: string;
        timestamp: number;
      }>;
    }>('/info/user', 'POST', { user: address || getConfig().apiKey });

    const positions: HyperliquidPosition[] = data.assetPositions.map(ap => ({
      asset: ap.position.coin,
      size: parseFloat(ap.position.szi),
      entryPrice: parseFloat(ap.position.entryPx),
      markPrice: 0, // Would need to fetch separately
      unrealizedPnl: parseFloat(ap.position.unrealizedPnl),
      leverage: parseFloat(ap.position.leverage) || 1,
      liquidationPrice: parseFloat(ap.position.liquidationPx),
      marginUsed: parseFloat(ap.position.marginUsed),
    }));

    const openOrders: HyperliquidOrder[] = data.openOrders.map(o => ({
      id: o.oid.toString(),
      asset: o.coin,
      side: o.side as 'buy' | 'sell',
      type: 'limit' as const,
      size: parseFloat(o.origSz),
      price: parseFloat(o.limitPx),
      status: 'open' as const,
      filledSize: parseFloat(o.origSz) - parseFloat(o.sz),
      createdAt: new Date(o.timestamp),
      updatedAt: new Date(o.timestamp),
    }));

    return {
      success: true,
      data: {
        totalEquity: parseFloat(data.marginSummary.accountValue),
        freeCollateral: parseFloat(data.marginSummary.withdrawable),
        marginRatio: parseFloat(data.marginSummary.totalMarginUsed) /
          parseFloat(data.marginSummary.accountValue),
        positions,
        openOrders,
      },
      metadata: {
        timestamp: new Date(),
        requestId: `hl-account-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'HYPERLIQUID_ACCOUNT_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching account',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Convert Hyperliquid account to portfolio state
 */
export async function getPortfolioState(): Promise<ApiResponse<PortfolioState>> {
  const accountResult = await getAccountInfo();

  if (!accountResult.success || !accountResult.data) {
    return { success: false, error: accountResult.error };
  }

  const account = accountResult.data;

  // Get market data for positions
  const marketsResult = await getAllMarketData();
  const marketsMap = new Map<string, HyperliquidMarketData>();
  if (marketsResult.success && marketsResult.data) {
    for (const m of marketsResult.data) {
      marketsMap.set(m.asset.toUpperCase(), m);
    }
  }

  // Convert positions
  const positions: Position[] = account.positions.map((p, index) => {
    const marketData = marketsMap.get(p.asset.toUpperCase());
    const currentPrice = marketData?.markPrice || p.entryPrice;
    const side = p.size >= 0 ? 'long' : 'short';
    const size = Math.abs(p.size);

    return {
      id: `pos_${p.asset}_${index}`,
      asset: {
        symbol: p.asset,
        name: p.asset,
        type: 'crypto' as const,
      },
      side,
      size,
      entryPrice: p.entryPrice,
      currentPrice,
      unrealizedPnl: p.unrealizedPnl,
      unrealizedPnlPercent: p.entryPrice > 0
        ? (p.unrealizedPnl / (size * p.entryPrice)) * 100
        : 0,
      leverage: p.leverage,
      margin: p.marginUsed,
      liquidationPrice: p.liquidationPrice,
      openedAt: new Date(), // Would need to track separately
      lastUpdated: new Date(),
    };
  });

  // Calculate portfolio metrics
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalMargin = positions.reduce((sum, p) => sum + p.margin, 0);

  const portfolioState: PortfolioState = {
    positions,
    totalValue: account.totalEquity,
    availableBalance: account.freeCollateral,
    totalMargin,
    unrealizedPnl: totalUnrealizedPnl,
    realizedPnl: 0, // Would need historical data
    portfolioHeat: (totalMargin / account.totalEquity) * 100,
    maxDrawdown: 0, // Would need historical data
    currentDrawdown: totalUnrealizedPnl < 0 ? Math.abs(totalUnrealizedPnl / account.totalEquity) * 100 : 0,
    lastUpdated: new Date(),
  };

  return {
    success: true,
    data: portfolioState,
    metadata: {
      timestamp: new Date(),
      requestId: `hl-portfolio-${Date.now()}`,
    },
  };
}

/**
 * Place a new order
 */
export async function placeOrder(
  asset: string,
  side: 'buy' | 'sell',
  size: number,
  price?: number,
  options?: {
    type?: 'limit' | 'market';
    reduceOnly?: boolean;
    postOnly?: boolean;
    stopPrice?: number;
    timeInForce?: 'gtc' | 'ioc' | 'fok';
  }
): Promise<ApiResponse<HyperliquidOrder>> {
  // Check if live trading is enabled
  if (!isFeatureEnabled('liveTrading')) {
    return {
      success: false,
      error: {
        code: 'LIVE_TRADING_DISABLED',
        message: 'Live trading is disabled. Enable FEATURE_LIVE_TRADING to execute orders.',
      },
    };
  }

  try {
    const orderType = options?.type || (price ? 'limit' : 'market');

    const orderPayload = {
      coin: asset,
      is_buy: side === 'buy',
      sz: size,
      limit_px: price,
      order_type: {
        limit: orderType === 'limit' ? {
          tif: options?.timeInForce || 'gtc',
        } : undefined,
        trigger: options?.stopPrice ? {
          trigger_px: options.stopPrice,
          tpsl: side === 'buy' ? 'sl' : 'tp',
        } : undefined,
      },
      reduce_only: options?.reduceOnly || false,
    };

    const response = await hyperliquidFetch<{
      status: string;
      response: {
        type: string;
        data: {
          statuses: Array<{
            resting?: { oid: number };
            filled?: { oid: number; totalSz: string; avgPx: string };
            error?: string;
          }>;
        };
      };
    }>('/exchange', 'POST', {
      action: {
        type: 'order',
        orders: [orderPayload],
        grouping: 'na',
      },
    });

    const status = response.response.data.statuses[0];

    if (status.error) {
      return {
        success: false,
        error: {
          code: 'ORDER_REJECTED',
          message: status.error,
        },
      };
    }

    const order: HyperliquidOrder = {
      id: (status.resting?.oid || status.filled?.oid || 0).toString(),
      asset,
      side,
      type: orderType,
      size,
      price,
      stopPrice: options?.stopPrice,
      reduceOnly: options?.reduceOnly,
      postOnly: options?.postOnly,
      timeInForce: options?.timeInForce || 'gtc',
      status: status.filled ? 'filled' : 'open',
      filledSize: status.filled ? parseFloat(status.filled.totalSz) : 0,
      avgFillPrice: status.filled ? parseFloat(status.filled.avgPx) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: order,
      metadata: {
        timestamp: new Date(),
        requestId: `hl-order-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'ORDER_PLACEMENT_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error placing order',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  asset: string,
  orderId: string
): Promise<ApiResponse<{ success: boolean }>> {
  if (!isFeatureEnabled('liveTrading')) {
    return {
      success: false,
      error: {
        code: 'LIVE_TRADING_DISABLED',
        message: 'Live trading is disabled.',
      },
    };
  }

  try {
    await hyperliquidFetch('/exchange', 'POST', {
      action: {
        type: 'cancel',
        cancels: [{ coin: asset, oid: parseInt(orderId) }],
      },
    });

    return {
      success: true,
      data: { success: true },
      metadata: {
        timestamp: new Date(),
        requestId: `hl-cancel-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'ORDER_CANCEL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error cancelling order',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Cancel all orders for an asset
 */
export async function cancelAllOrders(asset?: string): Promise<ApiResponse<number>> {
  if (!isFeatureEnabled('liveTrading')) {
    return {
      success: false,
      error: {
        code: 'LIVE_TRADING_DISABLED',
        message: 'Live trading is disabled.',
      },
    };
  }

  try {
    const accountResult = await getAccountInfo();
    if (!accountResult.success || !accountResult.data) {
      return { success: false, error: accountResult.error };
    }

    let ordersToCancel = accountResult.data.openOrders;
    if (asset) {
      ordersToCancel = ordersToCancel.filter(
        o => o.asset.toUpperCase() === asset.toUpperCase()
      );
    }

    const cancels = ordersToCancel.map(o => ({
      coin: o.asset,
      oid: parseInt(o.id),
    }));

    if (cancels.length > 0) {
      await hyperliquidFetch('/exchange', 'POST', {
        action: {
          type: 'cancel',
          cancels,
        },
      });
    }

    return {
      success: true,
      data: cancels.length,
      metadata: {
        timestamp: new Date(),
        requestId: `hl-cancel-all-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'CANCEL_ALL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get order history
 */
export async function getOrderHistory(
  limit: number = 100
): Promise<ApiResponse<HyperliquidOrder[]>> {
  try {
    const data = await hyperliquidFetch<{
      orders: Array<{
        oid: number;
        coin: string;
        side: string;
        limitPx: string;
        sz: string;
        origSz: string;
        timestamp: number;
        status: string;
        filledSz: string;
        avgPx: string;
      }>;
    }>('/info/userFills', 'POST', {
      user: getConfig().apiKey,
      limit,
    });

    const orders: HyperliquidOrder[] = data.orders.map(o => ({
      id: o.oid.toString(),
      asset: o.coin,
      side: o.side as 'buy' | 'sell',
      type: 'limit' as const,
      size: parseFloat(o.origSz),
      price: parseFloat(o.limitPx),
      status: o.status as any,
      filledSize: parseFloat(o.filledSz),
      avgFillPrice: parseFloat(o.avgPx) || undefined,
      createdAt: new Date(o.timestamp),
      updatedAt: new Date(o.timestamp),
    }));

    return {
      success: true,
      data: orders,
      metadata: {
        timestamp: new Date(),
        requestId: `hl-history-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'ORDER_HISTORY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get funding rate history
 */
export async function getFundingHistory(
  asset: string,
  days: number = 7
): Promise<ApiResponse<Array<{ timestamp: Date; rate: number }>>> {
  try {
    const data = await hyperliquidFetch<{
      funding: Array<{ time: number; fundingRate: string }>;
    }>(`/info/fundingHistory?coin=${asset}&days=${days}`);

    const history = data.funding.map(f => ({
      timestamp: new Date(f.time),
      rate: parseFloat(f.fundingRate),
    }));

    return {
      success: true,
      data: history,
      metadata: {
        timestamp: new Date(),
        requestId: `hl-funding-${asset}-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'FUNDING_HISTORY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Check if Hyperliquid connection is healthy
 */
export async function checkHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await getAllMarketData();
    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * DeFiLlama API Client
 * Fetches TVL and protocol data from DeFiLlama
 */

import {
  TVLData,
  ChainTVLData,
  ApiResponse,
  ApiError,
} from '@/types/trading';
import { API_ENDPOINTS, RATE_LIMITS } from '@/lib/config/constants';

let lastRequestTime = 0;

/**
 * Rate limiter for DeFiLlama API
 */
async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minDelay = RATE_LIMITS.DEFILLAMA_DELAY_MS;

  if (timeSinceLastRequest < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Make request to DeFiLlama API
 */
async function defiLlamaFetch<T>(endpoint: string): Promise<T> {
  await rateLimitDelay();

  const url = `${API_ENDPOINTS.DEFILLAMA_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
    next: {
      revalidate: 600, // Cache for 10 minutes
    },
  });

  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Protocol data structure from DeFiLlama API
 */
interface DeFiLlamaProtocol {
  id: string;
  name: string;
  symbol?: string;
  chain: string;
  chains: string[];
  category: string;
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  logo?: string;
}

/**
 * Fetch all protocols with TVL data
 */
export async function fetchAllProtocols(): Promise<ApiResponse<TVLData[]>> {
  try {
    const data = await defiLlamaFetch<DeFiLlamaProtocol[]>('/protocols');

    const tvlData: TVLData[] = data
      .filter(p => p.tvl > 0)
      .map(protocol => ({
        protocol: protocol.name,
        chain: protocol.chain,
        tvl: protocol.tvl,
        tvlPrevDay: protocol.change_1d
          ? protocol.tvl / (1 + (protocol.change_1d / 100))
          : protocol.tvl,
        tvlPrevWeek: protocol.change_7d
          ? protocol.tvl / (1 + (protocol.change_7d / 100))
          : protocol.tvl,
        tvlPrevMonth: protocol.tvl, // Not provided by API
        change24h: protocol.change_1d || 0,
        change7d: protocol.change_7d || 0,
        change30d: 0, // Not provided
        category: protocol.category,
        mcapTvl: protocol.mcap && protocol.tvl > 0
          ? protocol.mcap / protocol.tvl
          : undefined,
        symbol: protocol.symbol,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      success: true,
      data: tvlData,
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-protocols-${Date.now()}`,
        cached: false,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching protocols',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Fetch TVL data for a specific protocol
 */
export async function fetchProtocolTVL(
  protocol: string
): Promise<ApiResponse<{
  tvl: number;
  tvlHistory: Array<{ date: number; totalLiquidityUSD: number }>;
  chains: Record<string, number>;
}>> {
  try {
    const data = await defiLlamaFetch<{
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
      currentChainTvls: Record<string, number>;
    }>(`/protocol/${protocol.toLowerCase()}`);

    const latestTvl = data.tvl.length > 0
      ? data.tvl[data.tvl.length - 1].totalLiquidityUSD
      : 0;

    return {
      success: true,
      data: {
        tvl: latestTvl,
        tvlHistory: data.tvl,
        chains: data.currentChainTvls || {},
      },
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-protocol-${protocol}-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_PROTOCOL_ERROR',
      message: error instanceof Error ? error.message : `Unknown error fetching ${protocol}`,
    };
    return { success: false, error: apiError };
  }
}

/**
 * Fetch TVL by chain
 */
export async function fetchChainsTVL(): Promise<ApiResponse<ChainTVLData[]>> {
  try {
    const data = await defiLlamaFetch<Array<{
      gecko_id: string;
      tvl: number;
      tokenSymbol: string;
      name: string;
    }>>('/v2/chains');

    // Also fetch historical for change calculations
    const historicalData = await defiLlamaFetch<Record<string, Array<{
      date: number;
      tvl: number;
    }>>>('/v2/historicalChainTvl');

    const chainData: ChainTVLData[] = data.map(chain => {
      const history = historicalData[chain.name] || [];
      const now = history[history.length - 1]?.tvl || chain.tvl;
      const dayAgo = history[history.length - 2]?.tvl || now;
      const weekAgo = history[history.length - 8]?.tvl || now;

      return {
        chain: chain.name,
        tvl: chain.tvl,
        protocols: 0, // Not provided in this endpoint
        change24h: dayAgo > 0 ? ((now - dayAgo) / dayAgo) * 100 : 0,
        change7d: weekAgo > 0 ? ((now - weekAgo) / weekAgo) * 100 : 0,
      };
    }).sort((a, b) => b.tvl - a.tvl);

    return {
      success: true,
      data: chainData,
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-chains-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_CHAINS_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching chains',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Fetch historical TVL for a protocol
 */
export async function fetchHistoricalTVL(
  protocol: string,
  days: number = 30
): Promise<ApiResponse<Array<{ date: Date; tvl: number }>>> {
  try {
    const data = await defiLlamaFetch<{
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
    }>(`/protocol/${protocol.toLowerCase()}`);

    const cutoffTime = Date.now() / 1000 - days * 24 * 60 * 60;

    const historicalData = data.tvl
      .filter(point => point.date >= cutoffTime)
      .map(point => ({
        date: new Date(point.date * 1000),
        tvl: point.totalLiquidityUSD,
      }));

    return {
      success: true,
      data: historicalData,
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-historical-${protocol}-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_HISTORICAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching historical TVL',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Fetch TVL for DeFi protocols associated with a token symbol
 */
export async function fetchProtocolsBySymbol(
  symbol: string
): Promise<ApiResponse<TVLData[]>> {
  try {
    const result = await fetchAllProtocols();
    if (!result.success || !result.data) {
      return result;
    }

    // Filter protocols by symbol
    const matchingProtocols = result.data.filter(p =>
      p.symbol?.toLowerCase() === symbol.toLowerCase() ||
      p.protocol.toLowerCase().includes(symbol.toLowerCase())
    );

    return {
      success: true,
      data: matchingProtocols,
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-symbol-${symbol}-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_SYMBOL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get total DeFi TVL across all protocols
 */
export async function getTotalTVL(): Promise<ApiResponse<{
  total: number;
  change24h: number;
  topChains: Array<{ chain: string; tvl: number; share: number }>;
}>> {
  try {
    const chainsResult = await fetchChainsTVL();
    if (!chainsResult.success || !chainsResult.data) {
      return { success: false, error: chainsResult.error };
    }

    const total = chainsResult.data.reduce((sum, chain) => sum + chain.tvl, 0);

    // Calculate weighted average change
    const change24h = chainsResult.data.reduce((sum, chain) => {
      const weight = chain.tvl / total;
      return sum + (chain.change24h * weight);
    }, 0);

    // Top chains with market share
    const topChains = chainsResult.data.slice(0, 10).map(chain => ({
      chain: chain.chain,
      tvl: chain.tvl,
      share: (chain.tvl / total) * 100,
    }));

    return {
      success: true,
      data: {
        total,
        change24h,
        topChains,
      },
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-total-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_TOTAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get category breakdown of TVL
 */
export async function getCategoryBreakdown(): Promise<ApiResponse<
  Array<{ category: string; tvl: number; protocols: number; change24h: number }>
>> {
  try {
    const result = await fetchAllProtocols();
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const categoryMap = new Map<string, {
      tvl: number;
      protocols: number;
      change24hSum: number;
    }>();

    for (const protocol of result.data) {
      const category = protocol.category || 'Other';
      const existing = categoryMap.get(category) || {
        tvl: 0,
        protocols: 0,
        change24hSum: 0,
      };

      categoryMap.set(category, {
        tvl: existing.tvl + protocol.tvl,
        protocols: existing.protocols + 1,
        change24hSum: existing.change24hSum + protocol.change24h,
      });
    }

    const breakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        tvl: data.tvl,
        protocols: data.protocols,
        change24h: data.protocols > 0 ? data.change24hSum / data.protocols : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      success: true,
      data: breakdown,
      metadata: {
        timestamp: new Date(),
        requestId: `defillama-categories-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'DEFILLAMA_CATEGORY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

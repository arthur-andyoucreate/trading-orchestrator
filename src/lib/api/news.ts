/**
 * News API Client
 * Fetches cryptocurrency news articles from News API
 */

import {
  NewsArticle,
  ApiResponse,
  ApiError,
} from '@/types/trading';
import { API_ENDPOINTS, RATE_LIMITS } from '@/lib/config/constants';

let lastRequestTime = 0;
let requestsToday = 0;
let lastResetDate = new Date().toDateString();

/**
 * Rate limiter for News API (100 requests/day on free tier)
 */
async function rateLimitDelay(): Promise<void> {
  // Reset counter if it's a new day
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    requestsToday = 0;
    lastResetDate = today;
  }

  if (requestsToday >= RATE_LIMITS.NEWS_API_REQUESTS_PER_DAY) {
    throw new Error('News API daily rate limit exceeded');
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minDelay = RATE_LIMITS.NEWS_API_DELAY_MS;

  if (timeSinceLastRequest < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  requestsToday++;
}

/**
 * Make request to News API
 */
async function newsApiFetch<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  await rateLimitDelay();

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('News API key not configured');
  }

  const searchParams = new URLSearchParams({
    ...params,
    apiKey,
  });

  const url = `${API_ENDPOINTS.NEWS_API_BASE_URL}${endpoint}?${searchParams}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `News API error: ${response.status} - ${errorData.message || response.statusText}`
    );
  }

  return response.json();
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: {
      id: string | null;
      name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
}

/**
 * Search for cryptocurrency news
 */
export async function searchNews(
  query: string,
  options?: {
    from?: Date;
    to?: Date;
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    language?: string;
    pageSize?: number;
    page?: number;
  }
): Promise<ApiResponse<NewsArticle[]>> {
  try {
    const params: Record<string, string> = {
      q: query,
      language: options?.language || 'en',
      sortBy: options?.sortBy || 'publishedAt',
      pageSize: String(options?.pageSize || 50),
      page: String(options?.page || 1),
    };

    if (options?.from) {
      params.from = options.from.toISOString().split('T')[0];
    }
    if (options?.to) {
      params.to = options.to.toISOString().split('T')[0];
    }

    const data = await newsApiFetch<NewsApiResponse>(
      API_ENDPOINTS.NEWS_API_EVERYTHING_ENDPOINT,
      params
    );

    const articles: NewsArticle[] = data.articles.map((article, index) => ({
      id: `${article.source.name}-${article.publishedAt}-${index}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      url: article.url,
      source: article.source,
      author: article.author,
      publishedAt: article.publishedAt,
      urlToImage: article.urlToImage,
    }));

    return {
      success: true,
      data: articles,
      metadata: {
        timestamp: new Date(),
        requestId: `news-search-${Date.now()}`,
        rateLimitRemaining: RATE_LIMITS.NEWS_API_REQUESTS_PER_DAY - requestsToday,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'NEWS_API_SEARCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error searching news',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get top headlines for cryptocurrency
 */
export async function getCryptoHeadlines(
  country?: string
): Promise<ApiResponse<NewsArticle[]>> {
  try {
    const params: Record<string, string> = {
      q: 'cryptocurrency OR bitcoin OR ethereum OR crypto',
      category: 'business',
      pageSize: '50',
    };

    if (country) {
      params.country = country;
    }

    const data = await newsApiFetch<NewsApiResponse>(
      API_ENDPOINTS.NEWS_API_TOP_HEADLINES_ENDPOINT,
      params
    );

    const articles: NewsArticle[] = data.articles.map((article, index) => ({
      id: `${article.source.name}-${article.publishedAt}-${index}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      url: article.url,
      source: article.source,
      author: article.author,
      publishedAt: article.publishedAt,
      urlToImage: article.urlToImage,
    }));

    return {
      success: true,
      data: articles,
      metadata: {
        timestamp: new Date(),
        requestId: `news-headlines-${Date.now()}`,
        rateLimitRemaining: RATE_LIMITS.NEWS_API_REQUESTS_PER_DAY - requestsToday,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'NEWS_API_HEADLINES_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching headlines',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Search news for a specific cryptocurrency
 */
export async function searchAssetNews(
  asset: string,
  days: number = 1
): Promise<ApiResponse<NewsArticle[]>> {
  // Build comprehensive search query
  const assetQueries: Record<string, string> = {
    'BTC': 'bitcoin OR BTC',
    'ETH': 'ethereum OR ETH',
    'SOL': 'solana OR SOL',
    'AVAX': 'avalanche OR AVAX',
    'ARB': 'arbitrum OR ARB',
    'OP': 'optimism OR OP crypto',
    'LINK': 'chainlink OR LINK crypto',
    'UNI': 'uniswap OR UNI',
    'AAVE': 'aave',
    'GMX': 'GMX protocol OR GMX defi',
    'DYDX': 'dYdX OR dydx',
    'MKR': 'maker OR MKR OR DAI',
  };

  const query = assetQueries[asset.toUpperCase()] || `${asset} cryptocurrency`;

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return searchNews(query, {
    from: fromDate,
    sortBy: 'publishedAt',
  });
}

/**
 * Get news for multiple assets in batch
 */
export async function getMultiAssetNews(
  assets: string[],
  days: number = 1
): Promise<ApiResponse<Map<string, NewsArticle[]>>> {
  try {
    const results = new Map<string, NewsArticle[]>();

    // Build combined query to save API calls
    const query = assets.join(' OR ');
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const searchResult = await searchNews(query, {
      from: fromDate,
      sortBy: 'publishedAt',
      pageSize: 100,
    });

    if (!searchResult.success || !searchResult.data) {
      return { success: false, error: searchResult.error };
    }

    // Categorize articles by asset
    for (const asset of assets) {
      const assetArticles = searchResult.data.filter(article => {
        const text = (article.title + ' ' + article.description).toLowerCase();
        return text.includes(asset.toLowerCase());
      });
      results.set(asset, assetArticles);
    }

    return {
      success: true,
      data: results,
      metadata: {
        timestamp: new Date(),
        requestId: `news-multi-${Date.now()}`,
        rateLimitRemaining: RATE_LIMITS.NEWS_API_REQUESTS_PER_DAY - requestsToday,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'NEWS_API_MULTI_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get breaking crypto news (last 2 hours)
 */
export async function getBreakingNews(): Promise<ApiResponse<NewsArticle[]>> {
  const fromDate = new Date();
  fromDate.setHours(fromDate.getHours() - 2);

  return searchNews('cryptocurrency OR bitcoin OR ethereum', {
    from: fromDate,
    sortBy: 'publishedAt',
    pageSize: 20,
  });
}

/**
 * Get remaining API requests for today
 */
export function getRemainingRequests(): number {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    return RATE_LIMITS.NEWS_API_REQUESTS_PER_DAY;
  }
  return RATE_LIMITS.NEWS_API_REQUESTS_PER_DAY - requestsToday;
}

/**
 * Reddit API Client
 * Handles authentication and data fetching from Reddit API
 */

import {
  RedditPost,
  RedditComment,
  ApiResponse,
  ApiError,
} from '@/types/trading';
import { API_ENDPOINTS, RATE_LIMITS } from '@/lib/config/constants';

interface RedditAuthToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

let authToken: RedditAuthToken | null = null;
let lastRequestTime = 0;

/**
 * Rate limiter to respect Reddit API limits
 */
async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minDelay = RATE_LIMITS.REDDIT_DELAY_MS;

  if (timeSinceLastRequest < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Authenticate with Reddit API using client credentials
 */
async function authenticate(): Promise<RedditAuthToken> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Reddit API credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(API_ENDPOINTS.REDDIT_AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SolideIntelligence/1.0.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Reddit authentication failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // Refresh 1 min early
  };
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getAccessToken(): Promise<string> {
  if (!authToken || Date.now() >= authToken.expiresAt) {
    authToken = await authenticate();
  }
  return authToken.accessToken;
}

/**
 * Make authenticated request to Reddit API
 */
async function redditFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  await rateLimitDelay();

  const token = await getAccessToken();
  const url = `${API_ENDPOINTS.REDDIT_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'SolideIntelligence/1.0.0',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - wait and retry
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return redditFetch(endpoint, options);
    }
    throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch hot posts from a subreddit
 */
export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 100,
  after?: string
): Promise<ApiResponse<RedditPost[]>> {
  try {
    const params = new URLSearchParams({
      limit: Math.min(limit, 100).toString(),
      ...(after && { after }),
    });

    const data = await redditFetch<{
      data: {
        children: Array<{ data: Record<string, unknown> }>;
        after: string | null;
      };
    }>(`/r/${subreddit}/hot?${params}`);

    const posts: RedditPost[] = data.data.children.map(child => ({
      id: child.data.id as string,
      title: child.data.title as string,
      selftext: child.data.selftext as string || '',
      author: child.data.author as string,
      subreddit: child.data.subreddit as string,
      score: child.data.score as number,
      upvoteRatio: child.data.upvote_ratio as number,
      numComments: child.data.num_comments as number,
      createdUtc: child.data.created_utc as number,
      url: child.data.url as string,
      flair: child.data.link_flair_text as string | undefined,
    }));

    return {
      success: true,
      data: posts,
      metadata: {
        timestamp: new Date(),
        requestId: `reddit-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'REDDIT_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching Reddit posts',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Search Reddit for posts mentioning specific terms
 */
export async function searchRedditPosts(
  query: string,
  subreddit?: string,
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'day',
  limit: number = 100
): Promise<ApiResponse<RedditPost[]>> {
  try {
    const params = new URLSearchParams({
      q: query,
      sort,
      t: time,
      limit: Math.min(limit, 100).toString(),
      type: 'link',
      ...(subreddit && { restrict_sr: 'true' }),
    });

    const endpoint = subreddit
      ? `/r/${subreddit}/search?${params}`
      : `/search?${params}`;

    const data = await redditFetch<{
      data: {
        children: Array<{ data: Record<string, unknown> }>;
      };
    }>(endpoint);

    const posts: RedditPost[] = data.data.children.map(child => ({
      id: child.data.id as string,
      title: child.data.title as string,
      selftext: child.data.selftext as string || '',
      author: child.data.author as string,
      subreddit: child.data.subreddit as string,
      score: child.data.score as number,
      upvoteRatio: child.data.upvote_ratio as number,
      numComments: child.data.num_comments as number,
      createdUtc: child.data.created_utc as number,
      url: child.data.url as string,
      flair: child.data.link_flair_text as string | undefined,
    }));

    return {
      success: true,
      data: posts,
      metadata: {
        timestamp: new Date(),
        requestId: `reddit-search-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'REDDIT_SEARCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error searching Reddit',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Fetch comments for a specific post
 */
export async function fetchPostComments(
  subreddit: string,
  postId: string,
  limit: number = 100,
  sort: 'confidence' | 'top' | 'new' | 'controversial' = 'top'
): Promise<ApiResponse<RedditComment[]>> {
  try {
    const params = new URLSearchParams({
      limit: Math.min(limit, 500).toString(),
      sort,
      depth: '1', // Only top-level comments for efficiency
    });

    const data = await redditFetch<Array<{
      data: {
        children: Array<{ data: Record<string, unknown> }>;
      };
    }>>(`/r/${subreddit}/comments/${postId}?${params}`);

    // Comments are in the second element of the response array
    const commentsData = data[1]?.data?.children || [];

    const comments: RedditComment[] = commentsData
      .filter(child => child.data.body) // Filter out "more" placeholders
      .map(child => ({
        id: child.data.id as string,
        body: child.data.body as string,
        author: child.data.author as string,
        score: child.data.score as number,
        createdUtc: child.data.created_utc as number,
        parentId: child.data.parent_id as string,
      }));

    return {
      success: true,
      data: comments,
      metadata: {
        timestamp: new Date(),
        requestId: `reddit-comments-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'REDDIT_COMMENTS_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error fetching comments',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Fetch posts from multiple subreddits
 */
export async function fetchMultiSubredditPosts(
  subreddits: string[],
  limit: number = 50
): Promise<ApiResponse<RedditPost[]>> {
  try {
    const allPosts: RedditPost[] = [];

    for (const subreddit of subreddits) {
      const result = await fetchSubredditPosts(subreddit, limit);
      if (result.success && result.data) {
        allPosts.push(...result.data);
      }
    }

    // Sort by score descending
    allPosts.sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: allPosts,
      metadata: {
        timestamp: new Date(),
        requestId: `reddit-multi-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'REDDIT_MULTI_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

/**
 * Get trending topics from cryptocurrency subreddits
 */
export async function getTrendingCryptoTopics(): Promise<ApiResponse<string[]>> {
  try {
    const subreddits = API_ENDPOINTS.REDDIT_SUBREDDITS;
    const postsResult = await fetchMultiSubredditPosts(subreddits, 25);

    if (!postsResult.success || !postsResult.data) {
      return { success: false, error: postsResult.error };
    }

    // Extract common words from titles
    const wordCounts = new Map<string, number>();
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'to',
      'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'or',
      'and', 'but', 'if', 'then', 'because', 'as', 'until', 'while',
      'this', 'that', 'these', 'those', 'it', 'its', 'my', 'your',
      'his', 'her', 'their', 'our', 'i', 'we', 'you', 'they', 'just',
      'now', 'why', 'what', 'how', 'when', 'where', 'who', 'all',
      'can', 'get', 'got', 'im', 'dont', 'not', 'no', 'yes', 'so',
    ]);

    for (const post of postsResult.data) {
      const words = post.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Get top trending words
    const trending = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    return {
      success: true,
      data: trending,
      metadata: {
        timestamp: new Date(),
        requestId: `reddit-trending-${Date.now()}`,
      },
    };
  } catch (error) {
    const apiError: ApiError = {
      code: 'REDDIT_TRENDING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return { success: false, error: apiError };
  }
}

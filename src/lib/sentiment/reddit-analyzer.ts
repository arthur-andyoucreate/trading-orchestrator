/**
 * Reddit Sentiment Analyzer
 * Analyzes cryptocurrency sentiment from Reddit posts and comments
 */

import {
  RedditPost,
  RedditComment,
  RedditSentimentResult,
  RedditMention,
  SignalScore,
} from '@/types/trading';
import {
  fetchSubredditPosts,
  searchRedditPosts,
  fetchPostComments,
} from '@/lib/api/reddit';
import { SENTIMENT_CONFIG, SIGNAL_CONFIG, API_ENDPOINTS } from '@/lib/config/constants';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

interface SentimentAnalysis {
  score: number;
  positive: number;
  negative: number;
  neutral: number;
}

/**
 * Analyze sentiment of a single text
 */
function analyzeTextSentiment(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  // Check for keyword matches
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');

    if (SENTIMENT_CONFIG.BULLISH_KEYWORDS.some(kw => cleanWord.includes(kw))) {
      positiveCount++;
    } else if (SENTIMENT_CONFIG.BEARISH_KEYWORDS.some(kw => cleanWord.includes(kw))) {
      negativeCount++;
    } else if (SENTIMENT_CONFIG.NEUTRAL_KEYWORDS.some(kw => cleanWord.includes(kw))) {
      neutralCount++;
    }
  }

  const total = positiveCount + negativeCount + neutralCount;
  if (total === 0) {
    return { score: 0, positive: 0, negative: 0, neutral: 1 };
  }

  const score = (positiveCount - negativeCount) / total;

  return {
    score: Math.max(SENTIMENT_CONFIG.SENTIMENT_MIN, Math.min(SENTIMENT_CONFIG.SENTIMENT_MAX, score)),
    positive: positiveCount / total,
    negative: negativeCount / total,
    neutral: neutralCount / total,
  };
}

/**
 * Calculate engagement score for a post
 */
function calculateEngagement(post: RedditPost): number {
  const upvoteScore = post.score * SENTIMENT_CONFIG.UPVOTE_WEIGHT;
  const commentScore = post.numComments * SENTIMENT_CONFIG.COMMENT_WEIGHT;
  const ratioBoost = post.upvoteRatio > 0.8 ? 1.2 : post.upvoteRatio > 0.6 ? 1 : 0.8;

  return (upvoteScore + commentScore) * ratioBoost;
}

/**
 * Check if text mentions a specific asset
 */
function mentionsAsset(text: string, asset: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerAsset = asset.toLowerCase();

  // Direct mention
  if (lowerText.includes(lowerAsset)) return true;

  // Check for common aliases
  const aliases: Record<string, string[]> = {
    'btc': ['bitcoin', 'btc', 'sats', 'satoshi'],
    'eth': ['ethereum', 'eth', 'ether', 'vitalik'],
    'sol': ['solana', 'sol'],
    'avax': ['avalanche', 'avax'],
    'link': ['chainlink', 'link'],
    'uni': ['uniswap', 'uni'],
    'aave': ['aave', 'lend'],
    'mkr': ['maker', 'mkr', 'dai'],
    'arb': ['arbitrum', 'arb'],
    'op': ['optimism', 'op'],
  };

  const assetAliases = aliases[lowerAsset] || [lowerAsset];
  return assetAliases.some(alias =>
    new RegExp(`\\b${alias}\\b`, 'i').test(lowerText)
  );
}

/**
 * Calculate volume score based on mention frequency
 */
function calculateVolumeScore(
  posts: RedditPost[],
  asset: string,
  timeRange: { start: Date; end: Date }
): number {
  const mentioningPosts = posts.filter(p =>
    mentionsAsset(p.title + ' ' + p.selftext, asset)
  );

  const hoursDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
  const mentionsPerHour = mentioningPosts.length / Math.max(hoursDiff, 1);

  // Normalize to 0-1 scale (assuming 5+ mentions/hour is very high)
  return Math.min(1, mentionsPerHour / 5);
}

/**
 * Detect trend direction from time-series data
 */
function detectTrend(
  posts: RedditPost[],
  asset: string
): 'rising' | 'falling' | 'stable' {
  const mentioningPosts = posts.filter(p =>
    mentionsAsset(p.title + ' ' + p.selftext, asset)
  );

  if (mentioningPosts.length < 10) return 'stable';

  // Sort by time
  const sorted = [...mentioningPosts].sort((a, b) => a.createdUtc - b.createdUtc);

  // Compare first half vs second half sentiment
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const avgFirst = firstHalf.reduce((sum, p) => {
    const analysis = analyzeTextSentiment(p.title + ' ' + p.selftext);
    return sum + analysis.score;
  }, 0) / firstHalf.length;

  const avgSecond = secondHalf.reduce((sum, p) => {
    const analysis = analyzeTextSentiment(p.title + ' ' + p.selftext);
    return sum + analysis.score;
  }, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 0.1) return 'rising';
  if (diff < -0.1) return 'falling';
  return 'stable';
}

/**
 * Analyze Reddit sentiment for a specific asset
 */
export async function analyzeRedditSentiment(
  asset: string
): Promise<RedditSentimentResult | null> {
  // Check feature flag
  if (!isFeatureEnabled('redditSentiment')) {
    console.log('Reddit sentiment analysis is disabled');
    return null;
  }

  try {
    // Search for posts mentioning the asset
    const searchResult = await searchRedditPosts(
      asset,
      'CryptoCurrency',
      'relevance',
      'day',
      100
    );

    if (!searchResult.success || !searchResult.data) {
      console.error('Failed to fetch Reddit posts:', searchResult.error);
      return null;
    }

    const posts = searchResult.data;

    if (posts.length < SIGNAL_CONFIG.MIN_REDDIT_POSTS) {
      console.log(`Insufficient Reddit data for ${asset}: ${posts.length} posts`);
      // Return low confidence result
      return {
        asset,
        overallSentiment: 0,
        sentimentBreakdown: { positive: 0.33, negative: 0.33, neutral: 0.34 },
        volumeScore: 0,
        engagementScore: 0,
        topMentions: [],
        trendDirection: 'stable',
        analyzedPosts: posts.length,
        analyzedComments: 0,
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        confidence: 0.2,
      };
    }

    // Analyze all posts
    let totalSentiment = 0;
    let totalEngagement = 0;
    let positiveSum = 0;
    let negativeSum = 0;
    let neutralSum = 0;
    const topMentions: RedditMention[] = [];

    for (const post of posts) {
      const text = post.title + ' ' + post.selftext;
      const analysis = analyzeTextSentiment(text);
      const engagement = calculateEngagement(post);

      // Weight sentiment by engagement
      totalSentiment += analysis.score * engagement;
      totalEngagement += engagement;
      positiveSum += analysis.positive;
      negativeSum += analysis.negative;
      neutralSum += analysis.neutral;

      // Track top mentions
      if (mentionsAsset(text, asset)) {
        topMentions.push({
          postId: post.id,
          title: post.title.slice(0, 100),
          sentiment: analysis.score,
          score: post.score,
          timestamp: new Date(post.createdUtc * 1000),
        });
      }
    }

    // Normalize sentiment breakdown
    const totalBreakdown = positiveSum + negativeSum + neutralSum;
    const sentimentBreakdown = {
      positive: positiveSum / totalBreakdown,
      negative: negativeSum / totalBreakdown,
      neutral: neutralSum / totalBreakdown,
    };

    // Calculate overall sentiment (weighted by engagement)
    const overallSentiment = totalEngagement > 0
      ? totalSentiment / totalEngagement
      : 0;

    // Calculate time range
    const timestamps = posts.map(p => p.createdUtc * 1000);
    const timeRange = {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    };

    // Calculate volume and engagement scores
    const volumeScore = calculateVolumeScore(posts, asset, timeRange);
    const engagementScore = Math.min(1, totalEngagement / (posts.length * 1000));

    // Detect trend direction
    const trendDirection = detectTrend(posts, asset);

    // Sort top mentions by score
    topMentions.sort((a, b) => b.score - a.score);

    // Calculate confidence based on data quality
    const confidence = Math.min(
      1,
      (posts.length / SIGNAL_CONFIG.MIN_REDDIT_POSTS) * 0.5 +
      volumeScore * 0.3 +
      engagementScore * 0.2
    );

    return {
      asset,
      overallSentiment: Math.max(-1, Math.min(1, overallSentiment)),
      sentimentBreakdown,
      volumeScore,
      engagementScore,
      topMentions: topMentions.slice(0, 10),
      trendDirection,
      analyzedPosts: posts.length,
      analyzedComments: 0, // Comments not analyzed in basic version
      timeRange,
      confidence,
    };
  } catch (error) {
    console.error('Error analyzing Reddit sentiment:', error);
    return null;
  }
}

/**
 * Convert Reddit sentiment result to a signal score
 */
export function redditSentimentToSignal(
  result: RedditSentimentResult
): SignalScore {
  // Combine multiple factors for signal
  let signalValue = result.overallSentiment;

  // Boost/reduce based on trend
  if (result.trendDirection === 'rising') {
    signalValue = Math.min(1, signalValue + 0.1);
  } else if (result.trendDirection === 'falling') {
    signalValue = Math.max(-1, signalValue - 0.1);
  }

  // Factor in volume (high volume amplifies signal)
  signalValue *= (0.8 + result.volumeScore * 0.4);

  return {
    value: Math.max(-1, Math.min(1, signalValue)),
    confidence: result.confidence,
    timestamp: new Date(),
    source: 'reddit_sentiment',
    metadata: {
      analyzedPosts: result.analyzedPosts,
      volumeScore: result.volumeScore,
      engagementScore: result.engagementScore,
      trendDirection: result.trendDirection,
    },
  };
}

/**
 * Analyze multiple assets in batch
 */
export async function analyzeMultipleAssets(
  assets: string[]
): Promise<Map<string, RedditSentimentResult>> {
  const results = new Map<string, RedditSentimentResult>();

  for (const asset of assets) {
    const result = await analyzeRedditSentiment(asset);
    if (result) {
      results.set(asset, result);
    }

    // Add delay between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Get aggregated sentiment across all cryptocurrency subreddits
 */
export async function getMarketSentiment(): Promise<{
  overall: number;
  bullishRatio: number;
  bearishRatio: number;
  volume: number;
  confidence: number;
}> {
  try {
    const subreddits = API_ENDPOINTS.REDDIT_SUBREDDITS;
    let totalPosts = 0;
    let totalSentiment = 0;
    let bullishCount = 0;
    let bearishCount = 0;

    for (const subreddit of subreddits) {
      const result = await fetchSubredditPosts(subreddit, 50);
      if (!result.success || !result.data) continue;

      for (const post of result.data) {
        const analysis = analyzeTextSentiment(post.title + ' ' + post.selftext);
        totalSentiment += analysis.score;
        totalPosts++;

        if (analysis.score > 0.2) bullishCount++;
        else if (analysis.score < -0.2) bearishCount++;
      }
    }

    if (totalPosts === 0) {
      return {
        overall: 0,
        bullishRatio: 0.5,
        bearishRatio: 0.5,
        volume: 0,
        confidence: 0,
      };
    }

    return {
      overall: totalSentiment / totalPosts,
      bullishRatio: bullishCount / totalPosts,
      bearishRatio: bearishCount / totalPosts,
      volume: totalPosts,
      confidence: Math.min(1, totalPosts / 100),
    };
  } catch (error) {
    console.error('Error getting market sentiment:', error);
    return {
      overall: 0,
      bullishRatio: 0.5,
      bearishRatio: 0.5,
      volume: 0,
      confidence: 0,
    };
  }
}

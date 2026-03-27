/**
 * News Sentiment Analyzer
 * Analyzes cryptocurrency news for sentiment and impact
 */

import {
  NewsArticle,
  NewsAnalysisResult,
  NewsCategory,
  NamedEntity,
  ProcessedNewsArticle,
  SignalScore,
} from '@/types/trading';
import { searchAssetNews, getBreakingNews } from '@/lib/api/news';
import { NEWS_CONFIG, SIGNAL_CONFIG, SENTIMENT_CONFIG } from '@/lib/config/constants';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

/**
 * Analyze sentiment of news text
 */
function analyzeNewsSentiment(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  let matches = 0;

  // Check bullish keywords
  for (const keyword of SENTIMENT_CONFIG.BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      score += 1;
      matches++;
    }
  }

  // Check bearish keywords
  for (const keyword of SENTIMENT_CONFIG.BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      score -= 1;
      matches++;
    }
  }

  if (matches === 0) return 0;

  // Normalize to -1 to 1
  return Math.max(-1, Math.min(1, score / Math.max(matches, 3)));
}

/**
 * Categorize news article
 */
function categorizeNews(text: string): NewsCategory {
  const lowerText = text.toLowerCase();

  // Check each category's keywords
  if (NEWS_CONFIG.REGULATORY_KEYWORDS.some(kw => lowerText.includes(kw))) {
    return 'regulatory';
  }
  if (NEWS_CONFIG.ADOPTION_KEYWORDS.some(kw => lowerText.includes(kw))) {
    return 'adoption';
  }
  if (NEWS_CONFIG.SECURITY_KEYWORDS.some(kw => lowerText.includes(kw))) {
    return 'security';
  }

  // Check for other categories
  if (lowerText.includes('partnership') || lowerText.includes('collaborate')) {
    return 'partnership';
  }
  if (lowerText.includes('upgrade') || lowerText.includes('update') || lowerText.includes('launch')) {
    return 'technical';
  }
  if (lowerText.includes('price') || lowerText.includes('market') || lowerText.includes('trading')) {
    return 'market';
  }
  if (lowerText.includes('compete') || lowerText.includes('rival')) {
    return 'competition';
  }

  return 'other';
}

/**
 * Calculate impact score for news article
 */
function calculateImpact(article: NewsArticle): number {
  let impact = 0.5; // Base impact

  const text = (article.title + ' ' + article.description).toLowerCase();

  // Breaking news boost
  if (NEWS_CONFIG.BREAKING_NEWS_KEYWORDS.some(kw => text.includes(kw))) {
    impact += 0.3;
  }

  // High-impact source boost
  const sourceName = article.source.name.toLowerCase();
  if (NEWS_CONFIG.HIGH_IMPACT_SOURCES.some(src => sourceName.includes(src))) {
    impact += 0.2;
  }

  // Category-based impact
  const category = categorizeNews(text);
  if (category === 'regulatory' || category === 'security') {
    impact += 0.15; // These categories typically have high impact
  }

  // Freshness factor
  const publishedTime = new Date(article.publishedAt).getTime();
  const now = Date.now();
  const hoursAgo = (now - publishedTime) / (1000 * 60 * 60);

  if (hoursAgo < 1) {
    impact += 0.1; // Very fresh news
  } else if (hoursAgo > NEWS_CONFIG.NEWS_FRESHNESS_HOURS) {
    impact -= hoursAgo * NEWS_CONFIG.NEWS_DECAY_FACTOR; // Decay for old news
  }

  return Math.max(0, Math.min(1, impact));
}

/**
 * Determine urgency level
 */
function determineUrgency(
  articles: NewsArticle[]
): 'breaking' | 'developing' | 'standard' {
  const now = Date.now();

  // Check for very recent news
  const recentArticles = articles.filter(a => {
    const publishedTime = new Date(a.publishedAt).getTime();
    return (now - publishedTime) < (60 * 60 * 1000); // Last hour
  });

  if (recentArticles.length >= 5) {
    return 'breaking'; // Multiple articles in last hour
  }

  const twoHourArticles = articles.filter(a => {
    const publishedTime = new Date(a.publishedAt).getTime();
    return (now - publishedTime) < (2 * 60 * 60 * 1000);
  });

  if (twoHourArticles.length >= 3) {
    return 'developing';
  }

  return 'standard';
}

/**
 * Extract named entities from text
 */
function extractEntities(articles: NewsArticle[]): NamedEntity[] {
  const entityMap = new Map<string, { type: NamedEntity['type']; count: number; sentiment: number }>();

  // Common crypto entities
  const knownEntities: Record<string, NamedEntity['type']> = {
    'bitcoin': 'PRODUCT',
    'ethereum': 'PRODUCT',
    'sec': 'ORG',
    'cftc': 'ORG',
    'binance': 'ORG',
    'coinbase': 'ORG',
    'blackrock': 'ORG',
    'vitalik': 'PERSON',
    'satoshi': 'PERSON',
    'gary gensler': 'PERSON',
  };

  for (const article of articles) {
    const text = (article.title + ' ' + article.description).toLowerCase();
    const sentiment = analyzeNewsSentiment(text);

    for (const [entity, type] of Object.entries(knownEntities)) {
      if (text.includes(entity)) {
        const existing = entityMap.get(entity) || { type, count: 0, sentiment: 0 };
        entityMap.set(entity, {
          type,
          count: existing.count + 1,
          sentiment: existing.sentiment + sentiment,
        });
      }
    }
  }

  return Array.from(entityMap.entries())
    .map(([text, data]) => ({
      text,
      type: data.type,
      count: data.count,
      sentiment: data.count > 0 ? data.sentiment / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract key topics from articles
 */
function extractTopics(articles: NewsArticle[]): string[] {
  const wordCounts = new Map<string, number>();

  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'to',
    'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'or',
    'and', 'but', 'if', 'then', 'because', 'as', 'until', 'while',
    'this', 'that', 'these', 'those', 'it', 'its', 'says', 'said',
    'new', 'news', 'crypto', 'cryptocurrency', 'market',
  ]);

  for (const article of articles) {
    const text = (article.title + ' ' + article.description).toLowerCase();
    const words = text
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Calculate source diversity score
 */
function calculateSourceDiversity(articles: NewsArticle[]): number {
  const sources = new Set(articles.map(a => a.source.name.toLowerCase()));
  // Normalize to 0-1, assuming 10+ sources is maximum diversity
  return Math.min(1, sources.size / 10);
}

/**
 * Analyze news for a specific asset
 */
export async function analyzeNewsForAsset(
  asset: string
): Promise<NewsAnalysisResult | null> {
  // Check feature flag
  if (!isFeatureEnabled('newsAnalysis')) {
    console.log('News analysis is disabled');
    return null;
  }

  try {
    const newsResult = await searchAssetNews(asset, 1); // Last 24 hours

    if (!newsResult.success || !newsResult.data) {
      console.error('Failed to fetch news:', newsResult.error);
      return null;
    }

    const articles = newsResult.data;

    if (articles.length < SIGNAL_CONFIG.MIN_NEWS_ARTICLES) {
      // Return low confidence result
      return {
        asset,
        overallSentiment: 0,
        impactScore: 0,
        urgency: 'standard',
        categories: [],
        keyTopics: [],
        namedEntities: [],
        articleCount: articles.length,
        sourcesDiversity: 0,
        sentimentDistribution: { positive: 0.33, negative: 0.33, neutral: 0.34 },
        topArticles: [],
        confidence: 0.2,
      };
    }

    // Process each article
    const processedArticles: ProcessedNewsArticle[] = [];
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let totalSentiment = 0;
    let totalImpact = 0;
    const categories: NewsCategory[] = [];

    for (const article of articles) {
      const text = article.title + ' ' + article.description;
      const sentiment = analyzeNewsSentiment(text);
      const impact = calculateImpact(article);
      const category = categorizeNews(text);

      processedArticles.push({
        id: article.id,
        title: article.title,
        sentiment,
        impact,
        category,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        url: article.url,
      });

      totalSentiment += sentiment * impact; // Weight by impact
      totalImpact += impact;

      if (sentiment > 0.2) positiveCount++;
      else if (sentiment < -0.2) negativeCount++;
      else neutralCount++;

      if (!categories.includes(category)) {
        categories.push(category);
      }
    }

    // Calculate overall metrics
    const overallSentiment = totalImpact > 0 ? totalSentiment / totalImpact : 0;
    const avgImpact = totalImpact / articles.length;
    const urgency = determineUrgency(articles);
    const keyTopics = extractTopics(articles);
    const namedEntities = extractEntities(articles);
    const sourcesDiversity = calculateSourceDiversity(articles);

    const total = positiveCount + negativeCount + neutralCount;
    const sentimentDistribution = {
      positive: positiveCount / total,
      negative: negativeCount / total,
      neutral: neutralCount / total,
    };

    // Sort by impact and get top articles
    processedArticles.sort((a, b) => b.impact - a.impact);

    // Calculate confidence
    const confidence = Math.min(
      1,
      (articles.length / SIGNAL_CONFIG.MIN_NEWS_ARTICLES) * 0.4 +
      sourcesDiversity * 0.3 +
      avgImpact * 0.3
    );

    return {
      asset,
      overallSentiment: Math.max(-1, Math.min(1, overallSentiment)),
      impactScore: avgImpact,
      urgency,
      categories,
      keyTopics,
      namedEntities,
      articleCount: articles.length,
      sourcesDiversity,
      sentimentDistribution,
      topArticles: processedArticles.slice(0, 5),
      confidence,
    };
  } catch (error) {
    console.error('Error analyzing news:', error);
    return null;
  }
}

/**
 * Convert news analysis result to signal score
 */
export function newsToSignal(result: NewsAnalysisResult): SignalScore {
  let signalValue = result.overallSentiment;

  // Urgency amplifies signal
  if (result.urgency === 'breaking') {
    signalValue *= 1.3;
  } else if (result.urgency === 'developing') {
    signalValue *= 1.15;
  }

  // High impact amplifies signal
  signalValue *= (0.7 + result.impactScore * 0.6);

  // Regulatory or security news can have outsized impact
  if (result.categories.includes('regulatory') || result.categories.includes('security')) {
    signalValue *= 1.2;
  }

  return {
    value: Math.max(-1, Math.min(1, signalValue)),
    confidence: result.confidence,
    timestamp: new Date(),
    source: 'news_analysis',
    metadata: {
      articleCount: result.articleCount,
      urgency: result.urgency,
      impactScore: result.impactScore,
      categories: result.categories,
      keyTopics: result.keyTopics,
    },
  };
}

/**
 * Get market-wide news analysis
 */
export async function getMarketNewsAnalysis(): Promise<{
  overallSentiment: number;
  urgency: 'breaking' | 'developing' | 'standard';
  topStories: ProcessedNewsArticle[];
  dominantCategory: NewsCategory;
  confidence: number;
}> {
  try {
    const newsResult = await getBreakingNews();

    if (!newsResult.success || !newsResult.data || newsResult.data.length === 0) {
      return {
        overallSentiment: 0,
        urgency: 'standard',
        topStories: [],
        dominantCategory: 'other',
        confidence: 0,
      };
    }

    const articles = newsResult.data;
    let totalSentiment = 0;
    const categoryCount = new Map<NewsCategory, number>();
    const processedArticles: ProcessedNewsArticle[] = [];

    for (const article of articles) {
      const text = article.title + ' ' + article.description;
      const sentiment = analyzeNewsSentiment(text);
      const impact = calculateImpact(article);
      const category = categorizeNews(text);

      totalSentiment += sentiment * impact;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);

      processedArticles.push({
        id: article.id,
        title: article.title,
        sentiment,
        impact,
        category,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        url: article.url,
      });
    }

    const urgency = determineUrgency(articles);

    // Find dominant category
    let dominantCategory: NewsCategory = 'other';
    let maxCount = 0;
    for (const [cat, count] of categoryCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = cat;
      }
    }

    processedArticles.sort((a, b) => b.impact - a.impact);

    return {
      overallSentiment: totalSentiment / articles.length,
      urgency,
      topStories: processedArticles.slice(0, 5),
      dominantCategory,
      confidence: Math.min(1, articles.length / 10),
    };
  } catch (error) {
    console.error('Error getting market news:', error);
    return {
      overallSentiment: 0,
      urgency: 'standard',
      topStories: [],
      dominantCategory: 'other',
      confidence: 0,
    };
  }
}

/**
 * Analyze multiple assets in batch
 */
export async function analyzeMultipleAssetsNews(
  assets: string[]
): Promise<Map<string, NewsAnalysisResult>> {
  const results = new Map<string, NewsAnalysisResult>();

  for (const asset of assets) {
    const result = await analyzeNewsForAsset(asset);
    if (result) {
      results.set(asset, result);
    }

    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

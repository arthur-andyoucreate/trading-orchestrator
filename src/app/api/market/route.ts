/**
 * Market Data API Route
 * GET: Fetch market data from various sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllMarketData, getMarketData } from '@/lib/api/hyperliquid';
import { getTotalTVL, getCategoryBreakdown } from '@/lib/api/defillama';
import { getMarketSentiment } from '@/lib/sentiment/reddit-analyzer';
import { getMarketNewsAnalysis } from '@/lib/sentiment/news-analyzer';
import { getMarketTVLAnalysis } from '@/lib/analysis/tvl-analyzer';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'all';
    const asset = searchParams.get('asset');

    const results: Record<string, unknown> = {};

    // Hyperliquid market data
    if (source === 'all' || source === 'hyperliquid') {
      if (asset) {
        const marketResult = await getMarketData(asset);
        if (marketResult.success) {
          results.hyperliquid = marketResult.data;
        }
      } else {
        const marketResult = await getAllMarketData();
        if (marketResult.success) {
          results.hyperliquid = marketResult.data;
        }
      }
    }

    // Reddit sentiment
    if ((source === 'all' || source === 'reddit') && isFeatureEnabled('redditSentiment')) {
      try {
        const sentiment = await getMarketSentiment();
        results.reddit = sentiment;
      } catch (error) {
        console.error('Error fetching Reddit sentiment:', error);
      }
    }

    // TVL data
    if ((source === 'all' || source === 'tvl') && isFeatureEnabled('defiTvl')) {
      try {
        const [totalTvl, categories, marketAnalysis] = await Promise.all([
          getTotalTVL(),
          getCategoryBreakdown(),
          getMarketTVLAnalysis(),
        ]);

        results.tvl = {
          total: totalTvl.success ? totalTvl.data : null,
          categories: categories.success ? categories.data : null,
          analysis: marketAnalysis,
        };
      } catch (error) {
        console.error('Error fetching TVL data:', error);
      }
    }

    // News
    if ((source === 'all' || source === 'news') && isFeatureEnabled('newsAnalysis')) {
      try {
        const newsAnalysis = await getMarketNewsAnalysis();
        results.news = newsAnalysis;
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    }

    return NextResponse.json({
      data: results,
      sources: Object.keys(results),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

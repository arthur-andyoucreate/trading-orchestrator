/**
 * Portfolio API Route
 * GET: Fetch portfolio state
 * POST: Create portfolio snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioState } from '@/lib/api/hyperliquid';
import { calculatePortfolioHeat, analyzeDrawdown, generateRiskReport } from '@/lib/trading/risk-manager';
import { getServerClient } from '@/lib/supabase';
import { PortfolioState } from '@/types/trading';

export async function GET(request: NextRequest) {
  try {
    // Fetch portfolio from Hyperliquid
    const portfolioResult = await getPortfolioState();

    if (!portfolioResult.success || !portfolioResult.data) {
      // Return mock data for demo/testing
      const mockPortfolio: PortfolioState = {
        positions: [],
        totalValue: 50000,
        availableBalance: 50000,
        totalMargin: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        portfolioHeat: 0,
        maxDrawdown: 0,
        currentDrawdown: 0,
        lastUpdated: new Date(),
      };

      return NextResponse.json({
        portfolio: mockPortfolio,
        heatMetrics: {
          currentHeat: 0,
          heatByAsset: {},
          heatTrend: 'stable',
          distanceToLimit: 30,
          warningLevel: 'safe',
        },
        source: 'mock',
        timestamp: new Date().toISOString(),
      });
    }

    const portfolio = portfolioResult.data;

    // Calculate risk metrics
    const heatMetrics = calculatePortfolioHeat(
      portfolio.positions,
      portfolio.totalValue
    );

    // Get historical equity for drawdown analysis
    const supabase = getServerClient();
    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('total_value, snapshot_at')
      .order('snapshot_at', { ascending: false })
      .limit(100);

    const equityHistory = (snapshots || []).map((s: any) => ({
      timestamp: new Date(s.snapshot_at),
      equity: parseFloat(s.total_value),
    })).reverse();

    const drawdownAnalysis = analyzeDrawdown(equityHistory);

    return NextResponse.json({
      portfolio,
      heatMetrics: {
        currentHeat: heatMetrics.currentHeat,
        heatByAsset: Object.fromEntries(heatMetrics.heatByAsset),
        heatTrend: heatMetrics.heatTrend,
        distanceToLimit: heatMetrics.distanceToLimit,
        warningLevel: heatMetrics.warningLevel,
      },
      drawdownAnalysis,
      source: 'hyperliquid',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch current portfolio
    const portfolioResult = await getPortfolioState();

    if (!portfolioResult.success || !portfolioResult.data) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio state' },
        { status: 500 }
      );
    }

    const portfolio = portfolioResult.data;

    // Create snapshot
    const supabase = getServerClient();
    const { data, error } = await (supabase as any)
      .from('portfolio_snapshots')
      .insert({
        user_id: userId,
        total_value: portfolio.totalValue,
        available_balance: portfolio.availableBalance,
        total_margin: portfolio.totalMargin,
        unrealized_pnl: portfolio.unrealizedPnl,
        realized_pnl: portfolio.realizedPnl,
        portfolio_heat: portfolio.portfolioHeat,
        positions_count: portfolio.positions.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating snapshot:', error);
      return NextResponse.json(
        { error: 'Failed to create snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      snapshot: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating portfolio snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

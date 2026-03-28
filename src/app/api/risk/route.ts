/**
 * Risk Management API Route
 * GET: Get risk report
 * POST: Validate trading action
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculatePortfolioHeat,
  analyzeDrawdown,
  generateRiskReport,
  canOpenPosition,
  getPositionSizeRecommendation,
  calculateKellyFromSignal,
} from '@/lib/trading/risk-manager';
import { getPortfolioState } from '@/lib/api/hyperliquid';
import { getServerClient } from '@/lib/supabase';
import { CompositeSignal, RiskParameters, DEFAULT_RISK_PARAMETERS } from '@/types/trading';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Fetch portfolio state
    const portfolioResult = await getPortfolioState();

    if (!portfolioResult.success || !portfolioResult.data) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio state' },
        { status: 500 }
      );
    }

    const portfolio = portfolioResult.data;

    // Get historical equity data
    const supabase = getServerClient();
    let equityHistory: Array<{ timestamp: Date; equity: number }> = [];

    if (userId) {
      const { data: snapshots } = await supabase
        .from('portfolio_snapshots')
        .select('total_value, snapshot_at')
        .eq('user_id', userId)
        .order('snapshot_at', { ascending: false })
        .limit(100);

      equityHistory = (snapshots || []).map((s: any) => ({
        timestamp: new Date(s.snapshot_at),
        equity: parseFloat(s.total_value),
      })).reverse();
    }

    // Generate risk report
    const riskReport = generateRiskReport(
      portfolio,
      equityHistory,
      DEFAULT_RISK_PARAMETERS
    );

    return NextResponse.json({
      heatMetrics: {
        currentHeat: riskReport.heatMetrics.currentHeat,
        heatByAsset: Object.fromEntries(riskReport.heatMetrics.heatByAsset),
        heatTrend: riskReport.heatMetrics.heatTrend,
        distanceToLimit: riskReport.heatMetrics.distanceToLimit,
        warningLevel: riskReport.heatMetrics.warningLevel,
      },
      drawdownAnalysis: riskReport.drawdownAnalysis,
      riskScore: riskReport.riskScore,
      warnings: riskReport.warnings,
      recommendations: riskReport.recommendations,
      riskParameters: DEFAULT_RISK_PARAMETERS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating risk report:', error);
    return NextResponse.json(
      { error: 'Failed to generate risk report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, signal, proposedSize, leverage = 1, riskParams } = body;

    const riskParameters: RiskParameters = riskParams || DEFAULT_RISK_PARAMETERS;

    // Fetch portfolio state
    const portfolioResult = await getPortfolioState();

    if (!portfolioResult.success || !portfolioResult.data) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio state' },
        { status: 500 }
      );
    }

    const portfolio = portfolioResult.data;

    // Validate based on action type
    switch (action) {
      case 'validate_position': {
        const validation = canOpenPosition(
          portfolio,
          proposedSize,
          leverage,
          riskParameters
        );

        return NextResponse.json({
          allowed: validation.allowed,
          reason: validation.reason,
          portfolio: {
            totalValue: portfolio.totalValue,
            availableBalance: portfolio.availableBalance,
            currentHeat: portfolio.portfolioHeat,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'calculate_size': {
        if (!signal) {
          return NextResponse.json(
            { error: 'Signal is required for size calculation' },
            { status: 400 }
          );
        }

        const sizeRecommendation = getPositionSizeRecommendation(
          signal as CompositeSignal,
          portfolio,
          riskParameters
        );

        return NextResponse.json({
          recommendation: sizeRecommendation,
          portfolio: {
            totalValue: portfolio.totalValue,
            availableBalance: portfolio.availableBalance,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'calculate_kelly': {
        if (!signal) {
          return NextResponse.json(
            { error: 'Signal is required for Kelly calculation' },
            { status: 400 }
          );
        }

        const kellyResult = calculateKellyFromSignal(
          signal as CompositeSignal,
          portfolio.totalValue,
          riskParameters
        );

        return NextResponse.json({
          kelly: kellyResult,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in risk validation:', error);
    return NextResponse.json(
      { error: 'Failed to validate risk' },
      { status: 500 }
    );
  }
}

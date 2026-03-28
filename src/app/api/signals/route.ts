/**
 * Signals API Route
 * GET: Fetch signals, POST: Generate new signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCompositeSignal, generateMultipleSignals, summarizeSignals } from '@/lib/trading/signal-generator';
import { getServerClient } from '@/lib/supabase';
import { CompositeSignal, SignalWeights, DEFAULT_SIGNAL_WEIGHTS } from '@/types/trading';
import { SUPPORTED_ASSETS } from '@/lib/config/constants';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const asset = searchParams.get('asset');
    const direction = searchParams.get('direction');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = getServerClient();

    // Build query
    let query = supabase
      .from('signals')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (asset) {
      query = query.eq('asset_symbol', asset.toUpperCase());
    }

    if (direction) {
      query = query.eq('direction', direction.toUpperCase());
    }

    if (minConfidence > 0) {
      query = query.gte('confidence', minConfidence);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching signals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch signals' },
        { status: 500 }
      );
    }

    // Convert database rows to CompositeSignal format
    const signals: CompositeSignal[] = (data || []).map(row => ({
      id: row.id,
      asset: {
        symbol: row.asset_symbol,
        name: row.asset_name,
        type: row.asset_type as any,
      },
      direction: row.direction,
      strength: row.strength,
      compositeScore: parseFloat(row.composite_score),
      confidence: parseFloat(row.confidence),
      components: row.components as any,
      weights: row.weights as any,
      suggestedAction: row.suggested_action as any,
      riskMetrics: row.risk_metrics as any,
      timestamp: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      metadata: row.metadata as any,
    }));

    const summary = summarizeSignals(signals);

    return NextResponse.json({
      signals,
      summary,
      total: signals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in signals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assets, weights, storeResults = true } = body;

    // Use provided assets or default to all supported
    const targetAssets = assets && assets.length > 0
      ? assets
      : SUPPORTED_ASSETS.map(a => a.symbol);

    // Use provided weights or defaults
    const signalWeights: SignalWeights = weights || DEFAULT_SIGNAL_WEIGHTS;

    // Generate signals
    const signals = await generateMultipleSignals(targetAssets, signalWeights);

    // Store in database if requested
    if (storeResults && signals.length > 0) {
      const supabase = getServerClient();

      const signalRows = signals.map(signal => ({
        id: signal.id,
        asset_symbol: signal.asset.symbol,
        asset_name: signal.asset.name,
        asset_type: signal.asset.type,
        direction: signal.direction,
        strength: signal.strength,
        composite_score: signal.compositeScore,
        confidence: signal.confidence,
        components: signal.components,
        weights: signal.weights,
        suggested_action: signal.suggestedAction,
        risk_metrics: signal.riskMetrics,
        created_at: signal.timestamp.toISOString(),
        expires_at: signal.expiresAt.toISOString(),
        metadata: signal.metadata || null,
      }));

      const { error } = await supabase.from('signals').insert(signalRows);

      if (error) {
        console.error('Error storing signals:', error);
        // Continue anyway - signals were generated successfully
      }
    }

    const summary = summarizeSignals(signals);

    return NextResponse.json({
      signals,
      summary,
      generated: signals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating signals:', error);
    return NextResponse.json(
      { error: 'Failed to generate signals' },
      { status: 500 }
    );
  }
}

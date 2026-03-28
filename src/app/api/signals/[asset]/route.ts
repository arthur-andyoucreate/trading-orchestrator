/**
 * Single Asset Signal API Route
 * GET: Fetch signal for specific asset
 * POST: Generate new signal for specific asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCompositeSignal } from '@/lib/trading/signal-generator';
import { getServerClient } from '@/lib/supabase';
import { SignalWeights, DEFAULT_SIGNAL_WEIGHTS } from '@/types/trading';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ asset: string }> }
) {
  const { asset } = await params;
  try {
    const assetSymbol = asset.toUpperCase();
    const supabase = getServerClient();

    // Get latest signal for this asset
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('asset_symbol', assetSymbol)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch signal' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No signal found for this asset', asset },
        { status: 404 }
      );
    }

    const signalData = data as any;
    const signal = {
      id: signalData.id,
      asset: {
        symbol: signalData.asset_symbol,
        name: signalData.asset_name,
        type: signalData.asset_type,
      },
      direction: signalData.direction,
      strength: signalData.strength,
      compositeScore: parseFloat(signalData.composite_score),
      confidence: parseFloat(signalData.confidence),
      components: signalData.components,
      weights: signalData.weights,
      suggestedAction: signalData.suggested_action,
      riskMetrics: signalData.risk_metrics,
      timestamp: new Date(signalData.created_at),
      expiresAt: new Date(signalData.expires_at),
      metadata: signalData.metadata,
    };

    return NextResponse.json({
      signal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in signal API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ asset: string }> }
) {
  const { asset } = await params;
  try {
    const assetSymbol = asset.toUpperCase();
    const body = await request.json().catch(() => ({}));
    const { weights, storeResult = true } = body;

    const signalWeights: SignalWeights = weights || DEFAULT_SIGNAL_WEIGHTS;

    // Generate signal
    const signal = await generateCompositeSignal(assetSymbol, signalWeights);

    if (!signal) {
      return NextResponse.json(
        { error: 'Failed to generate signal for this asset', asset: assetSymbol },
        { status: 400 }
      );
    }

    // Store in database if requested
    if (storeResult) {
      const supabase = getServerClient();

      const { error } = await supabase.from('signals').insert({
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
      });

      if (error) {
        console.error('Error storing signal:', error);
      }
    }

    return NextResponse.json({
      signal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating signal:', error);
    return NextResponse.json(
      { error: 'Failed to generate signal' },
      { status: 500 }
    );
  }
}

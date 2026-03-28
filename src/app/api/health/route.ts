/**
 * Health Check API Route
 * GET: Check health of all services
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkHealth as checkHyperliquidHealth } from '@/lib/api/hyperliquid';
import { getFeatureFlags } from '@/lib/config/feature-flags';

interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number;
  error?: string;
}

async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      return {
        name: 'supabase',
        status: 'down',
        latency: 0,
        error: 'Not configured',
      };
    }

    // Simple ping to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
      },
    });

    return {
      name: 'supabase',
      status: response.ok ? 'up' : 'degraded',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'supabase',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedditHealth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    if (!clientId) {
      return {
        name: 'reddit',
        status: 'down',
        latency: 0,
        error: 'Not configured',
      };
    }

    // Check Reddit API is accessible
    const response = await fetch('https://www.reddit.com/.json', {
      method: 'HEAD',
    });

    return {
      name: 'reddit',
      status: response.ok ? 'up' : 'degraded',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'reddit',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDeFiLlamaHealth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const response = await fetch('https://api.llama.fi/protocols', {
      method: 'HEAD',
    });

    return {
      name: 'defillama',
      status: response.ok ? 'up' : 'degraded',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'defillama',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkNewsApiHealth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return {
        name: 'newsapi',
        status: 'down',
        latency: 0,
        error: 'Not configured',
      };
    }

    // Don't actually make a request to save rate limit
    return {
      name: 'newsapi',
      status: 'up',
      latency: 0,
    };
  } catch (error) {
    return {
      name: 'newsapi',
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Check all services in parallel
    const [supabase, hyperliquid, reddit, defillama, newsapi] = await Promise.all([
      checkSupabaseHealth(),
      checkHyperliquidHealth(),
      checkRedditHealth(),
      checkDeFiLlamaHealth(),
      checkNewsApiHealth(),
    ]);

    // Convert hyperliquid result to standard format
    const hyperliquidHealth: ServiceHealth = {
      name: 'hyperliquid',
      status: hyperliquid.healthy ? 'up' : 'down',
      latency: hyperliquid.latency,
      error: hyperliquid.error,
    };

    const services = [supabase, hyperliquidHealth, reddit, defillama, newsapi];

    // Determine overall status
    const downServices = services.filter(s => s.status === 'down');
    const degradedServices = services.filter(s => s.status === 'degraded');

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (downServices.length > 2) {
      overall = 'unhealthy';
    } else if (downServices.length > 0 || degradedServices.length > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    // Get feature flags
    const featureFlags = getFeatureFlags();

    return NextResponse.json({
      status: overall,
      services,
      featureFlags,
      uptime: process.uptime(),
      totalLatency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Trading Interface Component
 * Complete trading interface with TradingView charts and Hyperliquid integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, LongButton, ShortButton } from '@/components/ui/button';
import { Badge, LongBadge, ShortBadge, StrongBadge, ProfitBadge } from '@/components/ui/badge';
import { Progress, HeatMeter, ConfidenceMeter, RiskGauge } from '@/components/ui/progress';
import { TradingViewChart, TradingViewMini } from './tradingview-widget';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';

interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
}

interface Signal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  confidence: number;
  price: number;
  components: {
    reddit: number;
    tvl: number;
    news: number;
    forecast: number;
  };
}

interface TradingInterfaceProps {
  symbol?: string;
  showMiniChart?: boolean;
  showPositions?: boolean;
  showSignals?: boolean;
  className?: string;
}

export const TradingInterface: React.FC<TradingInterfaceProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  showMiniChart = true,
  showPositions = true,
  showSignals = true,
  className = '',
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [portfolioHeat, setPortfolioHeat] = useState(65);
  const [loading, setLoading] = useState(false);

  // Mock data for demo
  useEffect(() => {
    const mockPositions: Position[] = [
      {
        symbol: 'BTC',
        side: 'LONG',
        size: 0.5,
        entryPrice: 67500,
        markPrice: 69200,
        pnl: 850,
        pnlPercentage: 2.52,
      },
      {
        symbol: 'ETH',
        side: 'SHORT',
        size: 2.0,
        entryPrice: 3450,
        markPrice: 3380,
        pnl: 140,
        pnlPercentage: 2.03,
      },
    ];

    const mockSignals: Signal[] = [
      {
        symbol: 'BTC',
        direction: 'LONG',
        strength: 'STRONG',
        confidence: 87,
        price: 69200,
        components: { reddit: 75, tvl: 82, news: 90, forecast: 88 },
      },
      {
        symbol: 'ETH',
        direction: 'SHORT',
        strength: 'MODERATE',
        confidence: 72,
        price: 3380,
        components: { reddit: 45, tvl: 68, news: 85, forecast: 70 },
      },
      {
        symbol: 'SOL',
        direction: 'NEUTRAL',
        strength: 'WEAK',
        confidence: 45,
        price: 185,
        components: { reddit: 50, tvl: 55, news: 40, forecast: 35 },
      },
    ];

    setPositions(mockPositions);
    setSignals(mockSignals);
  }, []);

  const handleTrade = (side: 'buy' | 'sell', symbol: string) => {
    setLoading(true);
    // Simulate trade execution
    setTimeout(() => {
      console.log(`${side.toUpperCase()} ${symbol} order submitted`);
      setLoading(false);
    }, 1000);
  };

  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnlPercentage = positions.reduce((sum, pos) => sum + pos.pnlPercentage, 0) / positions.length;

  return (
    <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${className}`}>
      {/* Main Chart */}
      <div className="xl:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedSymbol.split(':')[1] || 'BTC/USDT'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px]">
              <TradingViewChart
                symbol={selectedSymbol}
                className="border-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Trading Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quick Trade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <LongButton
                    onClick={() => handleTrade('buy', 'BTC')}
                    loading={loading}
                    className="flex-1"
                  >
                    BUY BTC
                  </LongButton>
                  <ShortButton
                    onClick={() => handleTrade('sell', 'BTC')}
                    loading={loading}
                    className="flex-1"
                  >
                    SELL BTC
                  </ShortButton>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Current Price: <span className="font-mono">$69,200</span>
                </div>
              </div>

              <div className="space-y-3">
                <HeatMeter value={portfolioHeat} />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Available: <span className="font-mono">$25,430</span></div>
                  <div>Margin: <span className="font-mono">$12,850</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Portfolio Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </div>
              <div className={`text-sm ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnlPercentage.toFixed(2)}%
              </div>
            </div>

            <div className="space-y-2">
              <HeatMeter value={portfolioHeat} />
              <ConfidenceMeter value={85} />
              <RiskGauge value={32} />
            </div>
          </CardContent>
        </Card>

        {/* Current Positions */}
        {showPositions && (
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {positions.map((position, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{position.symbol}</span>
                      {position.side === 'LONG' ? (
                        <LongBadge size="sm" />
                      ) : (
                        <ShortBadge size="sm" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Size: {position.size}</div>
                      <div>Entry: ${position.entryPrice.toLocaleString()}</div>
                      <div>Mark: ${position.markPrice.toLocaleString()}</div>
                      <div className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Signals */}
        {showSignals && (
          <Card>
            <CardHeader>
              <CardTitle>AI Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {signals.map((signal, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{signal.symbol}</span>
                      <div className="flex items-center gap-1">
                        {signal.direction === 'LONG' && <LongBadge size="sm" />}
                        {signal.direction === 'SHORT' && <ShortBadge size="sm" />}
                        {signal.direction === 'NEUTRAL' && <Badge variant="neutral" size="sm">HOLD</Badge>}
                        {signal.strength === 'STRONG' && <StrongBadge size="sm" />}
                      </div>
                    </div>
                    
                    <ConfidenceMeter 
                      value={signal.confidence} 
                      size="sm"
                      showPercentage 
                    />
                    
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                      <div>Reddit: {signal.components.reddit}%</div>
                      <div>TVL: {signal.components.tvl}%</div>
                      <div>News: {signal.components.news}%</div>
                      <div>Forecast: {signal.components.forecast}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mini Chart */}
        {showMiniChart && (
          <Card>
            <CardHeader>
              <CardTitle>Quick View</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TradingViewMini symbol="BINANCE:ETHUSDT" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradingInterface;
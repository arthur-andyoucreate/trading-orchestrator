/**
 * Trading Dashboard Page
 * Main trading interface with TradingView charts and Hyperliquid integration
 */

import { Metadata } from 'next';
import TradingInterface from '@/components/trading/trading-interface';

export const metadata: Metadata = {
  title: 'Trading Dashboard | Trading Orchestrator',
  description: 'Professional trading interface with AI-powered signals and real-time charts',
};

export default function TradingPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Trading Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered trading with TradingView charts and Hyperliquid execution
        </p>
      </div>
      
      <TradingInterface 
        symbol="BINANCE:BTCUSDT"
        showMiniChart={true}
        showPositions={true}
        showSignals={true}
      />
    </div>
  );
}
/**
 * Enhanced Hyperliquid API Client
 * Extends the existing Hyperliquid integration with advanced features
 * for the Trading Orchestrator intelligence system
 */

import { 
  HyperliquidConfig,
  HyperliquidOrder,
  HyperliquidPosition,
  HyperliquidMarketData,
  CompositeSignal,
  RiskValidation,
  ExecutionResult,
  OrderType
} from '@/types/trading';

// Extend the existing Hyperliquid client
import * as BaseHyperliquid from './hyperliquid';

export class EnhancedHyperliquidClient {
  private baseClient: typeof BaseHyperliquid;
  private config: HyperliquidConfig;

  constructor(config: HyperliquidConfig) {
    this.config = config;
    this.baseClient = BaseHyperliquid;
  }

  /**
   * Execute trade with intelligence layer integration
   */
  async executeIntelligentOrder(
    signal: CompositeSignal,
    riskValidation: RiskValidation,
    orderParams: {
      orderType: OrderType;
      leverage?: number;
      slTrigger?: number;
      tpTrigger?: number;
      timeInForce?: 'GTC' | 'IOC' | 'FOK';
    }
  ): Promise<ExecutionResult> {
    try {
      // Validate signal confidence
      if (signal.confidence < 0.6) {
        return {
          success: false,
          error: 'Signal confidence too low for execution',
          confidence: signal.confidence
        };
      }

      // Validate risk parameters
      if (!riskValidation.isValid) {
        return {
          success: false,
          error: `Risk validation failed: ${riskValidation.reasons.join(', ')}`
        };
      }

      // Calculate optimal order size based on Kelly Criterion
      const optimalSize = this.calculateOptimalSize(signal, riskValidation);

      // Prepare order with intelligence metadata
      const order: HyperliquidOrder = {
        asset: signal.asset.symbol,
        isBuy: signal.direction === 'LONG',
        sz: optimalSize,
        limitPx: this.calculateOptimalPrice(signal, orderParams.orderType),
        orderType: orderParams.orderType,
        reduceOnly: false,
        timeInForce: orderParams.timeInForce || 'GTC',
        
        // Enhanced metadata for tracking
        metadata: {
          signalId: signal.id,
          aiGenerated: true,
          confidence: signal.confidence,
          components: signal.components,
          riskScore: riskValidation.riskScore,
          timestamp: new Date().toISOString()
        }
      };

      // Execute order via base client
      const result = await this.baseClient.placeOrder(order);

      // Add stop loss and take profit if specified
      if (result.success && (orderParams.slTrigger || orderParams.tpTrigger)) {
        await this.addConditionalOrders(
          result.orderId!,
          signal,
          orderParams.slTrigger,
          orderParams.tpTrigger
        );
      }

      return {
        success: true,
        orderId: result.orderId,
        executedPrice: result.fillPrice,
        executedSize: optimalSize,
        signal: signal,
        riskMetrics: riskValidation,
        executionTime: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error}`,
        signal: signal
      };
    }
  }

  /**
   * Get enhanced account info with risk metrics
   */
  async getEnhancedAccountInfo(): Promise<{
    account: any;
    riskMetrics: {
      portfolioHeat: number;
      marginUsage: number;
      maxDrawdown: number;
      sharpeRatio: number;
      positions: HyperliquidPosition[];
    };
  }> {
    const account = await this.baseClient.getAccountInfo();
    const positions = await this.baseClient.getPositions();
    
    const riskMetrics = this.calculateRiskMetrics(account, positions);

    return {
      account,
      riskMetrics: {
        portfolioHeat: riskMetrics.heat,
        marginUsage: riskMetrics.marginUsage,
        maxDrawdown: riskMetrics.maxDrawdown,
        sharpeRatio: riskMetrics.sharpeRatio,
        positions
      }
    };
  }

  /**
   * Monitor positions with AI-enhanced alerts
   */
  async monitorPositions(): Promise<{
    positions: HyperliquidPosition[];
    alerts: Array<{
      type: 'RISK_WARNING' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'MARGIN_CALL';
      message: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      position?: HyperliquidPosition;
    }>;
  }> {
    const positions = await this.baseClient.getPositions();
    const alerts = [];

    for (const position of positions) {
      // Check for risk warnings
      const unrealizedPnlPercent = (position.unrealizedPnl / position.marginUsed) * 100;
      
      if (unrealizedPnlPercent < -5) {
        alerts.push({
          type: 'RISK_WARNING',
          message: `${position.coin} position down ${unrealizedPnlPercent.toFixed(1)}%`,
          severity: unrealizedPnlPercent < -10 ? 'HIGH' : 'MEDIUM',
          position
        });
      }

      // Check margin levels
      if (position.marginUsed / position.maxLeverage > 0.8) {
        alerts.push({
          type: 'MARGIN_CALL',
          message: `${position.coin} approaching margin limit`,
          severity: 'CRITICAL',
          position
        });
      }

      // Check for stop loss triggers
      if (this.shouldTriggerStopLoss(position)) {
        alerts.push({
          type: 'STOP_LOSS',
          message: `${position.coin} stop loss triggered`,
          severity: 'HIGH',
          position
        });
      }
    }

    return { positions, alerts };
  }

  /**
   * Get real-time market data with AI analysis
   */
  async getMarketDataWithAnalysis(asset: string): Promise<{
    marketData: HyperliquidMarketData;
    analysis: {
      volatility: number;
      trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
      support: number;
      resistance: number;
      recommendedLeverage: number;
    };
  }> {
    const marketData = await this.baseClient.getMarketData(asset);
    
    // Calculate technical analysis
    const analysis = {
      volatility: this.calculateVolatility(marketData.priceHistory),
      trend: this.determineTrend(marketData.priceHistory),
      support: this.findSupport(marketData.priceHistory),
      resistance: this.findResistance(marketData.priceHistory),
      recommendedLeverage: this.calculateRecommendedLeverage(marketData)
    };

    return { marketData, analysis };
  }

  /**
   * Execute batch orders with intelligent sizing
   */
  async executeBatchOrders(
    signals: CompositeSignal[],
    maxPortfolioHeat: number = 0.8
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    let currentHeat = 0;

    // Sort signals by confidence (highest first)
    const sortedSignals = signals.sort((a, b) => b.confidence - a.confidence);

    for (const signal of sortedSignals) {
      // Check if we can still add this position
      const estimatedHeat = this.estimatePositionHeat(signal);
      
      if (currentHeat + estimatedHeat > maxPortfolioHeat) {
        results.push({
          success: false,
          error: 'Portfolio heat limit exceeded',
          signal
        });
        continue;
      }

      // Validate and execute
      const riskValidation = await this.validateRisk(signal);
      const result = await this.executeIntelligentOrder(signal, riskValidation, {
        orderType: 'market' as OrderType,
        timeInForce: 'IOC'
      });

      results.push(result);
      
      if (result.success) {
        currentHeat += estimatedHeat;
      }
    }

    return results;
  }

  // Private helper methods
  private calculateOptimalSize(signal: CompositeSignal, riskValidation: RiskValidation): number {
    // Implement Kelly Criterion sizing
    const kellyFraction = riskValidation.kellyFraction * 0.25; // Quarter Kelly for safety
    const maxSize = riskValidation.maxPositionSize;
    const confidenceAdjustment = signal.confidence;
    
    return Math.min(kellyFraction * confidenceAdjustment, maxSize);
  }

  private calculateOptimalPrice(signal: CompositeSignal, orderType: OrderType): number {
    // For market orders, use current price
    if (orderType === 'market') {
      return 0; // Market price
    }

    // For limit orders, calculate optimal entry based on signal strength
    const currentPrice = signal.riskMetrics?.currentPrice || 0;
    const spread = currentPrice * 0.001; // 0.1% spread assumption
    
    return signal.direction === 'LONG' 
      ? currentPrice - spread 
      : currentPrice + spread;
  }

  private async addConditionalOrders(
    orderId: string,
    signal: CompositeSignal,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<void> {
    // Implementation for adding stop loss and take profit orders
    // This would use Hyperliquid's conditional order API
  }

  private calculateRiskMetrics(account: any, positions: HyperliquidPosition[]): any {
    // Calculate portfolio risk metrics
    const totalValue = account.marginSummary.accountValue;
    const totalMargin = account.marginSummary.totalMarginUsed;
    
    return {
      heat: (totalMargin / totalValue) * 100,
      marginUsage: totalMargin / account.marginSummary.totalRawUsd,
      maxDrawdown: 0, // Calculate from position history
      sharpeRatio: 0  // Calculate from returns
    };
  }

  private shouldTriggerStopLoss(position: HyperliquidPosition): boolean {
    // Implement stop loss logic
    return position.unrealizedPnl < -(position.marginUsed * 0.05); // 5% stop loss
  }

  private calculateVolatility(priceHistory: number[]): number {
    // Calculate 24h volatility
    const returns = priceHistory.slice(1).map((price, i) => 
      Math.log(price / priceHistory[i])
    );
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365); // Annualized volatility
  }

  private determineTrend(priceHistory: number[]): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    if (priceHistory.length < 20) return 'SIDEWAYS';
    
    const recent = priceHistory.slice(-20);
    const older = priceHistory.slice(-40, -20);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.02) return 'BULLISH';
    if (change < -0.02) return 'BEARISH';
    return 'SIDEWAYS';
  }

  private findSupport(priceHistory: number[]): number {
    // Simple support calculation - lowest price in recent history
    return Math.min(...priceHistory.slice(-50));
  }

  private findResistance(priceHistory: number[]): number {
    // Simple resistance calculation - highest price in recent history
    return Math.max(...priceHistory.slice(-50));
  }

  private calculateRecommendedLeverage(marketData: HyperliquidMarketData): number {
    // Base leverage on volatility - higher vol = lower leverage
    const volatility = this.calculateVolatility(marketData.priceHistory);
    
    if (volatility > 0.5) return 2;  // High vol
    if (volatility > 0.3) return 3;  // Medium vol  
    if (volatility > 0.2) return 5;  // Low vol
    return 10; // Very low vol
  }

  private estimatePositionHeat(signal: CompositeSignal): number {
    // Estimate how much portfolio heat this position would add
    return signal.suggestedAction?.positionSize || 0.05; // 5% default
  }

  private async validateRisk(signal: CompositeSignal): Promise<RiskValidation> {
    // Implementation would call the risk manager
    return {
      isValid: true,
      riskScore: 0.3,
      kellyFraction: 0.1,
      maxPositionSize: 0.15,
      reasons: []
    };
  }
}

// Export singleton instance
export const hyperliquidClient = new EnhancedHyperliquidClient({
  apiKey: process.env.HYPERLIQUID_API_KEY!,
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY!,
  testnet: process.env.HYPERLIQUID_TESTNET === 'true'
});

export default EnhancedHyperliquidClient;
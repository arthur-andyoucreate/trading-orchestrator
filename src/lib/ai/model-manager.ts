/**
 * AI Model Manager
 * Orchestrates multiple model providers with intelligent routing,
 * load balancing, fallbacks, and cost optimization
 */

import {
  BaseAIProvider,
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  MistralProvider,
  KimiProvider,
  QwenProvider,
  LocalProvider,
  AIRequest,
  AIResponse,
  ModelProvider,
} from './model-provider-abstraction';

export interface ModelConfig {
  providers: {
    openai?: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      priority: number;
    };
    anthropic?: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      priority: number;
    };
    google?: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      priority: number;
    };
    mistral?: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      priority: number;
    };
    kimi?: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      priority: number;
    };
    qwen?: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      priority: number;
    };
    local?: {
      baseUrl: string;
      models: string[];
      priority: number;
    };
  };
  routing: {
    strategy: 'cost' | 'performance' | 'balanced' | 'custom';
    maxRetries: number;
    timeoutMs: number;
    fallbackOrder: string[];
  };
  usage: {
    trackCosts: boolean;
    budgetLimits: {
      daily?: number;
      monthly?: number;
      perRequest?: number;
    };
  };
}

export interface ModelUsage {
  providerId: string;
  model: string;
  requests: number;
  tokens: {
    input: number;
    output: number;
  };
  cost: number;
  latency: number[];
  errors: number;
  timestamp: Date;
}

export class ModelManager {
  private providers: Map<string, BaseAIProvider> = new Map();
  private usage: ModelUsage[] = [];
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // OpenAI
    if (this.config.providers.openai) {
      const provider = new OpenAIProvider(
        this.config.providers.openai.apiKey,
        this.config.providers.openai.baseUrl
      );
      this.providers.set('openai', provider);
    }

    // Anthropic
    if (this.config.providers.anthropic) {
      const provider = new AnthropicProvider(
        this.config.providers.anthropic.apiKey,
        this.config.providers.anthropic.baseUrl
      );
      this.providers.set('anthropic', provider);
    }

    // Google
    if (this.config.providers.google) {
      const provider = new GoogleProvider(
        this.config.providers.google.apiKey,
        this.config.providers.google.baseUrl
      );
      this.providers.set('google', provider);
    }

    // Mistral
    if (this.config.providers.mistral) {
      const provider = new MistralProvider(
        this.config.providers.mistral.apiKey,
        this.config.providers.mistral.baseUrl
      );
      this.providers.set('mistral', provider);
    }

    // Kimi (Moonshot)
    if (this.config.providers.kimi) {
      const provider = new KimiProvider(
        this.config.providers.kimi.apiKey,
        this.config.providers.kimi.baseUrl
      );
      this.providers.set('kimi', provider);
    }

    // Qwen (Alibaba)
    if (this.config.providers.qwen) {
      const provider = new QwenProvider(
        this.config.providers.qwen.apiKey,
        this.config.providers.qwen.baseUrl
      );
      this.providers.set('qwen', provider);
    }

    // Local
    if (this.config.providers.local) {
      const provider = new LocalProvider(
        this.config.providers.local.baseUrl
      );
      this.providers.set('local', provider);
    }
  }

  /**
   * Intelligent model routing based on request requirements
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Select best provider based on strategy
    const providerId = await this.selectProvider(request);
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not available`);
    }

    // Check budget limits
    if (!this.checkBudgetLimits(provider, request)) {
      throw new Error('Budget limit exceeded');
    }

    try {
      // Execute request with retry logic
      const response = await this.executeWithRetry(provider, request);
      
      // Track usage
      this.trackUsage(providerId, request, response, Date.now() - startTime);
      
      return response;
    } catch (error) {
      // Try fallback providers
      return this.executeWithFallback(request, [providerId]);
    }
  }

  /**
   * Select optimal provider based on routing strategy
   */
  private async selectProvider(request: AIRequest): Promise<string> {
    const availableProviders = await this.getAvailableProviders();
    
    switch (this.config.routing.strategy) {
      case 'cost':
        return this.selectByCost(availableProviders, request);
      
      case 'performance':
        return this.selectByPerformance(availableProviders);
      
      case 'balanced':
        return this.selectBalanced(availableProviders, request);
      
      case 'custom':
        return this.selectCustom(availableProviders, request);
      
      default:
        return availableProviders[0] || 'openai';
    }
  }

  private async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const [id, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(id);
      }
    }

    // Sort by priority
    return available.sort((a, b) => {
      const priorityA = this.getProviderPriority(a);
      const priorityB = this.getProviderPriority(b);
      return priorityB - priorityA; // Higher priority first
    });
  }

  private getProviderPriority(providerId: string): number {
    const providerConfig = this.config.providers[providerId as keyof typeof this.config.providers];
    return (providerConfig as any)?.priority || 0;
  }

  private selectByCost(providers: string[], request: AIRequest): string {
    return providers.reduce((cheapest, current) => {
      const cheapestProvider = this.providers.get(cheapest);
      const currentProvider = this.providers.get(current);
      
      if (!cheapestProvider || !currentProvider) return cheapest;
      
      const cheapestCost = cheapestProvider.estimateCost(request);
      const currentCost = currentProvider.estimateCost(request);
      
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  private selectByPerformance(providers: string[]): string {
    // Select provider with best average latency
    const providerStats = this.getProviderStats();
    
    return providers.reduce((fastest, current) => {
      const fastestLatency = providerStats[fastest]?.avgLatency || Infinity;
      const currentLatency = providerStats[current]?.avgLatency || Infinity;
      
      return currentLatency < fastestLatency ? current : fastest;
    });
  }

  private selectBalanced(providers: string[], request: AIRequest): string {
    // Balanced approach: cost + performance + reliability
    const providerStats = this.getProviderStats();
    
    return providers.reduce((best, current) => {
      const bestProvider = this.providers.get(best);
      const currentProvider = this.providers.get(current);
      
      if (!bestProvider || !currentProvider) return best;
      
      const bestScore = this.calculateBalancedScore(best, bestProvider, request, providerStats);
      const currentScore = this.calculateBalancedScore(current, currentProvider, request, providerStats);
      
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateBalancedScore(
    providerId: string,
    provider: BaseAIProvider,
    request: AIRequest,
    stats: Record<string, any>
  ): number {
    const cost = provider.estimateCost(request);
    const latency = stats[providerId]?.avgLatency || 1000;
    const reliability = stats[providerId]?.successRate || 0.5;
    
    // Normalize and weight factors (lower cost/latency = better)
    const costScore = 1 / (cost + 0.001); // Avoid division by zero
    const latencyScore = 1 / (latency + 1);
    const reliabilityScore = reliability;
    
    return (costScore * 0.3) + (latencyScore * 0.3) + (reliabilityScore * 0.4);
  }

  private selectCustom(providers: string[], request: AIRequest): string {
    // Custom logic based on request characteristics
    
    // For function calling, prefer OpenAI/Anthropic/Mistral
    if (request.functions && request.functions.length > 0) {
      const functionProviders = providers.filter(p => 
        ['openai', 'anthropic', 'mistral', 'kimi', 'qwen'].includes(p)
      );
      if (functionProviders.length > 0) {
        return functionProviders[0];
      }
    }

    // For embeddings, prefer OpenAI/Google/Mistral/Qwen
    if (request.messages.length === 1 && request.messages[0].content.length < 100) {
      const embeddingProviders = providers.filter(p => 
        ['openai', 'google', 'mistral', 'qwen'].includes(p)
      );
      if (embeddingProviders.length > 0) {
        return embeddingProviders[0];
      }
    }

    // For long context, prefer Kimi (200k) > Anthropic (200k) > Google (128k)
    const totalTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0
    );
    if (totalTokens > 50000) {
      const longContextProviders = providers.filter(p => 
        ['kimi', 'anthropic', 'google'].includes(p)
      );
      if (longContextProviders.length > 0) {
        return longContextProviders[0];
      }
    }

    // For cost-sensitive tasks, prefer Qwen/Local
    if (totalTokens > 20000) {
      const costEffectiveProviders = providers.filter(p => 
        ['qwen', 'local', 'kimi'].includes(p)
      );
      if (costEffectiveProviders.length > 0) {
        return costEffectiveProviders[0];
      }
    }

    // Default to first available
    return providers[0];
  }

  private async executeWithRetry(
    provider: BaseAIProvider,
    request: AIRequest,
    retryCount = 0
  ): Promise<AIResponse> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.config.routing.timeoutMs);
      });

      const requestPromise = provider.chat(request);
      
      return await Promise.race([requestPromise, timeoutPromise]);
    } catch (error) {
      if (retryCount < this.config.routing.maxRetries) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.executeWithRetry(provider, request, retryCount + 1);
      }
      throw error;
    }
  }

  private async executeWithFallback(
    request: AIRequest,
    triedProviders: string[] = []
  ): Promise<AIResponse> {
    const fallbackOrder = this.config.routing.fallbackOrder.filter(
      p => !triedProviders.includes(p) && this.providers.has(p)
    );

    if (fallbackOrder.length === 0) {
      throw new Error('No fallback providers available');
    }

    const providerId = fallbackOrder[0];
    const provider = this.providers.get(providerId)!;

    try {
      const response = await this.executeWithRetry(provider, request);
      this.trackUsage(providerId, request, response, 0);
      return response;
    } catch (error) {
      return this.executeWithFallback(request, [...triedProviders, providerId]);
    }
  }

  private checkBudgetLimits(provider: BaseAIProvider, request: AIRequest): boolean {
    if (!this.config.usage.trackCosts) return true;

    const estimatedCost = provider.estimateCost(request);
    const limits = this.config.usage.budgetLimits;

    if (limits.perRequest && estimatedCost > limits.perRequest) {
      return false;
    }

    if (limits.daily) {
      const todayUsage = this.getTodayUsage();
      if (todayUsage.cost + estimatedCost > limits.daily) {
        return false;
      }
    }

    if (limits.monthly) {
      const monthlyUsage = this.getMonthlyUsage();
      if (monthlyUsage.cost + estimatedCost > limits.monthly) {
        return false;
      }
    }

    return true;
  }

  private trackUsage(
    providerId: string,
    request: AIRequest,
    response: AIResponse,
    latency: number
  ): void {
    if (!this.config.usage.trackCosts) return;

    this.usage.push({
      providerId,
      model: request.model || 'default',
      requests: 1,
      tokens: {
        input: response.usage?.inputTokens || 0,
        output: response.usage?.outputTokens || 0,
      },
      cost: response.usage?.cost || 0,
      latency: [latency],
      errors: 0,
      timestamp: new Date(),
    });

    // Keep only last 10000 entries
    if (this.usage.length > 10000) {
      this.usage = this.usage.slice(-10000);
    }
  }

  private getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const usage of this.usage) {
      if (!stats[usage.providerId]) {
        stats[usage.providerId] = {
          requests: 0,
          totalLatency: 0,
          errors: 0,
        };
      }

      const providerStats = stats[usage.providerId];
      providerStats.requests += usage.requests;
      providerStats.totalLatency += usage.latency.reduce((sum, lat) => sum + lat, 0);
      providerStats.errors += usage.errors;
    }

    // Calculate averages
    for (const providerId in stats) {
      const providerStats = stats[providerId];
      providerStats.avgLatency = providerStats.totalLatency / providerStats.requests;
      providerStats.successRate = 1 - (providerStats.errors / providerStats.requests);
    }

    return stats;
  }

  private getTodayUsage(): { cost: number; requests: number } {
    const today = new Date().toDateString();
    return this.usage
      .filter(u => u.timestamp.toDateString() === today)
      .reduce((total, usage) => ({
        cost: total.cost + usage.cost,
        requests: total.requests + usage.requests,
      }), { cost: 0, requests: 0 });
  }

  private getMonthlyUsage(): { cost: number; requests: number } {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    return this.usage
      .filter(u => 
        u.timestamp.getMonth() === thisMonth && 
        u.timestamp.getFullYear() === thisYear
      )
      .reduce((total, usage) => ({
        cost: total.cost + usage.cost,
        requests: total.requests + usage.requests,
      }), { cost: 0, requests: 0 });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  
  async getAvailableModels(): Promise<ModelProvider[]> {
    const providers: ModelProvider[] = [];
    
    for (const [id, provider] of this.providers) {
      if (await provider.isAvailable()) {
        providers.push({
          id: provider.id,
          name: provider.name,
          type: provider.id as any,
          capabilities: provider.capabilities,
          pricing: {
            inputTokenPrice: 0.001, // Placeholder
            outputTokenPrice: 0.002,
            currency: 'USD',
          },
          available: true,
        });
      }
    }

    return providers;
  }

  getUsageStats(): {
    total: { cost: number; requests: number; tokens: number };
    byProvider: Record<string, { cost: number; requests: number; tokens: number }>;
    today: { cost: number; requests: number };
    thisMonth: { cost: number; requests: number };
  } {
    const total = this.usage.reduce((acc, usage) => ({
      cost: acc.cost + usage.cost,
      requests: acc.requests + usage.requests,
      tokens: acc.tokens + usage.tokens.input + usage.tokens.output,
    }), { cost: 0, requests: 0, tokens: 0 });

    const byProvider: Record<string, any> = {};
    this.usage.forEach(usage => {
      if (!byProvider[usage.providerId]) {
        byProvider[usage.providerId] = { cost: 0, requests: 0, tokens: 0 };
      }
      byProvider[usage.providerId].cost += usage.cost;
      byProvider[usage.providerId].requests += usage.requests;
      byProvider[usage.providerId].tokens += usage.tokens.input + usage.tokens.output;
    });

    return {
      total,
      byProvider,
      today: this.getTodayUsage(),
      thisMonth: this.getMonthlyUsage(),
    };
  }
}
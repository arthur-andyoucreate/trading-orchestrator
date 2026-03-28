/**
 * Agent Orchestrator
 * Multi-Agent system with provider-agnostic AI models
 * Supports OpenAI, Anthropic, Google, Local models
 */

import { ModelManager, ModelConfig } from './model-manager';
import { AIRequest, AIResponse, AIMessage } from './model-provider-abstraction';

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  capabilities: string[];
  memory: AgentMemory;
  tools: AgentTool[];
  config: AgentConfig;
}

export interface AgentConfig {
  modelProvider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  costLimit?: number;
}

export interface AgentMemory {
  shortTerm: AIMessage[];
  longTerm: Record<string, any>;
  working: Record<string, any>;
  maxContextSize: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>) => Promise<any>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: 'chat' | 'analysis' | 'decision' | 'execution';
  input: any;
  priority: number;
  deadline?: Date;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  agentId: string;
  taskId: string;
  success: boolean;
  output: any;
  reasoning?: string;
  confidence?: number;
  cost?: number;
  latency?: number;
  usedTools?: string[];
}

export class AgentOrchestrator {
  private modelManager: ModelManager;
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private isRunning = false;

  constructor(modelConfig: ModelConfig) {
    this.modelManager = new ModelManager(modelConfig);
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    // Market Intelligence Agent
    this.createAgent({
      id: 'market-intelligence',
      name: 'Market Intelligence Agent',
      role: 'data_analyst',
      systemPrompt: `You are a market intelligence agent specializing in crypto market analysis.
      Your role is to gather, analyze, and synthesize market data from multiple sources including:
      - Social sentiment (Reddit, Twitter, Discord)
      - DeFi TVL changes and flows
      - Breaking news and regulatory updates
      - Technical indicators and price movements
      
      Provide clear, actionable insights with confidence levels and reasoning.`,
      capabilities: [
        'sentiment_analysis',
        'data_synthesis',
        'trend_identification',
        'anomaly_detection'
      ],
      tools: [
        {
          name: 'analyze_social_sentiment',
          description: 'Analyze social media sentiment for a given asset',
          parameters: {
            asset: { type: 'string', description: 'Asset symbol (e.g., BTC, ETH)' },
            sources: { type: 'array', description: 'Social media sources to analyze' },
            timeframe: { type: 'string', description: 'Time period to analyze' }
          },
          execute: async (args) => this.executeSentimentAnalysis(args)
        },
        {
          name: 'monitor_defi_tvl',
          description: 'Monitor DeFi TVL changes and flows',
          parameters: {
            protocols: { type: 'array', description: 'DeFi protocols to monitor' },
            chains: { type: 'array', description: 'Blockchain networks' },
            threshold: { type: 'number', description: 'Significance threshold' }
          },
          execute: async (args) => this.executeDefiTvlMonitoring(args)
        }
      ],
      config: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 2000,
        costLimit: 0.10
      }
    });

    // Risk Management Agent
    this.createAgent({
      id: 'risk-manager',
      name: 'Risk Management Agent',
      role: 'risk_analyst',
      systemPrompt: `You are an expert risk management agent for trading operations.
      Your responsibilities include:
      - Portfolio risk assessment and monitoring
      - Position sizing recommendations using Kelly Criterion
      - Drawdown analysis and prevention
      - Risk limit enforcement
      - Emergency risk protocols
      
      Always prioritize capital preservation and provide clear risk metrics.`,
      capabilities: [
        'risk_assessment',
        'position_sizing',
        'portfolio_analysis',
        'drawdown_control',
        'emergency_protocols'
      ],
      tools: [
        {
          name: 'calculate_position_size',
          description: 'Calculate optimal position size using Kelly Criterion',
          parameters: {
            signal: { type: 'object', description: 'Trading signal with confidence' },
            portfolio: { type: 'object', description: 'Current portfolio state' },
            asset: { type: 'string', description: 'Asset to trade' }
          },
          execute: async (args) => this.executePositionSizing(args)
        },
        {
          name: 'assess_portfolio_risk',
          description: 'Comprehensive portfolio risk assessment',
          parameters: {
            positions: { type: 'array', description: 'Current positions' },
            market_data: { type: 'object', description: 'Current market conditions' }
          },
          execute: async (args) => this.executeRiskAssessment(args)
        }
      ],
      config: {
        model: 'claude-3-sonnet-20240229',
        temperature: 0.1,
        maxTokens: 1500,
        costLimit: 0.05
      }
    });

    // Signal Fusion Agent
    this.createAgent({
      id: 'signal-fusion',
      name: 'Signal Fusion Agent',
      role: 'signal_analyst',
      systemPrompt: `You are a signal fusion agent responsible for combining multiple trading signals.
      Your tasks include:
      - Weighing different signal sources (sentiment, technical, fundamental)
      - Resolving conflicting signals
      - Generating composite trading recommendations
      - Assessing signal quality and reliability
      
      Consider market context, signal confidence, and source reliability.`,
      capabilities: [
        'signal_fusion',
        'conflict_resolution',
        'quality_assessment',
        'recommendation_generation'
      ],
      tools: [
        {
          name: 'fuse_signals',
          description: 'Combine multiple signals into composite recommendation',
          parameters: {
            signals: { type: 'array', description: 'Array of individual signals' },
            weights: { type: 'object', description: 'Signal source weights' },
            market_context: { type: 'object', description: 'Current market conditions' }
          },
          execute: async (args) => this.executeSignalFusion(args)
        }
      ],
      config: {
        model: 'gemini-pro',
        temperature: 0.2,
        maxTokens: 1800,
        costLimit: 0.08
      }
    });

    // Execution Agent
    this.createAgent({
      id: 'execution',
      name: 'Execution Agent',
      role: 'trader',
      systemPrompt: `You are a trading execution agent responsible for order management.
      Your responsibilities include:
      - Order routing and execution
      - Slippage minimization
      - Market impact assessment
      - Execution timing optimization
      - Post-trade analysis
      
      Focus on optimal execution and minimizing market impact.`,
      capabilities: [
        'order_execution',
        'market_analysis',
        'timing_optimization',
        'slippage_control'
      ],
      tools: [
        {
          name: 'execute_trade',
          description: 'Execute a trade with optimal parameters',
          parameters: {
            asset: { type: 'string', description: 'Asset to trade' },
            side: { type: 'string', description: 'buy or sell' },
            amount: { type: 'number', description: 'Trade amount' },
            strategy: { type: 'string', description: 'Execution strategy' }
          },
          execute: async (args) => this.executeTradeExecution(args)
        }
      ],
      config: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.1,
        maxTokens: 1000,
        costLimit: 0.03
      }
    });
  }

  createAgent(agentDef: Omit<Agent, 'memory'>): void {
    const agent: Agent = {
      ...agentDef,
      memory: {
        shortTerm: [],
        longTerm: {},
        working: {},
        maxContextSize: 50
      }
    };
    
    this.agents.set(agent.id, agent);
  }

  async executeTask(task: AgentTask): Promise<AgentResponse> {
    const agent = this.agents.get(task.agentId);
    if (!agent) {
      throw new Error(`Agent ${task.agentId} not found`);
    }

    const startTime = Date.now();

    try {
      // Prepare AI request
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: agent.systemPrompt
        },
        ...agent.memory.shortTerm,
        {
          role: 'user',
          content: this.formatTaskInput(task)
        }
      ];

      // Execute with model manager
      const aiRequest: AIRequest = {
        messages,
        model: agent.config.model,
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens,
        functions: this.formatToolsAsFunctions(agent.tools),
        metadata: {
          agentId: agent.id,
          taskId: task.id
        }
      };

      const response = await this.modelManager.chat(aiRequest);

      // Handle tool calls
      let finalOutput = response.content;
      const usedTools: string[] = [];

      if (response.functionCalls) {
        for (const functionCall of response.functionCalls) {
          const tool = agent.tools.find(t => t.name === functionCall.name);
          if (tool) {
            try {
              const toolResult = await tool.execute(functionCall.arguments);
              usedTools.push(tool.name);
              
              // Add tool result to context and continue conversation
              messages.push({
                role: 'assistant',
                content: response.content,
                functionCall: {
                  name: functionCall.name,
                  arguments: functionCall.arguments
                }
              });
              
              messages.push({
                role: 'user',
                content: `Tool result for ${functionCall.name}: ${JSON.stringify(toolResult)}`
              });

              // Get final response incorporating tool results
              const finalRequest: AIRequest = {
                ...aiRequest,
                messages
              };

              const finalResponse = await this.modelManager.chat(finalRequest);
              finalOutput = finalResponse.content;
            } catch (error) {
              console.error(`Tool execution error for ${tool.name}:`, error);
            }
          }
        }
      }

      // Update agent memory
      this.updateAgentMemory(agent, task, finalOutput);

      const latency = Date.now() - startTime;

      return {
        agentId: agent.id,
        taskId: task.id,
        success: true,
        output: finalOutput,
        reasoning: response.content,
        confidence: this.extractConfidence(response.content),
        cost: response.usage?.cost,
        latency,
        usedTools
      };

    } catch (error) {
      console.error(`Task execution failed for agent ${agent.id}:`, error);
      
      return {
        agentId: agent.id,
        taskId: task.id,
        success: false,
        output: null,
        reasoning: `Error: ${error}`,
        latency: Date.now() - startTime
      };
    }
  }

  private formatTaskInput(task: AgentTask): string {
    return `Task ID: ${task.id}
Task Type: ${task.type}
Priority: ${task.priority}
Input: ${JSON.stringify(task.input, null, 2)}
${task.deadline ? `Deadline: ${task.deadline.toISOString()}` : ''}
${task.metadata ? `Metadata: ${JSON.stringify(task.metadata, null, 2)}` : ''}`;
  }

  private formatToolsAsFunctions(tools: AgentTool[]) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters,
        required: Object.keys(tool.parameters)
      }
    }));
  }

  private updateAgentMemory(agent: Agent, task: AgentTask, output: string): void {
    // Add to short-term memory
    agent.memory.shortTerm.push({
      role: 'user',
      content: this.formatTaskInput(task)
    });
    
    agent.memory.shortTerm.push({
      role: 'assistant',
      content: output
    });

    // Trim short-term memory if too long
    if (agent.memory.shortTerm.length > agent.memory.maxContextSize) {
      agent.memory.shortTerm = agent.memory.shortTerm.slice(-agent.memory.maxContextSize);
    }

    // Update working memory
    agent.memory.working.lastTask = {
      id: task.id,
      timestamp: new Date(),
      output: output
    };
  }

  private extractConfidence(content: string): number | undefined {
    // Simple regex to extract confidence percentages
    const confidenceMatch = content.match(/confidence[:\s]+(\d+)%/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]) / 100;
    }
    return undefined;
  }

  // Tool execution methods (placeholders)
  private async executeSentimentAnalysis(args: any): Promise<any> {
    // Implementation would call actual sentiment analysis APIs
    return { sentiment: 'bullish', score: 0.7, source: 'reddit' };
  }

  private async executeDefiTvlMonitoring(args: any): Promise<any> {
    // Implementation would call DeFiLlama APIs
    return { tvl_change: '+5.2%', significant_flows: [] };
  }

  private async executePositionSizing(args: any): Promise<any> {
    // Implementation would calculate Kelly sizing
    return { recommended_size: 0.05, max_risk: 0.02 };
  }

  private async executeRiskAssessment(args: any): Promise<any> {
    // Implementation would assess portfolio risk
    return { heat: 0.65, max_drawdown: 0.08, alerts: [] };
  }

  private async executeSignalFusion(args: any): Promise<any> {
    // Implementation would fuse signals
    return { direction: 'LONG', strength: 'MODERATE', confidence: 0.72 };
  }

  private async executeTradeExecution(args: any): Promise<any> {
    // Implementation would execute actual trade
    return { executed: true, fill_price: 67500, slippage: 0.001 };
  }

  // Public API
  async submitTask(task: Omit<AgentTask, 'id'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullTask: AgentTask = { ...task, id: taskId };
    
    this.tasks.set(taskId, fullTask);
    this.taskQueue.push(fullTask);
    
    return taskId;
  }

  async getTaskResult(taskId: string): Promise<AgentResponse | null> {
    // In real implementation, this would check a results store
    return null;
  }

  getAgentStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.agents.forEach((agent, id) => {
      stats[id] = {
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities,
        memorySize: agent.memory.shortTerm.length,
        toolCount: agent.tools.length,
        config: agent.config
      };
    });

    return stats;
  }

  getModelStats() {
    return this.modelManager.getUsageStats();
  }
}
/**
 * Model Provider Abstraction Layer
 * Supports OpenAI, Anthropic, Google, Local models, etc.
 * Agent-agnostic AI orchestration
 */

export interface ModelProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'mistral' | 'kimi' | 'qwen' | 'local' | 'custom';
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  available: boolean;
}

export interface ModelCapabilities {
  chat: boolean;
  completion: boolean;
  embedding: boolean;
  functionCalling: boolean;
  streaming: boolean;
  contextWindow: number;
  maxTokens: number;
  multimodal?: boolean;
  codeExecution?: boolean;
}

export interface ModelPricing {
  inputTokenPrice: number;   // per 1K tokens
  outputTokenPrice: number;  // per 1K tokens
  currency: 'USD';
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  reasoning?: string;
  confidence?: number;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  functions?: AIFunction[];
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Universal AI Provider Interface
 */
export abstract class BaseAIProvider {
  abstract id: string;
  abstract name: string;
  abstract capabilities: ModelCapabilities;

  abstract chat(request: AIRequest): Promise<AIResponse>;
  abstract embed(text: string): Promise<number[]>;
  abstract isAvailable(): Promise<boolean>;
  abstract estimateCost(request: AIRequest): number;
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider extends BaseAIProvider {
  id = 'openai';
  name = 'OpenAI';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: true,
    functionCalling: true,
    streaming: true,
    contextWindow: 128000,
    maxTokens: 4096,
    multimodal: true,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4-turbo-preview',
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
        functions: request.functions,
        stream: request.stream || false,
      }),
    });

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        cost: this.calculateCost(data.usage),
      },
      functionCalls: data.choices[0].message.function_call ? [{
        name: data.choices[0].message.function_call.name,
        arguments: JSON.parse(data.choices[0].message.function_call.arguments),
      }] : undefined,
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    const avgInputTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0); // rough estimation
    const avgOutputTokens = request.maxTokens || 1000;
    
    return (avgInputTokens * 0.01 + avgOutputTokens * 0.03) / 1000; // GPT-4 pricing
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    return (usage.prompt_tokens * 0.01 + usage.completion_tokens * 0.03) / 1000;
  }
}

/**
 * Anthropic Claude Provider Implementation
 */
export class AnthropicProvider extends BaseAIProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: false,
    functionCalling: true,
    streaming: true,
    contextWindow: 200000,
    maxTokens: 8192,
    multimodal: true,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.anthropic.com/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const messages = request.messages.filter(m => m.role !== 'system');
    const systemMessage = request.messages.find(m => m.role === 'system');

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-sonnet-20240229',
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        tools: request.functions?.map(f => ({
          name: f.name,
          description: f.description,
          input_schema: f.parameters,
        })),
      }),
    });

    const data = await response.json();
    
    return {
      content: data.content[0]?.text || '',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        cost: this.calculateCost(data.usage),
      },
      functionCalls: data.content?.filter((c: any) => c.type === 'tool_use')
        .map((tool: any) => ({
          name: tool.name,
          arguments: tool.input,
        })),
    };
  }

  async embed(text: string): Promise<number[]> {
    throw new Error('Anthropic does not provide embedding models');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    const avgInputTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0);
    const avgOutputTokens = request.maxTokens || 1000;
    
    return (avgInputTokens * 0.003 + avgOutputTokens * 0.015) / 1000; // Claude pricing
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    return (usage.input_tokens * 0.003 + usage.output_tokens * 0.015) / 1000;
  }
}

/**
 * Google Gemini Provider Implementation  
 */
export class GoogleProvider extends BaseAIProvider {
  id = 'google';
  name = 'Google Gemini';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: true,
    functionCalling: true,
    streaming: true,
    contextWindow: 128000,
    maxTokens: 8192,
    multimodal: true,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://generativelanguage.googleapis.com/v1beta') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const model = request.model || 'gemini-pro';
    
    const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: request.messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000,
        },
      }),
    });

    const data = await response.json();
    
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        cost: this.calculateCost(data.usageMetadata),
      },
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/models/embedding-001:embedContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/embedding-001',
        content: { parts: [{ text }] },
      }),
    });

    const data = await response.json();
    return data.embedding.values;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    // Gemini Pro pricing estimation
    const avgTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0);
    return (avgTokens * 0.00025) / 1000;
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    const totalTokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
    return (totalTokens * 0.00025) / 1000;
  }
}

/**
 * Mistral Provider Implementation
 */
export class MistralProvider extends BaseAIProvider {
  id = 'mistral';
  name = 'Mistral AI';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: true,
    functionCalling: true,
    streaming: true,
    contextWindow: 32000,
    maxTokens: 8192,
    multimodal: false,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.mistral.ai/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'mistral-large-latest',
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
        tools: request.functions?.map(f => ({
          type: 'function',
          function: {
            name: f.name,
            description: f.description,
            parameters: f.parameters,
          }
        })),
        stream: request.stream || false,
      }),
    });

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        cost: this.calculateCost(data.usage),
      },
      functionCalls: data.choices[0].message.tool_calls?.map((call: any) => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments),
      })),
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    const avgInputTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0);
    const avgOutputTokens = request.maxTokens || 1000;
    
    return (avgInputTokens * 0.002 + avgOutputTokens * 0.006) / 1000; // Mistral pricing
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    return (usage.prompt_tokens * 0.002 + usage.completion_tokens * 0.006) / 1000;
  }
}

/**
 * Moonshot (Kimi) Provider Implementation
 */
export class KimiProvider extends BaseAIProvider {
  id = 'kimi';
  name = 'Moonshot Kimi';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: false,
    functionCalling: true,
    streaming: true,
    contextWindow: 200000, // Kimi's massive context window
    maxTokens: 8192,
    multimodal: false,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.moonshot.cn/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'moonshot-v1-8k',
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
        tools: request.functions?.map(f => ({
          type: 'function',
          function: {
            name: f.name,
            description: f.description,
            parameters: f.parameters,
          }
        })),
        stream: request.stream || false,
      }),
    });

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        cost: this.calculateCost(data.usage),
      },
      functionCalls: data.choices[0].message.tool_calls?.map((call: any) => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments),
      })),
    };
  }

  async embed(text: string): Promise<number[]> {
    throw new Error('Kimi does not provide embedding models');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    const avgInputTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0);
    const avgOutputTokens = request.maxTokens || 1000;
    
    return (avgInputTokens * 0.001 + avgOutputTokens * 0.002) / 1000; // Estimated Kimi pricing
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    return (usage.prompt_tokens * 0.001 + usage.completion_tokens * 0.002) / 1000;
  }
}

/**
 * Qwen Provider Implementation (Alibaba Cloud)
 */
export class QwenProvider extends BaseAIProvider {
  id = 'qwen';
  name = 'Qwen (Alibaba)';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: true,
    functionCalling: true,
    streaming: true,
    contextWindow: 32000,
    maxTokens: 8192,
    multimodal: true,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://dashscope.aliyuncs.com/api/v1') {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable',
      },
      body: JSON.stringify({
        model: request.model || 'qwen-turbo',
        input: {
          messages: request.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        parameters: {
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 2000,
          tools: request.functions?.map(f => ({
            type: 'function',
            function: {
              name: f.name,
              description: f.description,
              parameters: f.parameters,
            }
          })),
        },
      }),
    });

    const data = await response.json();
    
    if (data.code) {
      throw new Error(`Qwen API Error: ${data.message}`);
    }

    return {
      content: data.output?.choices?.[0]?.message?.content || '',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        cost: this.calculateCost(data.usage),
      },
      functionCalls: data.output?.choices?.[0]?.message?.tool_calls?.map((call: any) => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments),
      })),
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/services/embeddings/text-embedding/text-embedding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-v1',
        input: { texts: [text] },
      }),
    });

    const data = await response.json();
    return data.output?.embeddings?.[0]?.embedding || [];
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok || response.status === 404; // Qwen might not have models endpoint
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    const avgInputTokens = request.messages.reduce((sum, msg) => 
      sum + (msg.content.length / 4), 0);
    const avgOutputTokens = request.maxTokens || 1000;
    
    return (avgInputTokens * 0.0002 + avgOutputTokens * 0.0002) / 1000; // Estimated Qwen pricing
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    return ((usage.input_tokens || 0) * 0.0002 + (usage.output_tokens || 0) * 0.0002) / 1000;
  }
}

/**
 * Local/Open Source Provider (Ollama, etc.)
 */
export class LocalProvider extends BaseAIProvider {
  id = 'local';
  name = 'Local Model';
  capabilities: ModelCapabilities = {
    chat: true,
    completion: true,
    embedding: true,
    functionCalling: false, // depends on model
    streaming: true,
    contextWindow: 4096,   // depends on model
    maxTokens: 2048,       // depends on model
  };

  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama2') {
    super();
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model || this.model,
        messages: request.messages,
        stream: false,
      }),
    });

    const data = await response.json();
    
    return {
      content: data.message?.content || '',
      usage: {
        inputTokens: 0,   // local models don't typically track this
        outputTokens: 0,
        cost: 0,          // free for local
      },
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    const data = await response.json();
    return data.embedding;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(request: AIRequest): number {
    return 0; // Local models are free
  }
}
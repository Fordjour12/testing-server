import { OpenRouter } from '@openrouter/sdk';

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenRouterService {
  private client: OpenRouter;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: OpenRouterConfig) {
    this.client = new OpenRouter({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 4000;
  }

  async generatePlan(prompt: string): Promise<any> {
    try {
      console.log(`Calling OpenRouter with model: ${this.model}, prompt length: ${prompt.length}`);

      const response = await this.client.chat.send({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        maxTokens: this.maxTokens
      });

      console.log(`OpenRouter response received, tokens used: ${response.usage?.totalTokens || 'unknown'}`);

      // Parse the JSON response from the AI
      const choice = response.choices?.[0];
      const content = choice?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenRouter');
      }

      // Try to parse JSON, but handle cases where AI might return non-JSON
      try {
        if (typeof content !== 'string') {
          throw new Error('Response content is not a string');
        }
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse JSON response from OpenRouter:', parseError);
        console.error('Raw content:', content);
        throw new Error('Invalid JSON response from OpenRouter');
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`OpenRouter API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenRouter API');
    }
  }
}

// Create a singleton instance
let openRouterService: OpenRouterService | null = null;

export function getOpenRouterService(): OpenRouterService {
  if (!openRouterService) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    openRouterService = new OpenRouterService({
      apiKey,
      model: process.env.OPENROUTER_MODEL,
      temperature: process.env.OPENROUTER_TEMPERATURE ? parseFloat(process.env.OPENROUTER_TEMPERATURE) : undefined,
      maxTokens: process.env.OPENROUTER_MAX_TOKENS ? parseInt(process.env.OPENROUTER_MAX_TOKENS) : undefined
    });
  }
  return openRouterService;
}

export function isConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
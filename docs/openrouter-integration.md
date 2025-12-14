# OpenRouter SDK Integration Guide

## Overview

This document outlines the integration of OpenRouter SDK for AI-powered monthly plan generation in the testing-server application. The integration replaces the existing mock AI implementation with real AI model calls through OpenRouter.

## Current Architecture

### Existing Implementation

The application currently has a mock AI implementation in two locations:

1. **apps/server/src/router/services.ts** (lines 310-332)
   - Contains `callAIModel()` function that returns static mock data
   - Used by the internal `/service/generate` endpoint

2. **packages/db/src/queries/plan-generation.ts** (lines 120-142)
   - Contains identical `callAIModel()` function
   - Used by the database query layer


### AI Generation Flow

1. User submits planning preferences through the API
2. System checks generation quota for the user
3. User preferences and productivity insights are fetched
4. A comprehensive prompt is constructed
5. **AI model is called (currently mocked)**
6. Response is parsed and stored in the database
7. Tasks are extracted and inserted into the plan_tasks table

## Integration Status

### ✅ Completed Implementation

1. **OpenRouter Service Module** - `apps/server/src/lib/openrouter.ts`
   - Created centralized OpenRouter service
   - Implements error handling and configuration
   - Provides singleton pattern for reuse

2. **Service Layer Integration** - `apps/server/src/router/services.ts`
   - Updated `/service/generate` endpoint to use OpenRouter
   - Implements fallback to mock data when API unavailable
   - Proper separation: prepare → AI call → save

3. **Database Layer Refactoring** - `packages/db/src/queries/plan-generation.ts`
   - Separated concerns into two functions:
     - `preparePlanGeneration()`: Prepares data and checks quota
     - `saveGeneratedPlan()`: Saves AI response to database
   - Removed AI calling logic from database layer

4. **Environment Configuration** - `apps/server/.env.example`
   - Added OpenRouter environment variables

## Architecture Overview

The integration follows a clean architecture pattern:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Layer      │────▶│ Service Layer    │────▶│ Database Layer  │
│ (/api/plan/*)   │     │ (/service/*)     │     │ (queries/*)     │
│                 │     │                  │     │                 │
│ - Public APIs   │     │ - Business Logic │     │ - Data Ops      │
│ - Input Valid.  │     │ - OpenRouter API │     │ - No External   │
│ - Error Format  │     │ - Fallback Logic │     │   Dependencies │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Integration Plan

### 1. Dependencies

- ✅ `@openrouter/sdk` v0.2.11 is already installed in `apps/server/package.json`

### 2. Environment Configuration

Add the following environment variables to `apps/server/.env.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

### 3. OpenRouter Service Module

Create a new service module at `apps/server/src/lib/openrouter.ts`:

```typescript
import OpenRouter from '@openrouter/sdk';

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
      const response = await this.client.chat.send({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      // Parse the JSON response from the AI
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenRouter');
      }

      return JSON.parse(content);
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
```

### 4. Implementation Steps

#### Step 1: Update apps/server/src/router/services.ts

Replace the mock `callAIModel()` function (lines 310-332) with:

```typescript
import { OpenRouterService } from '../lib/openrouter';

// Create a singleton instance
const openRouterService = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  model: process.env.OPENROUTER_MODEL,
  temperature: process.env.OPENROUTER_TEMPERATURE ? parseFloat(process.env.OPENROUTER_TEMPERATURE) : undefined,
  maxTokens: process.env.OPENROUTER_MAX_TOKENS ? parseInt(process.env.OPENROUTER_MAX_TOKENS) : undefined
});

async function callAIModel(prompt: string): Promise<any> {
  // Check if API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not configured, falling back to mock data');
    return getMockAIResponse();
  }

  try {
    return await openRouterService.generatePlan(prompt);
  } catch (error) {
    console.error('Failed to generate plan with OpenRouter, falling back to mock data:', error);
    return getMockAIResponse();
  }
}

function getMockAIResponse(): any {
  // Original mock implementation as fallback
  return {
    monthly_summary: "Mock monthly plan summary",
    weekly_breakdown: [
      {
        week: 1,
        focus: "Foundation building",
        tasks: [
          {
            task_description: "Complete project setup",
            focus_area: "Development",
            start_time: "2025-01-01T09:00:00Z",
            end_time: "2025-01-01T11:00:00Z",
            difficulty_level: "simple",
            scheduling_reason: "Morning energy peak"
          }
        ]
      }
    ]
  };
}
```

#### Step 2: Update packages/db/src/queries/plan-generation.ts

Since this file cannot import from `apps/server`, you have two options:

**Option A: Duplicate the OpenRouter logic** (Recommended for simplicity)
```typescript
// Add this at the top of the file
import OpenRouter from '@openrouter/sdk';

async function callAIModel(prompt: string): Promise<any> {
  if (!process.env.OPENROUTER_API_KEY) {
    // Return mock response
    return getMockAIResponse();
  }

  try {
    const client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const response = await client.chat.send({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenRouter');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenRouter API error in db layer:', error);
    return getMockAIResponse();
  }
}

function getMockAIResponse(): any {
  // Same mock implementation as above
}
```

**Option B: Create a shared package** (Better for DRY principle)
- Create a new package `packages/ai-service`
- Move OpenRouter logic there
- Import from both locations

### 5. Error Handling Strategy

The implementation includes comprehensive error handling:

1. **Configuration Check**: Validates that `OPENROUTER_API_KEY` is set
2. **API Error Handling**: Catches and logs OpenRouter API errors
3. **Graceful Degradation**: Falls back to mock data if API is unavailable
4. **JSON Parsing**: Handles malformed JSON responses

### 6. Testing Considerations

#### Unit Tests
- Mock OpenRouter client in unit tests
- Test error handling scenarios
- Verify fallback behavior

#### Integration Tests
- Test with actual OpenRouter API (optional)
- Verify end-to-end flow
- Test rate limiting behavior

#### Test Environment Setup
```env
# .env.test
OPENROUTER_API_KEY=test_key
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

## Database Schema Considerations

The existing database schema already supports the OpenRouter integration:

- `monthly_plans.aiPrompt` - Stores the prompt sent to AI
- `monthly_plans.aiResponseRaw` - Stores raw AI response for audit
- `generation_quota` - Tracks API usage per user
- `plan_tasks` - Stores extracted tasks from AI response

## Security Considerations

1. **API Key Security**:
   - Store API key in environment variables
   - Never commit API keys to version control
   - Use different keys for development and production

2. **Input Validation**:
   - The prompt construction already sanitizes user input
   - No additional validation needed for OpenRouter

3. **Rate Limiting**:
   - The quota system already limits usage per user
   - OpenRouter may have additional rate limits

## Monitoring and Logging

### Recommended Logging

```typescript
// In the OpenRouter service
console.log(`Calling OpenRouter with model: ${model}, prompt length: ${prompt.length}`);
console.log(`OpenRouter response received, tokens used: ${response.usage?.total_tokens || 'unknown'}`);
```

### Metrics to Track

1. Number of AI generations per user
2. Success/failure rate of API calls
3. Response times
4. Token usage
5. Error types and frequencies

## Configuration Options

### Model Selection

Popular models for plan generation:
- `anthropic/claude-3.5-sonnet` (recommended)
- `anthropic/claude-3-haiku` (faster, cheaper)
- `openai/gpt-4-turbo`
- `google/gemini-pro`

### Temperature Settings

- `0.0-0.3`: More deterministic, structured output
- `0.7`: Balanced creativity and consistency (recommended)
- `1.0`: More creative, less predictable

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is correct at openrouter.ai/settings/keys
   - Check if the key has sufficient credits
   - Ensure no extra spaces in the environment variable

2. **Invalid JSON Response**
   - Some models may not return valid JSON
   - Consider using a model with better JSON compliance
   - Add JSON parsing with fallback

3. **Rate Limiting**
   - OpenRouter has rate limits per API key
   - Implement exponential backoff if needed
   - Monitor usage in OpenRouter dashboard

4. **Model Not Available**
   - Check if the model is available on OpenRouter
   - Verify model name is correct
   - Fall back to a more common model

## Future Enhancements

1. **Model Selection per User**: Allow users to choose their preferred AI model
2. **Streaming Responses**: Implement streaming for long responses
3. **Response Caching**: Cache similar prompts to reduce API calls
4. **Custom Models**: Support fine-tuned models for specific use cases
5. **Cost Tracking**: Track and display AI generation costs to users

## Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter TypeScript SDK](https://openrouter.ai/docs/sdks/typescript/overview)
- [Available Models](https://openrouter.ai/models)
- [API Keys](https://openrouter.ai/settings/keys)
# OpenRouter Quick Start Guide

## 1. Get Your API Key

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up or log in
3. Navigate to [Settings > API Keys](https://openrouter.ai/settings/keys)
4. Create a new API key
5. Copy the key for use in your application

## 2. Configure Environment

Add to your `apps/server/.env` file:

```env
OPENROUTER_API_KEY=your_actual_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

## 3. Integration Overview

The OpenRouter SDK replaces the mock AI implementation in two files:

- `apps/server/src/router/services.ts` - Main service implementation
- `packages/db/src/queries/plan-generation.ts` - Database layer implementation

## 4. Supported Models

Recommended models for plan generation:

- `anthropic/claude-3.5-sonnet` - Best balance of quality and speed
- `anthropic/claude-3-haiku` - Faster and cheaper option
- `openai/gpt-4-turbo` - Alternative high-quality model
- `google/gemini-pro` - Google's latest model

## 5. Error Handling

The implementation includes automatic fallback to mock data if:
- API key is not configured
- OpenRouter API is unavailable
- API returns invalid JSON response

## 6. Cost Tracking

- Check your usage at [OpenRouter Dashboard](https://openrouter.ai/dashboard)
- Monitor token usage in your application logs
- The quota system prevents excessive usage

## 7. Testing

To test with a free model:

```env
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

For development, you can also omit the API key to use mock data.

## 8. Common Issues

**"Invalid API key"**
- Ensure no spaces in the key
- Verify the key is active at openrouter.ai

**"Model not found"**
- Check [Available Models](https://openrouter.ai/models)
- Use exact model name from OpenRouter

**"Rate limited"**
- Wait a few minutes between requests
- Check your quota at OpenRouter dashboard

## 9. Next Steps

For full documentation, see:
- [OpenRouter Integration Guide](./openrouter-integration.md)
- [API Flow Documentation](./api-flow.md)
- [Official OpenRouter Docs](https://openrouter.ai/docs)
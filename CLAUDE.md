# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo built with Better-T-Stack, using Hono as the web framework, Bun as the runtime, Drizzle ORM with PostgreSQL, and Better-Auth for authentication. The project uses Turborepo for monorepo management. It features AI-powered monthly plan generation using OpenRouter SDK with graceful fallback to mock data.

## Architecture

The project follows a modular monorepo structure:

- **apps/server** - Main Hono application server
  - Contains public API routes (`/api/plan/*`) and internal services (`/service/*`)
  - Houses OpenRouter service module (`src/lib/openrouter.ts`)
  - Server runs on port 3000 by default
- **packages/db** - Database layer with Drizzle ORM schema, migrations, and queries
  - All database operations centralized in query functions in `src/queries/`
  - AI generation preparation and plan saving logic in `src/queries/plan-generation.ts`
  - User productivity insights analysis in `src/queries/insights-analysis.ts`
- **packages/auth** - Authentication configuration using Better-Auth
- **packages/config** - Shared TypeScript configuration

### Key Architecture Patterns

1. **Separation of Concerns**: Public API endpoints (`apps/server/src/router/plan.ts`) are separate from internal services (`apps/server/src/router/services.ts`)
2. **Database Abstraction**: All database operations go through query functions in `packages/db/src/queries/`
3. **AI Integration at Service Layer**: OpenRouter SDK integration is implemented in the internal service layer (`apps/server/src/router/services.ts`), with database queries handling preparation and saving
4. **Quota Management**: Built-in generation quota system per user per month with automatic enforcement
5. **Graceful Degradation**: AI calls fall back to mock data when API is unavailable, ensuring system works even without OpenRouter API key

## Common Development Commands

### Development
```bash
bun run dev              # Start all applications in development mode
bun run dev:server       # Start only the server application
```

### Building and Type Checking
```bash
bun run build           # Build all applications
bun run check-types     # Run TypeScript type checking across all apps
```

### Database Operations
```bash
bun run db:push         # Push schema changes to database
bun run db:studio       # Open Drizzle Studio for database management
bun run db:generate     # Generate migration files
bun run db:migrate      # Run database migrations
bun run db:start        # Start PostgreSQL container via Docker Compose
bun run db:watch        # Start PostgreSQL with watch mode
bun run db:stop         # Stop PostgreSQL container
bun run db:down         # Stop and remove PostgreSQL container
```

## Key Technologies

- **Runtime**: Bun v1.3.0
- **Framework**: Hono v4.8.2
- **Database**: PostgreSQL with Drizzle ORM v0.45.1
- **Authentication**: Better-Auth v1.4.5 with email/password support
- **AI Integration**: OpenRouter SDK v0.2.11 for LLM access
- **Monorepo**: Turborepo v2.5.4
- **Language**: TypeScript v5 with strict configuration

## Environment Configuration

- Server environment file: `apps/server/.env`
- Example environment file: `apps/server/.env.example`
- Database configuration via Docker Compose: `packages/db/docker-compose.yml`

### Required Environment Variables
```env
DATABASE_URL=           # PostgreSQL connection string
BETTER_AUTH_SECRET=     # Auth signing secret
BETTER_AUTH_URL=        # Base URL for auth
CORS_ORIGIN=           # CORS allowed origins
```

### OpenRouter Environment Variables (Optional)
```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

## Database Schema

- Authentication schema is located in `packages/db/src/schema/auth.ts`
- Database connection and instance are exported from `packages/db/src/index.ts`
- AI-related tables: `monthly_plans`, `plan_tasks`, `user_goals_and_preferences`, `user_productivity_insights`, `generation_quota`

## Authentication Setup

- Better-Auth configuration in `packages/auth/src/index.ts`
- Uses Drizzle adapter for PostgreSQL
- Email/password authentication enabled
- CORS-aware cookie configuration for cross-origin requests

## AI Plan Generation Architecture

The AI-powered plan generation follows this flow:

1. User submits planning preferences via `POST /api/plan/inputs`
2. System checks and decrements user's monthly generation quota
3. Comprehensive prompt is constructed with user goals, preferences, and historical insights
4. Internal service `/service/generate` is called, which handles AI generation
5. OpenRouter API is called if configured, otherwise falls back to mock data
6. AI response is parsed, stored, and tasks are extracted into the database
7. Returns generated plan ID to the user

### Key Files for AI Integration

- `apps/server/src/router/services.ts` - Internal service that calls OpenRouter or mock data
- `apps/server/src/lib/openrouter.ts` - OpenRouter service implementation
- `packages/db/src/queries/plan-generation.ts` - Plan preparation and saving logic
- `packages/db/src/queries/insights-analysis.ts` - Productivity insights calculation
- Mock data fallback ensures system works even without API key

## Development Notes

- All packages use workspace references for internal dependencies
- TypeScript configuration is centralized in `packages/config/tsconfig.base.json`
- The server runs on port 3000 by default
- CORS origin is configurable via `CORS_ORIGIN` environment variable
- OpenRouter integration includes automatic fallback to mock data for development
- Database queries are the single source of truth for all data operations
- First-time users are handled gracefully with empty insights arrays and appropriate AI prompts

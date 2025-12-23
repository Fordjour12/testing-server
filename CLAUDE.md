# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered monthly planning application built as a TypeScript monorepo using Bun runtime and Turborepo. Users submit planning preferences, and the system generates structured monthly plans using OpenRouter API with Claude models.

## Common Commands

```bash
# Development
bun run dev              # Start both server (3000) and web app (5173)
bun run dev:server       # Start server only
bun run dev:web          # Start web app only

# Building
bun run build           # Build all applications
bun run build:web       # Build web app only
bun run check-types     # Type check across all packages
bun run preview:web     # Preview built web app

# Testing & Linting
bun run test:web        # Run web app tests
bun run lint:web        # Lint web app code
bun run format:web      # Format web app code

# Database Operations
bun run db:push         # Push schema changes to database
bun run db:studio       # Open Drizzle Studio (database GUI)
bun run db:generate     # Generate migration files
bun run db:migrate      # Run database migrations
bun run db:start        # Start PostgreSQL via Docker Compose
bun run db:watch        # Start PostgreSQL with watch mode
bun run db:stop         # Stop PostgreSQL container
bun run db:down         # Stop and remove PostgreSQL container
```

## Architecture

### Monorepo Structure

```
apps/
  server/          # Hono backend API (port 3000)
  web/             # React 19 + Vite frontend (port 5173)
packages/
  api/             # Shared API utilities, routers, and OpenRouter service
  auth/            # Better-Auth configuration
  config/          # TypeScript configs
  db/              # Drizzle ORM schema and queries
  types/           # Shared TypeScript types
  response-parser/ # AI response parsing utilities
```

### Backend (apps/server/)

**Entry point:** `apps/server/src/index.ts`

**Router organization:**
- `/api/plan/*` - Plan generation endpoints (from `packages/api/src/routers/plan.ts`)
- `/service/*` - Internal services including OpenRouter generation (`packages/api/src/routers/services.ts`)
- `/api/streaming/*` - Streaming response support
- `/api/mock/*` - Mock data for development
- `/api/quota/*` - User generation quota management
- `/api/auth/*` - Better-Auth handler

**Authentication flow:**
- Better-Auth with Drizzle adapter for PostgreSQL
- Context created via `createContext` in `apps/server/src/lib/context.ts`
- Session attached to Hono context variables for all routes

### API Package (packages/api/)

Core shared logic between server and potentially other consumers:

- `lib/openrouter.ts` - OpenRouter SDK wrapper service
- `lib/response-extractor.ts` - Extracts structured data from AI responses
- `services/plan-generation.ts` - Legacy plan generation service
- `services/hybrid-plan-generation.ts` - Current hybrid approach (AI + fallback)
- `routers/plan.ts` - Plan-related API routes
- `routers/services.ts` - Service endpoints including `/service/generate`

### Database (packages/db/)

**Schema files:**
- `auth.ts` - Better-Auth tables (user, session, account)
- `monthly-plans.ts` - Generated plans
- `plan-tasks.ts` - Individual tasks within plans
- `user-goals-and-preferences.ts` - User settings for plan generation
- `user-productivity-insights.ts` - User analytics and patterns
- `generation-quota.ts` - Monthly generation limits per user
- `plan-drafts.ts` - Draft plans before confirmation
- `ai-request-logs.ts` - AI request logging for debugging

**Connection:** Database instance exported from `packages/db/src/index.ts`

### Frontend (apps/web/)

React 19 with TanStack Router, Shadcn UI components, and Tailwind CSS v4.

## AI Integration Flow

1. User submits preferences via `POST /api/plan/inputs`
2. System checks/decrements user's monthly quota (`generation_quota` table)
3. Prompt constructed from user goals, preferences, and historical insights
4. Call to `/service/generate` which uses OpenRouter SDK
5. If OpenRouter unavailable (no API key or failure), falls back to mock data
6. AI response parsed using `response-extractor.ts`
7. Structured plan stored in `monthly_plans` and `plan_tasks` tables
8. Plan ID returned to client

## Environment Configuration

**Server env file:** `apps/server/.env`

Required:
```env
DATABASE_URL=              # PostgreSQL connection
BETTER_AUTH_SECRET=        # Auth signing secret
BETTER_AUTH_URL=           # Base URL for auth
CORS_ORIGIN=              # Allowed origins (default: http://localhost:5173)
```

Optional (for AI features):
```env
OPENROUTER_API_KEY=       # OpenRouter API key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

Without OpenRouter credentials, the system uses mock data for development.

## Frontend Development Guidelines

The `.agent/rules/web-agent.md` file defines frontend development standards:

- **Library Discipline:** Must use existing UI libraries (Shadcn UI, Radix UI) rather than building custom components
- **Design Philosophy:** "Intentional Minimalism" - avoid generic templates, strive for bespoke layouts
- When user triggers "ULTRATHINK", engage in deep multi-dimensional analysis (psychological, technical, accessibility, scalability)

## Key Technologies

- **Runtime:** Bun 1.3.0
- **Monorepo:** Turborepo 2.5.4
- **Backend:** Hono 4.8.2
- **Database:** PostgreSQL + Drizzle ORM 0.45.1
- **Auth:** Better-Auth 1.4.5
- **AI:** OpenRouter SDK 0.2.11
- **Frontend:** React 19, Vite 7, TanStack Router, Tailwind CSS v4, Shadcn UI

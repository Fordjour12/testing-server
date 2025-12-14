# testing-server

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Hono, and more. It features an AI-powered monthly plan generation system using OpenRouter SDK.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Hono** - Lightweight, performant server framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth with email/password support
- **Turborepo** - Optimized monorepo build system
- **AI Integration** - OpenRouter SDK for LLM-powered plan generation
- **Quota Management** - Built-in generation quota system per user

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development servers:

```bash
bun run dev              # Start both server and web app
bun run dev:server       # Start only the server (port 3000)
bun run dev:web          # Start only the web app (port 5173)
```

- The API server runs at [http://localhost:3000](http://localhost:3000)
- The web application runs at [http://localhost:5173](http://localhost:5173)

## AI Plan Generation

The application features an AI-powered monthly plan generation system:

1. Users submit their planning preferences via `POST /api/plan/inputs`
2. The system checks and decrements the user's monthly generation quota
3. A comprehensive prompt is constructed using user goals, preferences, and historical insights
4. The internal service `/service/generate` handles AI generation via OpenRouter API
5. If OpenRouter is unavailable, the system gracefully falls back to mock data
6. AI responses are parsed, stored in the database, and tasks are extracted
7. The generated plan ID is returned to the user

### OpenRouter Configuration

To enable AI-powered plan generation, add these environment variables to your `apps/server/.env`:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

The system will work without these variables by using mock data for development.

## Project Structure

```text
testing-server/
├── apps/
│   ├── server/      # Backend API (Hono)
│   │   ├── src/
│   │   │   ├── lib/         # OpenRouter service module
│   │   │   └── router/      # API routes and internal services
│   │   └── .env.example     # Environment variables template
│   └── web/         # Frontend application (React + Vite)
│       ├── src/
│       │   └── components/  # React components
│       ├── public/          # Static assets
│       └── vite.config.ts   # Vite configuration
├── packages/
│   ├── auth/        # Authentication configuration & logic (Better-Auth)
│   ├── config/      # Shared TypeScript configuration
│   └── db/          # Database schema, migrations, and queries
│       ├── src/
│       │   ├── schema/      # Database schema definitions
│       │   └── queries/     # Centralized database operations
│       └── docker-compose.yml # PostgreSQL container setup
└── docs/            # Documentation
```

## Available Scripts

### Development
```bash
bun run dev              # Start both server and web app
bun run dev:server       # Start only the server (port 3000)
bun run dev:web          # Start only the web app (port 5173)
```

### Building and Testing
```bash
bun run build           # Build all applications
bun run build:web       # Build only the web app
bun run check-types     # Run TypeScript type checking across all apps
bun run test:web        # Run tests for the web app
bun run lint:web        # Run linting for the web app
bun run format:web      # Format code for the web app
bun run preview:web     # Preview the built web app
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

## Web Application Stack

The frontend application uses:

- **React 19** - UI library with latest features
- **Vite** - Fast build tool and dev server
- **TanStack Router** - Type-safe routing with SSR support
- **TanStack Start** - Full-stack React framework
- **Tailwind CSS v4** - Utility-first CSS framework
- **Shadcn** - Re-usable React components built with Radix UI
- **Base UI** - Unstyled React components
- **TypeScript** - Type safety throughout the application

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
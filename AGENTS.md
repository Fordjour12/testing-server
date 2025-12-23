# Agents Guide

## Commands
```bash
bun run build              # Build all applications
bun run check-types        # TypeScript type checking (all apps)
bun run dev                # Start dev mode (server:3000, web:5173)
bun run dev:server         # Start server only
bun run dev:web            # Start web only
bun run lint:web           # Lint web app
bun run format:web         # Format web code (Prettier)
bun run test:web           # Run all web tests (Vitest)
bun test <test-file>       # Run single test file
bun run db:push            # Push schema to database
bun run db:studio          # Open Drizzle Studio
```

## Code Style
- **Formatting**: No semicolons, single quotes, trailing commas (Prettier)
- **Types**: Strict TypeScript, explicit return types for exports
- **Imports**: Workspace packages: `@testing-server/package-name`
- **Backend**: Hono routes with zValidator, centralized DB queries in `packages/db/src/queries/`
- **Frontend**: TanStack Router file-based routing, shadcn/ui components
- **Error Handling**: Try-catch with console.error, return `{success, error}` JSON
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **DB Operations**: Always use query functions from `@testing-server/db`, never raw queries

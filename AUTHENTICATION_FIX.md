# Authentication Fix Guide

## Problem
Users frequently get "Unauthorized" errors due to cookie, CORS, and port configuration issues.

## Root Causes
1. **Cookie Security Mismatch**: `secure: true` cookies require HTTPS but using HTTP in development
2. **Missing Better-Auth URL**: No base URL configured for auth  
3. **Port Mismatch**: Server/client using different ports
4. **Environment Variables**: Missing critical env vars

## Applied Fixes

### 1. Auth Configuration (`packages/auth/src/index.ts`)
- Added `baseURL` configuration
- Made cookies environment-aware (secure only in production)
- Used `lax` sameSite for development

### 2. Server Port (`apps/server/src/index.ts`) 
- Changed from port 3001 to 3000 to match client expectations

### 3. Environment Variables
- **Server**: Added `BETTER_AUTH_URL` and `API_BASE_URL` to `.env.example`
- **Web**: Created `.env.example` with `VITE_API_BASE_URL`

### 4. Session Context (`apps/server/src/lib/context.ts`)
- Added error handling for session creation
- Prevents crashes when auth fails

## Required Setup

### 1. Copy Environment Files
```bash
# In apps/server/
cp .env.example .env

# In apps/web/  
cp .env.example .env
```

### 2. Fill Environment Variables
```bash
# apps/server/.env
DATABASE_URL=your_database_url
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:3000

# apps/web/.env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Restart Services
```bash
bun run dev
```

## How It Works Now

### Authentication Flow
1. **Global Middleware**: Runs on all routes before request handlers
2. **Session Creation**: `createContext` extracts session from cookies/headers
3. **Context Injection**: Session available via `c.get("session")` in any route
4. **Type Safety**: Proper TypeScript types for session variables

### Cookie Configuration
- **Development**: `sameSite: "lax"`, `secure: false` 
- **Production**: `sameSite: "none"`, `secure: true`

### Access Pattern
```typescript
// In any route
app.get('/protected', (c) => {
  const session = c.get("session")
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  return c.json({ user: session.user })
})
```

## Troubleshooting

### Still Getting Unauthorized?
1. **Check cookies**: Open browser dev tools → Application → Cookies
2. **Verify environment**: Ensure all env vars are set correctly
3. **Clear browser data**: Clear cookies and localStorage
4. **Check ports**: Ensure server runs on 3000, web on 5173
5. **Network tab**: Verify auth requests include cookies

### Common Issues
- **Missing BETTER_AUTH_SECRET**: Auth won't work without it
- **Wrong CORS_ORIGIN**: Must match your web app URL exactly
- **Port conflicts**: Ensure ports 3000 and 5173 are available

### Debug Logging
Add this to see session state:
```typescript
// In your route
console.log('Session:', c.get('session'))
```

This setup provides robust authentication that works in both development and production environments.
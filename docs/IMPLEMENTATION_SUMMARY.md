# Simplified Hybrid Plan Generation - Implementation Summary

## Overview

This implementation follows the "Re-Cracked Hybrid" architecture described in `docs/recracked-hybrid-with-diagrams.md`. It's a simplified approach that removes unnecessary complexity while achieving the core goal: **generate a plan and don't lose it on page refresh**.

## What Was Implemented

### 1. Database Layer (`packages/db`)

#### New Schema: `plan_drafts`

- **File**: `packages/db/src/schema/plan-drafts.ts`
- **Purpose**: Stores auto-staged plan drafts that survive page refreshes
- **Key Fields**:
  - `draft_key`: Unique identifier for the draft
  - `plan_data`: JSONB containing the full plan
  - `goal_preference_id`: Link to the preferences used for generation
  - `expires_at`: Automatic cleanup after 24 hours (configurable)

#### New Queries: `plan-drafts.ts`

- **File**: `packages/db/src/queries/plan-drafts.ts`
- **Functions**:
  - `createDraft()` - Auto-stage a generated plan
  - `getDraft()` - Retrieve a specific draft by key
  - `getLatestDraft()` - Get user's most recent draft (for auto-recovery)
  - `deleteDraft()` - Remove a draft
  - `cleanupExpiredDrafts()` - Cron job to remove expired drafts

#### Migration

- **File**: `packages/db/src/migrations/0001_add_plan_drafts.sql`
- **Run**: `npm run db:migrate` (or equivalent command)

### 2. Service Layer (`packages/api`)

#### New Service: `hybrid-plan-generation.ts`

- **File**: `packages/api/src/services/hybrid-plan-generation.ts`
- **Core Functions**:
  - `generatePlan()` - Main generation flow
  - `confirmPlan()` - Save draft to permanent storage

**Flow**:

```
1. Save user preferences
2. Call AI (OpenRouter)
3. Parse AI response
4. Auto-stage as draft
5. Return plan data + draft key
```

### 3. API Layer (`packages/api`)

#### Updated Router: `plan.ts`

- **File**: `packages/api/src/routers/plan.ts`
- **New Endpoints**:
  - `POST /api/plan/generate` - Generate and auto-stage a plan
  - `POST /api/plan/confirm` - Save a draft permanently
  - `GET /api/plan/draft/:key` - Get a specific draft
  - `GET /api/plan/draft` - Get latest draft (auto-recovery)
  - `DELETE /api/plan/draft/:key` - Discard a draft

**Existing Endpoints** (kept for backward compatibility):

- `GET /api/plan/current` - Get active monthly plan
- `PATCH /api/plan/tasks/:taskId` - Update task status
- `GET /api/plan/inputs/latest` - Get latest planning inputs

## How It Works

### User Flow

1. **User fills form and clicks "Generate"**

   ```
   POST /api/plan/generate
   {
     goalsText: "...",
     taskComplexity: "Balanced",
     focusAreas: "...",
     weekendPreference: "Mixed",
     fixedCommitmentsJson: {...}
   }
   ```

2. **Backend generates and auto-stages**
   - Saves preferences to `user_goals_and_preferences`
   - Calls AI to generate plan
   - Parses AI response
   - **Auto-saves to `plan_drafts`** (this is the key!)
   - Returns `{ draftKey, planData, ... }`

3. **Frontend shows preview**
   - User sees the generated plan
   - Frontend stores `draftKey` in state/localStorage

4. **User refreshes page** (this is what we're protecting against!)
   - Frontend calls `GET /api/plan/draft` on mount
   - Backend returns the latest draft
   - User doesn't lose their plan! ✓

5. **User clicks "Save"**

   ```
   POST /api/plan/confirm
   { draftKey: "draft_..." }
   ```

   - Backend moves draft to `monthly_plans`
   - Deletes draft from `plan_drafts`
   - Returns `{ planId }`

6. **User clicks "Discard"**

   ```
   DELETE /api/plan/draft/:key
   ```

   - Backend deletes the draft
   - User can start fresh

## What We Removed (Compared to Original "Cracked" Design)

❌ **Decision Engine** - No complex logic to decide when to save
❌ **Multiple Save Modes** - Just one mode: generate → stage → confirm
❌ **Lightweight vs Regular Staging** - One staging table, one approach
❌ **Internal HTTP Calls** - Direct function calls instead
❌ **plan_generation_options Table** - No separate options table
❌ **Mock/Fallback Plans** - Return errors instead of fake data
❌ **access_count Tracking** - Removed unnecessary metadata

## What We Kept

✅ **Auto-staging** - Plans are always saved as drafts
✅ **Page refresh recovery** - Drafts survive refreshes
✅ **User control** - User decides when to save
✅ **Expiration** - Drafts auto-delete after 24 hours
✅ **Backward compatibility** - Existing endpoints still work

## Next Steps

### 1. Run Migration

```bash
cd packages/db
npm run db:migrate
# or
bun run db:migrate
```

### 2. Test the API

#### Generate a plan

```bash
curl -X POST http://localhost:3000/api/plan/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "goalsText": "Learn TypeScript and build a web app",
    "taskComplexity": "Balanced",
    "focusAreas": "Programming, Learning",
    "weekendPreference": "Mixed",
    "fixedCommitmentsJson": { "commitments": [] }
  }'
```

#### Get latest draft

```bash
curl http://localhost:3000/api/plan/draft \
  -H "Cookie: session=..."
```

#### Confirm a draft

```bash
curl -X POST http://localhost:3000/api/plan/confirm \
  -H "Content-Type: application/json" \
  -d '{ "draftKey": "draft_..." }'
```

### 3. Frontend Integration

Create a React hook (example provided in the doc):

```typescript
// apps/web/src/hooks/usePlanGeneration.ts
export function usePlanGeneration(userId: string) {
  // Check for existing draft on mount
  useEffect(() => {
    checkForExistingDraft();
  }, [userId]);
  
  // ... rest of implementation
}
```

### 4. Cron Job for Cleanup

Add to your cron scheduler:

```typescript
import { cleanupExpiredDrafts } from "@testing-server/db";

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const deleted = await cleanupExpiredDrafts();
  console.log(`Cleaned up ${deleted} expired drafts`);
});
```

## Architecture Benefits

### Simplicity

- **1 table** instead of 2+
- **1 flow** instead of 6+ code paths
- **Direct calls** instead of HTTP to self

### Reliability

- Plans always survive refresh
- No complex decision logic to debug
- Clear error handling

### Performance

- No unnecessary HTTP calls
- Efficient database queries with indexes
- Automatic cleanup of old drafts

## Files Changed/Created

### Created

- `packages/db/src/schema/plan-drafts.ts`
- `packages/db/src/queries/plan-drafts.ts`
- `packages/db/src/migrations/0001_add_plan_drafts.sql`
- `packages/api/src/services/hybrid-plan-generation.ts`

### Modified

- `packages/db/src/schema/index.ts` - Export plan_drafts schema
- `packages/db/src/queries/index.ts` - Export plan_drafts queries
- `packages/api/src/routers/plan.ts` - Updated with new endpoints
- `packages/api/src/index.ts` - Export new service functions

## Comparison: Before vs After

| Aspect | Original | Simplified |
|--------|----------|------------|
| **API Endpoints** | 6+ | 4 new + 3 existing |
| **Database Tables** | 2 new | 1 new |
| **Save Modes** | 3 modes + auto | 1 mode (always stage) |
| **Decision Logic** | Complex | None |
| **Code Paths** | 6+ | 2 (success/error) |
| **Internal HTTP** | Yes | No |
| **Lines of Code** | ~800+ | ~300 |

## Success Metrics to Track

1. **Generation success rate** - Did AI call succeed?
2. **Draft → Save conversion** - Are users saving their plans?
3. **Draft expiration rate** - Are users abandoning drafts?
4. **Average time to save** - How long between generate and save?

## Future Enhancements (Only if Needed)

Based on the doc, only add these **after** shipping MVP and seeing real usage:

1. **Multiple drafts** - If users want to compare options
2. **Draft editing** - If users want to tweak before saving
3. **Preference memory** - Store last used settings
4. **Generation history** - Regenerate with same inputs

## Conclusion

This implementation delivers exactly what's needed:

1. ✅ Generate a plan
2. ✅ Don't lose it on refresh
3. ✅ Let user save when ready

**Ship this. Measure. Then add complexity only where data shows it's needed.**

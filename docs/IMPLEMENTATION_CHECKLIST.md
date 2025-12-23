# Implementation Checklist

## ✅ Completed

- [x] Created `plan_drafts` schema table
- [x] Created plan-drafts CRUD queries
- [x] Created hybrid plan generation service
- [x] Updated plan router with new endpoints
- [x] Created database migration file
- [x] Updated package exports
- [x] Created implementation documentation

## 🔄 Next Steps (Required)

### 1. Run Database Migration

```bash
cd packages/db
npm run db:migrate
# or
bun run db:migrate
```

**Purpose**: Create the `plan_drafts` table in your database

### 2. Verify Database Schema

```bash
# Connect to your database and verify the table exists
psql -d your_database -c "\d plan_drafts"
```

**Expected output**: Should show the table structure with all columns

### 3. Test the API Endpoints

#### Test 1: Health Check

```bash
curl http://localhost:3000/api/plan
```

Expected: JSON response with endpoint list

#### Test 2: Generate Plan (requires auth)

```bash
curl -X POST http://localhost:3000/api/plan/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "goalsText": "Test goal",
    "taskComplexity": "Balanced",
    "focusAreas": "Testing",
    "weekendPreference": "Mixed",
    "fixedCommitmentsJson": { "commitments": [] }
  }'
```

Expected: `{ success: true, data: { draftKey, planData, ... } }`

#### Test 3: Get Latest Draft

```bash
curl http://localhost:3000/api/plan/draft \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

Expected: Draft data or `{ success: true, data: null }`

### 4. Frontend Integration (Optional)

Create the React hook as described in the implementation doc:

- File: `apps/web/src/hooks/usePlanGeneration.ts`
- See `docs/recracked-hybrid-with-diagrams.md` lines 725-877 for full code

### 5. Set Up Cron Job for Cleanup (Optional but Recommended)

Add to your server startup or cron scheduler:

```typescript
import { cleanupExpiredDrafts } from "@testing-server/db";

// Run daily
setInterval(async () => {
  const deleted = await cleanupExpiredDrafts();
  console.log(`Cleaned up ${deleted} expired drafts`);
}, 24 * 60 * 60 * 1000); // 24 hours
```

## 📝 Testing Checklist

- [ ] Database migration runs successfully
- [ ] `plan_drafts` table exists with correct schema
- [ ] POST /api/plan/generate creates a draft
- [ ] GET /api/plan/draft retrieves the draft
- [ ] POST /api/plan/confirm saves draft to monthly_plans
- [ ] DELETE /api/plan/draft/:key removes the draft
- [ ] Draft expires after 24 hours (or configured TTL)
- [ ] Cleanup job removes expired drafts

## 🐛 Potential Issues to Watch For

### 1. Authentication

- The endpoints require authentication via session
- Make sure your auth middleware is working
- Test with a valid session token

### 2. OpenRouter API Key

- Ensure `OPENROUTER_API_KEY` is set in environment
- Check `OPENROUTER_MODEL` is configured
- Verify API quota/limits

### 3. Database Connection

- Ensure database is running
- Check connection string is correct
- Verify migrations table exists

### 4. CORS (if frontend is separate)

- Configure CORS to allow frontend domain
- Include credentials in fetch requests

## 📊 Monitoring (Production)

Once deployed, monitor:

1. **Draft Creation Rate**

   ```sql
   SELECT COUNT(*) FROM plan_drafts WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Draft → Plan Conversion Rate**

   ```sql
   -- Compare drafts created vs plans saved
   SELECT 
     (SELECT COUNT(*) FROM monthly_plans WHERE generated_at > NOW() - INTERVAL '24 hours') as plans_saved,
     (SELECT COUNT(*) FROM plan_drafts WHERE created_at > NOW() - INTERVAL '24 hours') as drafts_created;
   ```

3. **Expired Drafts**

   ```sql
   SELECT COUNT(*) FROM plan_drafts WHERE expires_at < NOW();
   ```

4. **Average Time to Confirm**

   ```sql
   -- This would require adding a confirmed_at timestamp to track
   -- For now, just monitor draft age
   SELECT AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
   FROM plan_drafts;
   ```

## 🚀 Deployment Notes

### Environment Variables

Ensure these are set:

- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - AI service API key
- `OPENROUTER_MODEL` - Model to use (e.g., "anthropic/claude-3-sonnet")
- `API_BASE_URL` - Base URL for API (if needed)

### Database

- Run migrations before deploying
- Set up automated backups
- Monitor connection pool

### Cron Jobs

- Set up cleanup job in production
- Consider using a job queue (Bull, BullMQ) for reliability
- Log cleanup results for monitoring

## 📚 Documentation References

- **Architecture**: `docs/recracked-hybrid-with-diagrams.md`
- **Implementation**: `docs/IMPLEMENTATION_SUMMARY.md`
- **API Endpoints**: See router file `packages/api/src/routers/plan.ts`
- **Database Schema**: `packages/db/src/schema/plan-drafts.ts`

## ✨ Success Criteria

The implementation is successful when:

1. ✅ User can generate a plan
2. ✅ Plan is automatically saved as draft
3. ✅ User can refresh page and draft persists
4. ✅ User can confirm to save permanently
5. ✅ User can discard unwanted drafts
6. ✅ Old drafts are automatically cleaned up
7. ✅ No errors in production logs
8. ✅ Response times are acceptable (<2s for generation)

---

**Current Status**: Backend implementation complete ✅
**Next**: Run migration and test endpoints

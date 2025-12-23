# Frontend Updates for Hybrid Plan Generation

## Overview

The frontend needs to be updated to work with the new hybrid plan generation flow. This document outlines what needs to change and provides the necessary code.

## What Changed

### Backend Changes (Already Implemented)

- ✅ New endpoint: `POST /api/plan/generate` - Auto-stages drafts
- ✅ New endpoint: `POST /api/plan/confirm` - Save draft permanently
- ✅ New endpoint: `GET /api/plan/draft` - Get latest draft
- ✅ New endpoint: `DELETE /api/plan/draft/:key` - Discard draft
- ❌ Old endpoint: `/api/plan/inputs` - Still works but deprecated
- ❌ Old endpoint: `/api/plan/save-parsed` - Still works but deprecated

### Frontend Changes (Needed)

- ✅ Created: `hooks/usePlanGeneration.ts` - React hook for hybrid flow
- ✅ Created: `functions/hybrid-plan-server-fn.ts` - Server functions for new endpoints
- 🔄 Update: `routes/generate.tsx` - Use new hook and flow
- 🔄 Update: Components to handle draft recovery

## New Files Created

### 1. `hooks/usePlanGeneration.ts`

A React hook that handles:

- ✅ Page refresh recovery (checks for existing draft on mount)
- ✅ Plan generation with auto-staging
- ✅ Draft confirmation (save permanently)
- ✅ Draft discarding
- ✅ Error handling

**Usage:**

```typescript
import { usePlanGeneration } from '@/hooks/usePlanGeneration'

function MyComponent() {
  const {
    draft,
    planData,
    isGenerating,
    isSaving,
    error,
    hasDraft,
    generate,
    save,
    discard,
    clearError
  } = usePlanGeneration()

  // On mount, hook automatically checks for existing draft
  // If found, draft and planData will be populated

  const handleGenerate = async () => {
    await generate({
      goalsText: "...",
      taskComplexity: "Balanced",
      focusAreas: "...",
      weekendPreference: "Mixed",
      fixedCommitmentsJson: { commitments: [] }
    })
  }

  const handleSave = async () => {
    const planId = await save()
    console.log('Saved plan ID:', planId)
  }

  const handleDiscard = async () => {
    await discard()
  }
}
```

### 2. `functions/hybrid-plan-server-fn.ts`

Server functions for the new API endpoints:

- `generatePlanHybrid()` - Generate and auto-stage
- `confirmPlanServerFn()` - Save draft permanently
- `getLatestDraftServerFn()` - Get latest draft
- `discardDraftServerFn()` - Discard draft

## How to Update `routes/generate.tsx`

### Option 1: Minimal Changes (Recommended)

Keep the existing UI and just swap the backend calls:

```typescript
// At the top, import the new hook
import { usePlanGeneration } from '@/hooks/usePlanGeneration'

function RouteComponent() {
  // Replace existing state management with the hook
  const {
    draft,
    planData,
    isGenerating,
    isSaving,
    error,
    hasDraft,
    generate,
    save,
    discard,
    clearError
  } = usePlanGeneration()

  // Keep existing form state
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState(undefined)

  // Show draft recovery notice on mount
  useEffect(() => {
    if (hasDraft && planData) {
      setHasGenerated(true)
      // Optionally show a toast/notification
      console.log('Recovered draft from previous session')
    }
  }, [hasDraft, planData])

  // Update form submission
  const form = useForm({
    // ... existing config
    onSubmit: async ({ value }) => {
      setIsGenerating(true) // Keep for UI state
      setError(undefined)
      setHasGenerated(false)

      try {
        const filteredData = {
          ...value,
          fixedCommitmentsJson: {
            commitments: value.fixedCommitmentsJson.commitments.filter(c =>
              c.dayOfWeek && c.startTime && c.endTime && c.description
            )
          }
        }

        // Use the new generate function
        const result = await generate(filteredData)
        
        if (result) {
          setHasGenerated(true)
          // planData is now available from the hook
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan'
        setError(errorMessage)
        console.error('Plan generation error:', err)
      } finally {
        setIsGenerating(false)
      }
    }
  })

  // Update save handler
  const handleSave = async () => {
    try {
      const planId = await save()
      
      if (planId) {
        alert(`Plan saved successfully! ID: ${planId}`)
        // Optionally navigate to the plan view
        // window.location.href = `/plans/${planId}`
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save plan. Please try again.')
    }
  }

  // Update discard handler
  const handleDiscard = async () => {
    await discard()
    setHasGenerated(false)
    setEditedPlan(undefined)
    setIsEditing(false)
  }

  // Rest of the component stays the same
  // Just use planData from the hook instead of generateResponse
}
```

### Option 2: Full Rewrite (More Work)

Create a completely new component that fully leverages the hybrid flow with better UX for draft recovery.

## UI/UX Improvements to Consider

### 1. Draft Recovery Notice

When a draft is recovered on page load, show a notice:

```typescript
{hasDraft && !hasGenerated && (
  <div className="mb-4 p-4 border border-blue-500 rounded-lg bg-blue-50">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-blue-900">Draft Recovered</h3>
        <p className="text-sm text-blue-700">
          You have an unsaved plan from a previous session.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setHasGenerated(true)} variant="default">
          View Draft
        </Button>
        <Button onClick={handleDiscard} variant="outline">
          Discard
        </Button>
      </div>
    </div>
  </div>
)}
```

### 2. Draft Expiration Warning

Show when the draft will expire:

```typescript
{draft && (
  <p className="text-xs text-muted-foreground">
    Draft expires: {new Date(draft.expiresAt).toLocaleString()}
  </p>
)}
```

### 3. Auto-Save Indicator

Show that the plan was auto-saved:

```typescript
{hasGenerated && draft && (
  <div className="flex items-center gap-2 text-sm text-green-600">
    <CheckCircle className="h-4 w-4" />
    <span>Auto-saved as draft</span>
  </div>
)}
```

### 4. Save vs Discard Actions

Update the action buttons to be clearer:

```typescript
<div className="flex gap-2">
  <Button 
    onClick={handleSave} 
    disabled={isSaving}
    className="flex-1"
  >
    {isSaving ? 'Saving...' : '✓ Save Plan Permanently'}
  </Button>
  <Button 
    onClick={handleDiscard} 
    variant="outline"
  >
    ✗ Discard Draft
  </Button>
  <Button 
    onClick={handleRegenerate} 
    variant="outline"
  >
    ↻ Regenerate
  </Button>
</div>
```

## Migration Path

### Phase 1: Add New Files (Done ✅)

- ✅ Created `hooks/usePlanGeneration.ts`
- ✅ Created `functions/hybrid-plan-server-fn.ts`

### Phase 2: Update Existing Components

1. Update `routes/generate.tsx` to use the new hook
2. Add draft recovery UI
3. Update save/discard handlers

### Phase 3: Test

1. Test plan generation
2. Test page refresh (draft should persist)
3. Test save (draft should be deleted)
4. Test discard (draft should be deleted)
5. Test draft expiration (after 24 hours)

### Phase 4: Cleanup (Optional)

1. Remove old `generate-server-fn.ts` (or keep for backward compatibility)
2. Remove references to old endpoints
3. Update documentation

## Testing Checklist

- [ ] Generate a plan
- [ ] Verify draft is created (check network tab)
- [ ] Refresh the page
- [ ] Verify draft is recovered
- [ ] Save the plan
- [ ] Verify draft is deleted
- [ ] Generate another plan
- [ ] Discard it
- [ ] Verify draft is deleted
- [ ] Test with no internet (should show error)
- [ ] Test with expired draft (should not show)

## Backward Compatibility

The old endpoints still work, so you can:

1. Deploy backend changes first
2. Test new endpoints manually
3. Update frontend gradually
4. Keep old code as fallback

## Environment Variables

Make sure these are set in your `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000
# or your production API URL
```

## Common Issues

### Issue: Draft not recovering on page load

**Solution**: Check browser console for auth errors. Make sure session is valid.

### Issue: "Authentication required" error

**Solution**: Ensure user is logged in and session cookie is being sent.

### Issue: Draft shows but planData is empty

**Solution**: Check the draft structure in the database. Ensure `plan_data` JSONB column has the correct structure.

### Issue: Save button doesn't work

**Solution**: Check network tab for the `/api/plan/confirm` call. Verify draftKey is being sent.

## Next Steps

1. Update `routes/generate.tsx` with the new hook
2. Add draft recovery UI
3. Test the flow end-to-end
4. Deploy and monitor

## Questions?

Refer to:

- `docs/IMPLEMENTATION_SUMMARY.md` - Backend architecture
- `docs/IMPLEMENTATION_CHECKLIST.md` - Testing guide
- `docs/recracked-hybrid-with-diagrams.md` - Original design doc

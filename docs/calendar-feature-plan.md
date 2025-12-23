# Calendar Feature Implementation Plan

## Current State Analysis

**Existing Assets:**
- `apps/web/src/components/calendar/` - Basic UI shell with sidebar, date picker, and calendar filters
- `apps/web/src/components/ui/calendar.tsx` - react-day-picker wrapper
- Database schema: `planTasks` table with `startTime`, `endTime`, `focusArea`, `difficultyLevel`, `isCompleted`
- Query functions: `getCurrentMonthlyPlanWithTasks`, `getTasksByPlanId`, `updateTaskStatus`
- Dashboard links to `/calendar` but calendar only shows placeholder grid

**Missing Functionality:**
1. No real task data displayed on calendar
2. No month navigation with data fetching
3. No task detail view when clicking on days
4. Filters are static (not connected to real focus areas)
5. No task completion toggle from calendar view

---

## Implementation Plan

### Phase 1: Backend API Extensions

**New Query Functions** (`packages/db/src/queries/`):

1. `getTasksByDateRange(userId: string, startDate: Date, endDate: Date)` - Fetch all tasks for a month
2. `getTasksByDay(userId: string, date: Date)` - Fetch tasks for specific day
3. `getUniqueFocusAreas(userId: string)` - Get all unique focus areas for filters
4. Add to `index.ts`: Export these new functions

**New API Routes** (`apps/server/src/router/` or `packages/api/src/routers/`):

```
GET  /api/calendar/tasks?month=2024-12   - Get tasks for month view
GET  /api/calendar/tasks/day?date=2024-12-15   - Get tasks for specific day
GET  /api/calendar/focus-areas            - Get unique focus areas for filters
PATCH /api/plan/tasks/:taskId              - Update task completion (exists, reuse)
```

---

### Phase 2: Frontend Server Functions

**New Server Functions** (`apps/web/src/functions/`):

Create `calendar-server-fn.ts`:
```typescript
getTasksForMonth(month: string)
getTasksForDay(date: string)
getFocusAreas()
updateTaskCompletion(taskId: number, isCompleted: boolean)
```

---

### Phase 3: Calendar Page Components

**1. Task Calendar Grid** (`apps/web/src/components/calendar/task-calendar-grid.tsx`)
- Uses react-day-picker Calendar component
- Displays task indicators (dots/badges) on days with tasks
- Color-coded by completion status or focus area
- Shows task count badge on each day
- Click handler opens task detail sheet
- Month navigation triggers refetch

**2. Task Detail Sheet/Dialog** (`apps/web/src/components/calendar/task-detail-sheet.tsx`)
- Slide-over sheet showing tasks for selected day
- List of tasks with: title, time, focus area badge, difficulty indicator
- Checkbox to toggle completion (calls API, optimistically updates UI)
- Empty state for days with no tasks
- "Add Task" button (future enhancement)

**3. Enhanced Calendar Sidebar** (`apps/web/src/components/calendar/components/app-sidebar.tsx`)
- Fetch and display real focus areas from API
- Show task count per focus area
- Toggle switches to filter visible tasks on calendar
- "Today" button to jump to current date

---

### Phase 4: Calendar Page Integration

**Update** `apps/web/src/components/calendar/page.tsx`:

- State: `selectedMonth`, `selectedDate`, `focusAreaFilters[]`
- Fetch tasks for month on mount and month change
- Pass data to TaskCalendarGrid and Sidebar
- Handle date selection → open TaskDetailSheet
- Handle task completion toggle → optimistically update, then sync

**Features:**
- Header with month/year and navigation buttons
- Breadcrumb: "Calendar → December 2024"
- Responsive: sidebar collapses on mobile
- Loading states for data fetching
- Error handling with user-friendly messages

---

### Phase 5: Cross-Page Integration

**Dashboard Updates** (`apps/web/src/routes/dashboard.tsx`):
- "View Calendar" button → `/calendar?month=2024-12` (pass current month)
- Calendar should link back to dashboard

**Navigation Updates** (`apps/web/src/routes/__root.tsx`):
- Add Calendar to nav (already exists)

---

## Technical Decisions

### Calendar Display Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Visual indicators | Color-coded dots per task | Clean, scales well |
| Task count | Small badge with number | Provides density info |
| Colors | Green=completed, Blue=pending, Red=overdue | Industry standard |
| Detail view | Sheet/Dialog from side | Keeps context, common pattern |

### State Management
- Use React state for UI (selected date, filters)
- Server functions for data fetching
- TanStack Router navigation for month changes (`/calendar?month=2024-12`)
- No external state library needed (keep it simple)

### Data Fetching Pattern
```typescript
// Server function with query invalidation
const { data: tasks, isLoading } = useQuery({
  queryKey: ['calendar-tasks', selectedMonth],
  queryFn: () => getTasksForMonth(selectedMonth)
})
```

---

## Questions for Development

1. **Task Detail View**: Should clicking a day open a full-screen modal or a slide-over sheet? (I recommend sheet for better context retention)

2. **Add Task Feature**: Should we include "Add Task" from calendar in this phase, or as a separate follow-up?

3. **Task Movement**: Should users be able to drag tasks between dates? (Adds complexity)

4. **Mobile Experience**: Should calendar sidebar be collapsible/hidden on mobile?

---

## Dependencies

### Required Packages
- `@tanstack/react-query` - For data fetching and caching (already available via TanStack Start)
- `date-fns` - Date utilities (already in dependencies)

### UI Components Needed
- `Sheet` (from `@/components/ui/sheet`) - For task detail slide-over
- `Checkbox` (from `@/components/ui/checkbox`) - For task completion toggle
- Existing `Calendar`, `Card`, `Badge`, `Button`, etc.

---

## API Contract Examples

### GET /api/calendar/tasks?month=2024-12
```typescript
{
  success: true,
  data: [
    {
      id: 1,
      taskDescription: "Complete project proposal",
      focusArea: "Work",
      startTime: "2024-12-15T09:00:00Z",
      endTime: "2024-12-15T11:00:00Z",
      difficultyLevel: "advanced",
      isCompleted: false
    },
    // ... more tasks
  ]
}
```

### GET /api/calendar/focus-areas
```typescript
{
  success: true,
  data: [
    { name: "Work", count: 12, color: "#3b82f6" },
    { name: "Health", count: 5, color: "#22c55e" },
    { name: "Learning", count: 8, color: "#f59e0b" }
  ]
}
```

---

## File Structure

```
apps/web/src/
├── components/
│   └── calendar/
│       ├── page.tsx (update)
│       ├── task-calendar-grid.tsx (new)
│       ├── task-detail-sheet.tsx (new)
│       └── components/
│           └── app-sidebar.tsx (update)
├── functions/
│   └── calendar-server-fn.ts (new)
└── routes/
    └── calendar.tsx (update - maybe for routing params)

packages/db/src/
└── queries/
    ├── calendar.ts (new)
    └── index.ts (update - export calendar functions)

packages/api/src/routers/
└── calendar.ts (new)
```

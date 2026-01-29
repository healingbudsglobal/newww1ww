

# Plan: Add Three-Way API Comparison (Production + Staging + Railway)

## Current State

The API Comparison Dashboard currently supports:
- Production (`api.drgreennft.com`)
- Staging Official (`stage-api.drgreennft.com`) **OR** Railway Dev (`budstack-backend-main-development.up.railway.app`)

The user can toggle between Staging and Railway using a dropdown, but only one is shown at a time.

## Proposed Changes

Modify the comparison dashboard to display **all three environments simultaneously** for comprehensive testing.

---

## Technical Implementation

### 1. Update useApiComparison Hook

**File**: `src/hooks/useApiComparison.ts`

Changes:
- Add a `railway` state to `ComparisonState` alongside `production` and `staging`
- Modify `fetchComparison` to fetch from all three environments in parallel
- Update `EnvironmentState` to track Railway data separately

```text
ComparisonState {
  production: EnvironmentState;   // Existing
  staging: EnvironmentState;      // Official staging
  railway: EnvironmentState;      // NEW - Railway dev
  lastUpdated: Date | null;
}
```

---

### 2. Update ApiComparisonDashboard Component

**File**: `src/components/admin/ApiComparisonDashboard.tsx`

Changes:
- Replace the 2-column grid with a 3-column grid
- Add a third `EnvironmentPanel` for Railway
- Update diff calculations to compare across all three environments
- Show comparison summary for all three
- Remove the staging environment selector dropdown (no longer needed)

New layout:

```text
+------------------+------------------+------------------+
|   Production     |  Staging (API)   |  Railway (Dev)   |
|   api.drgreen    |  stage-api       |  railway.app     |
|   [green badge]  |  [orange badge]  |  [purple badge]  |
+------------------+------------------+------------------+
```

---

### 3. Update drgreen-comparison Edge Function

**File**: `supabase/functions/drgreen-comparison/index.ts`

No changes needed - already supports all three environments via the `environment` parameter.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApiComparison.ts` | Add railway state, parallel fetch for 3 environments |
| `src/components/admin/ApiComparisonDashboard.tsx` | 3-column layout, third environment panel, updated diffs |

---

## User Experience After Implementation

1. Navigate to `/admin`
2. Open the "API Comparison Dashboard" section
3. See all three environments side-by-side:
   - Production (green indicator)
   - Staging Official (orange indicator)
   - Railway Dev (purple indicator)
4. Compare strains, clients, orders, sales across all three
5. Identify discrepancies between any environment pair
6. Summary footer shows item counts for all three

---

## Risk Assessment

- **Low risk**: No database changes
- **Isolated scope**: Only affects admin dashboard UI
- **Backwards compatible**: Same edge function, just called three times


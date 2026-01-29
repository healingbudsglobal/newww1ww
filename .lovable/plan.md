
# Plan: Add Three-Way API Comparison (Production + Staging + Railway)

## Status: ✅ COMPLETED

## Implementation Summary

Updated the API Comparison Dashboard to display **all three environments simultaneously**:

### Changes Made

1. **useApiComparison.ts** - Updated hook:
   - Added `railway` property to `ComparisonState`
   - Modified `fetchComparison` to fetch from all 3 environments in parallel
   - Updated `calculateStrainDiffs` to compare across all 3 data sets
   - Added `railway` to `StrainDiff` interface
   - Removed `stagingEnvironment` selector (no longer needed)

2. **ApiComparisonDashboard.tsx** - Updated UI:
   - Changed from 2-column to 3-column responsive grid
   - Added third `EnvironmentPanel` for Railway with purple styling
   - Updated summary footer to show counts for all 3 environments
   - Updated `SummaryComparison` table with Railway column
   - Updated `StrainsComparisonTable` with Railway price column
   - Removed environment selector dropdown

### New Layout

```
+------------------+------------------+------------------+
|   Production     |  Staging (API)   |  Railway (Dev)   |
|   api.drgreen    |  stage-api       |  railway.app     |
|   [🟢 green]     |  [🟠 orange]     |  [🟣 purple]     |
+------------------+------------------+------------------+
```

### Testing

Navigate to `/admin` → API Comparison Dashboard to verify all three environments load simultaneously.

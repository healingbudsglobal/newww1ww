

# Fix Client List Flickering in AdminClientManager

## Problem Summary

The client list in the Admin Dashboard flickers (shows skeleton loaders) every time the user:
- Switches between tabs (All/Pending/Verified/Rejected)
- Performs a search
- Changes filters

This happens because the `fetchData` callback is recreated when state changes, triggering the `useEffect` to re-run and setting `loading` to `true`, which displays skeleton placeholders.

---

## Root Cause

```text
User clicks tab → filter state changes
       ↓
fetchData recreated (filter in deps)
       ↓
useEffect([fetchData]) runs
       ↓
setLoading(true) → Skeletons shown
       ↓
API response arrives
       ↓
setLoading(false) → Content shown
       ↓
= VISUAL FLICKER
```

---

## Solution: Separate Initial Load from Refetch

Instead of reusing `loading` for both initial load and filter changes, we introduce a smarter loading strategy:

1. **Initial load only** uses the `loading` state (shows skeletons)
2. **Filter/tab changes** use a `isRefetching` state (shows subtle overlay or no change)
3. **Manual refresh** uses `refreshing` state (spinner on button only)

---

## Implementation Details

### 1. Add a "refetching" state for non-blocking updates

```typescript
const [loading, setLoading] = useState(true);      // Initial load only
const [refreshing, setRefreshing] = useState(false); // Manual refresh button
const [isRefetching, setIsRefetching] = useState(false); // Tab/filter changes
```

### 2. Track if initial load is complete

```typescript
const [initialLoadComplete, setInitialLoadComplete] = useState(false);
```

### 3. Update fetchData logic

```typescript
const fetchData = useCallback(async (options?: { showToast?: boolean; isInitialLoad?: boolean }) => {
  const { showToast = false, isInitialLoad = false } = options || {};
  
  if (showToast) {
    setRefreshing(true);
  } else if (isInitialLoad) {
    setLoading(true);
  } else {
    // Filter/tab change - don't show full loading state
    setIsRefetching(true);
  }
  
  // ... fetch logic ...
  
  setLoading(false);
  setRefreshing(false);
  setIsRefetching(false);
  setInitialLoadComplete(true);
}, [/* stable deps only: getDappClients, getClientsSummary, toast */]);
```

### 4. Fix useEffect to only run on initial load

```typescript
// Initial load effect - runs once
useEffect(() => {
  fetchData({ isInitialLoad: true });
}, []); // Empty deps - only on mount

// Filter change effect - doesn't show loading state
useEffect(() => {
  if (initialLoadComplete) {
    fetchData(); // No isInitialLoad = uses isRefetching
  }
}, [filter, searchQuery]);
```

### 5. Optional: Show subtle loading indicator for refetching

Instead of skeletons, show a subtle opacity change or spinner overlay:

```typescript
{/* Client List */}
<div className={cn(
  "transition-opacity duration-200",
  isRefetching && "opacity-60 pointer-events-none"
)}>
  <ScrollArea>
    {clients.map(...)}
  </ScrollArea>
</div>
```

---

## Visual Behavior After Fix

| Action | Before | After |
|--------|--------|-------|
| Initial page load | Skeletons → Content | Skeletons → Content (unchanged) |
| Switch tabs | Skeletons → Content (flicker) | Content stays, subtle fade |
| Search | Skeletons → Content (flicker) | Content stays, subtle fade |
| Refresh button | Spinner + Skeletons | Spinner only, content stays |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AdminClientManager.tsx` | Add `isRefetching` and `initialLoadComplete` states, refactor `fetchData` and effects |

---

## Alternative Approach: Optimistic UI

If preferred, we can also implement optimistic filtering where:
- Tab switches instantly filter the existing data client-side
- Background refetch updates the data silently
- Only show loading on initial mount

This would eliminate all perceived loading during navigation.

---

## Technical Notes

- The `useCallback` dependency array should only include stable references (API hooks) to prevent unnecessary recreation
- Using `useRef` for tracking initial load would also work but state is clearer
- The filter and search logic can remain in `useCallback` if we don't include them in deps (using a ref instead)


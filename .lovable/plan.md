

# Fix AdminOrders Infinite Render Loop (Flickering)

## Problem

The `/admin/orders` page flickers with the console error: **"Maximum update depth exceeded"**. This is caused by an infinite re-render loop.

## Root Cause

In `useAdminOrderSync.ts` (line 610-613), `fetchOrders` is defined as an inline arrow function:

```text
fetchOrders: async (filters) => {
  const result = await fetchAllOrders(filters);
  return result;
},
```

This creates a **new function reference on every render**. In `AdminOrders.tsx`, `handleFilterChange` is a `useCallback` that lists `fetchOrders` as a dependency. Since `fetchOrders` changes every render, `handleFilterChange` also changes every render, which triggers the `useEffect` hooks that depend on it, causing state updates (`setOrders`, `setIsFiltering`), which trigger another render -- creating an infinite loop.

## Fix

### 1. Stabilize `fetchOrders` in `useAdminOrderSync.ts`

Replace the inline arrow function with a proper `useCallback`-wrapped reference:

```text
// Before (line 610-613): recreated every render
fetchOrders: async (filters: OrderFilters) => {
  const result = await fetchAllOrders(filters);
  return result;
},

// After: stable reference
fetchOrders: fetchAllOrders,  // fetchAllOrders is already useCallback with [] deps
```

Since `fetchAllOrders` is already wrapped in `useCallback` with `[]` dependencies, simply returning it directly gives `fetchOrders` a stable identity across renders.

### 2. No changes needed in `AdminOrders.tsx`

Once `fetchOrders` is stable, the existing `handleFilterChange` and its dependent `useEffect` hooks will stop re-firing unnecessarily. The flickering stops.

## Files Modified

- `src/hooks/useAdminOrderSync.ts` -- replace inline `fetchOrders` wrapper with stable `fetchAllOrders` reference (1 line change)


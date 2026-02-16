

## Add Automatic Sync with Instant Dashboard Refresh

### What This Does
Adds a "Sync Now" button to the Admin Dashboard that triggers the `sync-clients` backend function (which pulls all client data from the Dr. Green API), then immediately refreshes the dashboard stats and recent activity. Also makes the existing background auto-sync (every 5 minutes) automatically refresh the dashboard after each cycle.

### Changes

**1. Update `src/hooks/useDrGreenAutoSync.ts`**
- Add a return value: expose `syncAllClients` and `lastSync` so the dashboard can call it on demand and show last sync time.
- Add an optional `onComplete` callback parameter so the dashboard can refresh after each auto-sync cycle completes.

**2. Update `src/pages/AdminDashboard.tsx`**
- Import and use the updated `useDrGreenAutoSync` hook.
- Replace the existing "Sync Client Data" quick-action button with a prominent "Sync Now" button in the top bar (next to Refresh).
- When "Sync Now" is clicked: invoke the sync function, show a loading spinner, then call `fetchStats()` and `fetchRecentActivity()` to refresh all dashboard data.
- Display a "Last synced X ago" indicator next to the Sync button.
- After each background auto-sync cycle, automatically refresh dashboard stats (via the `onComplete` callback).

### Technical Details

**`useDrGreenAutoSync.ts`** will return:
```typescript
{
  syncNow: () => Promise<void>,
  syncing: boolean,
  lastSync: Date | null,
}
```

**Dashboard top bar** will change from just "Refresh" to:
- "Sync Now" button (calls edge function then refreshes stats)
- "Refresh" button (just re-reads local DB)
- Last sync timestamp badge

The existing "Sync Client Data" button in Quick Actions will be removed since it is replaced by the top-bar Sync Now button.


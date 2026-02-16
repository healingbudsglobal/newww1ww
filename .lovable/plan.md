

## Dashboard KPIs from Dr. Green API + Expandable Client Detail Records

### Part 1: Dashboard KPIs from Dr. Green API

**Problem**: `fetchStats()` in `AdminDashboard.tsx` only queries local `drgreen_clients` and `drgreen_orders` tables. Even though the sync keeps these updated, the KPIs should also attempt to pull live numbers from the Dr. Green API (`getClientsSummary`) as the primary source, falling back to local DB if the API is unavailable.

**Changes to `src/pages/AdminDashboard.tsx`**:
- In `fetchStats()`, call `getClientsSummary()` first (same as `AdminClientManager` does)
- If it returns data, use `summary.totalCount`, `summary.PENDING`, `summary.VERIFIED`, `summary.REJECTED` for the KPI cards
- If the API call fails (401/timeout), fall back to local DB counts as currently implemented
- Also attempt `getDappClients({ take: 1 })` to get the real total from the API's pagination metadata if the summary endpoint fails
- This ensures the dashboard always shows Dr. Green's live numbers when available

### Part 2: Expandable Client Detail Record

**Problem**: Clicking a client row in `AdminClientManager` currently only opens a dropdown menu or expands a shipping address panel. There is no full client detail view -- you cannot see KYC status details, order history, medical record flags, or contact details in one place.

**Changes to `src/components/admin/AdminClientManager.tsx`**:

- Make the entire client row clickable (not just the dropdown). Clicking expands a detailed record panel below the row.
- The expanded panel will show:
  - **Identity section**: Full name, email, phone, client ID (copyable), registration date
  - **Status section**: KYC verified badge, admin approval status, account linked status (has local user_id or not)
  - **Shipping address**: Current address on file (fetched from Dr. Green API via `getDappClientDetails`)
  - **Action buttons**: Sync Status, Re-Register, Copy ID, View in Dr. Green Portal, Edit Address (inline form)
- Replace the current address-only expand with this richer detail view
- Add smooth expand/collapse animation (already using framer-motion `AnimatePresence`)
- On mobile, the detail panel stacks vertically with the same sections

**UX Improvements**:
- Add a subtle chevron indicator on each row showing it is expandable
- Highlight the active/expanded row with a border accent
- Add a "linked" vs "unlinked" indicator showing whether the Dr. Green client has a local Healing Buds account
- Show the client's order count if available from the detail fetch
- Improve the mobile card layout: move the status badge below the name instead of cramming it beside the dropdown

### Technical Details

**`AdminDashboard.tsx` changes**:
```
fetchStats() {
  // 1. Try Dr. Green API summary
  const summaryResult = await getClientsSummary();
  if (summaryResult.data?.summary) {
    use summary.totalCount, PENDING, VERIFIED, REJECTED
  }
  // 2. Fallback to local DB
  else {
    query drgreen_clients as before
  }
  // Orders: always from local DB (synced)
}
```

**`AdminClientManager.tsx` changes**:
- Rename `expandedClientId` usage from address-only to full detail panel
- When a client row is clicked, toggle `expandedClientId`
- In the expanded section, fetch `getDappClientDetails(clientId)` to get full details including shipping
- Render a 2-column grid (desktop) or stacked layout (mobile) with identity, status, address, and actions
- Add a chevron rotation indicator on each row
- Keep the 3-dot dropdown menu for quick actions, but the row click now opens the detail panel

**No new files needed** -- all changes are within existing components.


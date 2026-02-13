
# Autonomous Data Sync -- Self-Managing Platform

## Problem
1. **Strains table was empty** because the `sync-strains` function only runs when manually triggered. There is no automatic initialization.
2. **No users in the database** because real clients exist on the Dr. Green API (not locally). When a user signs up/logs in, the system should auto-discover their Dr. Green profile (this part already works via `linkClientFromDrGreenByAuthEmail`).
3. **All clients are real patients** -- there are no test accounts. The system must treat every record as production data.

## What Already Works
- `sync-strains` edge function: fetches from Dr. Green API and upserts to `strains` table (just tested -- 7 strains synced successfully)
- `ShopContext` auto-discovery: on login, it checks Dr. Green API for the user's email and links their client record
- `useProducts` hook: fetches strains live from Dr. Green API (not from local DB) for the shop page
- Background polling for verification status changes

## What Needs to Change

### 1. Auto-Sync Strains on App Initialization
Add a lightweight check in `ShopProvider` (or a new hook) that runs once on app load:
- Query local `strains` table count
- If empty (or stale -- older than 24 hours), call `sync-strains` edge function automatically
- This ensures the shop always has data without manual intervention

### 2. Periodic Background Strain Sync
Create a scheduled sync mechanism:
- Add a `useEffect` in `ShopProvider` that calls `sync-strains` every 6 hours while the app is open
- This keeps stock levels, availability, and new strains up to date
- Only runs if the user is on the shop page or the app is active

### 3. Sync on Shop Page Load (Freshness Guarantee)
In `useProducts` hook, after fetching from the API for display, trigger a background `sync-strains` call to keep the local DB in sync (for admin views, order history references, etc.). This is non-blocking -- the UI shows API data immediately.

### 4. Client Auto-Link on Auth (Already Working)
No changes needed. The existing `linkClientFromDrGreenByAuthEmail` in `ShopContext` already:
- Checks Dr. Green API by email on login
- Creates local `drgreen_clients` record if found
- Syncs KYC and admin approval status

## Technical Details

### Files to Modify

**`src/context/ShopContext.tsx`**
- Add a `useEffect` that runs once on mount to check strain freshness
- If `strains` table is empty or last sync > 24h ago, invoke `sync-strains`
- Add a 6-hour interval for background re-sync

**`src/hooks/useProducts.ts`**
- After successfully fetching from Dr. Green API, trigger a non-blocking `sync-strains` call to keep local DB current
- Add a "last synced" timestamp check using `localStorage` to avoid excessive sync calls (max once per hour)

**`supabase/functions/sync-strains/index.ts`**
- Add multi-country support: sync strains for all active countries (ZAF, PRT, GBR, THA) in a single call
- Add a `freshness` mode: accept a `skipIfFresh` parameter that checks the latest `updated_at` in strains table and skips if recent

### Flow Diagram

```text
App Loads
  |
  v
ShopProvider mounts
  |
  +---> Check strains freshness (local DB)
  |       |
  |       +-- Empty or stale? --> Call sync-strains (background)
  |       +-- Fresh? --> Skip
  |
  +---> Auth state change (login)
  |       |
  |       +-- Check Dr. Green API for client by email
  |       +-- Link/create local drgreen_clients record
  |       +-- Sync KYC + approval status
  |
  v
Shop Page Loads
  |
  +---> useProducts fetches live from Dr. Green API (immediate display)
  +---> Background: sync-strains updates local DB (non-blocking)
```

### What This Achieves
- **Zero manual intervention**: strains sync automatically on first visit and stay fresh
- **Real client data integrity**: no fake/test data ever created -- all records come from Dr. Green API
- **Self-healing**: if the local DB gets wiped or falls behind, it auto-recovers on next app load
- **No scheduled cron needed**: sync is triggered by user activity (app load, shop visit) with freshness guards to prevent over-calling

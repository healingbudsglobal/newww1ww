import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes for near-real-time sync

/**
 * Background sync hook for admin users.
 * Calls the server-side sync-clients edge function which:
 * - Fetches all clients from Dr. Green API
 * - Matches them to auth users by email (server-side, can query auth.users)
 * - Upserts into drgreen_clients table
 * Runs once on mount and every 5 minutes.
 */
export function useDrGreenAutoSync() {
  const { isAdmin } = useUserRole();
  const lastSyncRef = useRef<Date | null>(null);
  const syncingRef = useRef(false);

  const syncAllClients = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      console.log('[AutoSync] Starting server-side client sync...');

      const { data, error } = await supabase.functions.invoke('sync-clients');

      if (error) {
        console.warn('[AutoSync] Sync failed:', error);
        return;
      }

      lastSyncRef.current = new Date();
      console.log(`[AutoSync] Complete:`, data);
    } catch (err) {
      console.error('[AutoSync] Error:', err);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Initial sync
    syncAllClients();

    // Periodic sync
    const interval = setInterval(syncAllClients, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAdmin, syncAllClients]);
}

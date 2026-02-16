import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface AutoSyncOptions {
  onComplete?: () => void;
}

/**
 * Background sync hook for admin users.
 * Calls the server-side sync-clients edge function which:
 * - Fetches all clients from Dr. Green API
 * - Matches them to auth users by email (server-side)
 * - Upserts into drgreen_clients table
 * Runs once on mount and every 5 minutes.
 * Returns syncNow, syncing, and lastSync for dashboard use.
 */
export function useDrGreenAutoSync(options?: AutoSyncOptions) {
  const { isAdmin } = useUserRole();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const syncingRef = useRef(false);
  const onCompleteRef = useRef(options?.onComplete);

  // Keep callback ref fresh
  onCompleteRef.current = options?.onComplete;

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      console.log('[AutoSync] Starting server-side client sync...');
      const { data, error } = await supabase.functions.invoke('sync-clients');

      if (error) {
        console.warn('[AutoSync] Sync failed:', error);
        return;
      }

      setLastSync(new Date());
      console.log('[AutoSync] Complete:', data);

      // Notify caller so they can refresh dashboard data
      onCompleteRef.current?.();
    } catch (err) {
      console.error('[AutoSync] Error:', err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Initial sync
    syncNow();

    // Periodic sync
    const interval = setInterval(syncNow, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAdmin, syncNow]);

  return { syncNow, syncing, lastSync };
}

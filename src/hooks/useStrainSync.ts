import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SYNC_STORAGE_KEY = 'hb_strain_last_sync';
const FRESHNESS_HOURS = 24;
const BACKGROUND_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getLastSyncTime(): number {
  try {
    return parseInt(localStorage.getItem(SYNC_STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function setLastSyncTime() {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable
  }
}

async function triggerSync() {
  console.log('[StrainSync] Triggering background strain sync...');
  try {
    const { data, error } = await supabase.functions.invoke('sync-strains', {
      body: { multiCountry: true },
    });
    if (error) {
      console.error('[StrainSync] Sync error:', error);
    } else {
      console.log('[StrainSync] Sync complete:', data);
      setLastSyncTime();
    }
  } catch (err) {
    console.error('[StrainSync] Sync failed:', err);
  }
}

/**
 * Hook that ensures the local strains DB stays in sync with the Dr Green API.
 * - On mount: checks if strains table is empty or stale (>24h), triggers sync if needed
 * - Runs a 6-hour background interval while the app is open
 */
export function useStrainSync() {
  const syncTriggered = useRef(false);

  useEffect(() => {
    if (syncTriggered.current) return;
    syncTriggered.current = true;

    const checkAndSync = async () => {
      const lastSync = getLastSyncTime();
      const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);

      if (hoursSinceSync < FRESHNESS_HOURS && lastSync > 0) {
        console.log(`[StrainSync] Strains fresh (synced ${hoursSinceSync.toFixed(1)}h ago), skipping`);
        return;
      }

      // Double-check: query local DB count
      const { count } = await supabase
        .from('strains')
        .select('*', { count: 'exact', head: true });

      if ((count ?? 0) > 0 && hoursSinceSync < FRESHNESS_HOURS) {
        console.log(`[StrainSync] ${count} strains in DB, still fresh`);
        setLastSyncTime();
        return;
      }

      console.log(`[StrainSync] Strains stale or empty (count=${count}, hours=${hoursSinceSync.toFixed(1)}), syncing...`);
      await triggerSync();
    };

    checkAndSync();

    // Background interval every 6 hours
    const interval = setInterval(() => {
      console.log('[StrainSync] Periodic background sync...');
      triggerSync();
    }, BACKGROUND_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}

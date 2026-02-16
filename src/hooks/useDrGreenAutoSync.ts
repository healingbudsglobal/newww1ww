import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Background sync hook for admin users.
 * Fetches all clients from the Dr. Green API and updates the local drgreen_clients table.
 * Runs once on mount and every 15 minutes.
 */
export function useDrGreenAutoSync() {
  const { isAdmin } = useUserRole();
  const lastSyncRef = useRef<Date | null>(null);
  const syncingRef = useRef(false);

  const syncAllClients = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      console.log('[AutoSync] Starting admin background client sync...');

      // Paginate through all Dr. Green clients
      let page = 1;
      const take = 50;
      let totalSynced = 0;
      let totalUpdated = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('drgreen-proxy', {
          body: { action: 'dapp-clients', page, take, orderBy: 'desc' },
        });

        if (error || !data?.clients) {
          console.warn('[AutoSync] Failed to fetch page', page, error || data);
          break;
        }

        const clients = data.clients as Array<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          isKYCVerified: boolean;
          adminApproval: string;
          phoneCountryCode?: string;
          shippings?: Array<{ country: string }>;
        }>;

        if (clients.length === 0) {
          hasMore = false;
          break;
        }

        // Upsert each client into drgreen_clients by drgreen_client_id
        for (const client of clients) {
          const countryCode = client.shippings?.[0]?.country || client.phoneCountryCode || 'PT';

          // Check if record exists
          const { data: existing } = await supabase
            .from('drgreen_clients')
            .select('id, is_kyc_verified, admin_approval, user_id')
            .eq('drgreen_client_id', client.id)
            .maybeSingle();

          if (existing) {
            // Update if status changed
            if (
              existing.is_kyc_verified !== client.isKYCVerified ||
              existing.admin_approval !== client.adminApproval
            ) {
              await supabase
                .from('drgreen_clients')
                .update({
                  is_kyc_verified: client.isKYCVerified,
                  admin_approval: client.adminApproval,
                  email: client.email,
                  full_name: `${client.firstName} ${client.lastName}`.trim(),
                  country_code: countryCode,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
              totalUpdated++;
            }
            totalSynced++;
          } else {
            // Try to match by email to a Supabase auth user
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .ilike('full_name', `%${client.firstName}%`)
              .maybeSingle();

            // Also try matching via auth email lookup — but we can't query auth.users from client
            // So we just log unlinked clients for now
            if (profile) {
              await supabase.from('drgreen_clients').insert({
                user_id: profile.id,
                drgreen_client_id: client.id,
                is_kyc_verified: client.isKYCVerified,
                admin_approval: client.adminApproval,
                email: client.email,
                full_name: `${client.firstName} ${client.lastName}`.trim(),
                country_code: countryCode,
              });
              totalSynced++;
            } else {
              console.log(`[AutoSync] Unlinked client: ${client.email} (no matching profile)`);
            }
          }
        }

        hasMore = clients.length === take;
        page++;
        if (page > 20) break; // Safety limit
      }

      lastSyncRef.current = new Date();
      console.log(`[AutoSync] Complete: ${totalSynced} synced, ${totalUpdated} updated`);
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

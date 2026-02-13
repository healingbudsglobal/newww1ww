import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all clients from local DB
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: clients, error: fetchError } = await serviceClient
      .from('drgreen_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch clients: ${fetchError.message}`);
    }

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No clients to process',
        summary: { total: 0, succeeded: 0, failed: 0, skipped: 0 },
        results: [],
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark all as pending
    await serviceClient
      .from('drgreen_clients')
      .update({ rehome_status: 'pending' })
      .in('id', clients.map(c => c.id));

    const results: Array<{
      clientId: string;
      email: string;
      status: 'success' | 'failed' | 'skipped';
      oldId?: string;
      newId?: string;
      error?: string;
    }> = [];

    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 2000;

    // Get the proxy URL for calling admin-reregister-client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const proxyUrl = `${supabaseUrl}/functions/v1/drgreen-proxy`;

    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (client) => {
        try {
          // First, check if the client ID is actually broken by calling get-client
          // If it works fine, skip re-homing
          const checkResp = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              action: 'get-client',
              clientId: client.drgreen_client_id,
            }),
          });

          if (checkResp.ok) {
            const checkData = await checkResp.json();
            // If we got valid data back, the client is fine — skip
            if (checkData && !checkData.error) {
              await serviceClient
                .from('drgreen_clients')
                .update({ rehome_status: 'none' })
                .eq('id', client.id);

              results.push({
                clientId: client.drgreen_client_id,
                email: client.email || '',
                status: 'skipped',
              });
              return;
            }
          }

          // Client ID is broken — re-register
          const nameParts = (client.full_name || '').split(' ');
          const firstName = nameParts[0] || 'Unknown';
          const lastName = nameParts.slice(1).join(' ') || 'Patient';

          const shipping = client.shipping_address as Record<string, string> | null;

          const reregResp = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              action: 'admin-reregister-client',
              email: client.email,
              firstName,
              lastName,
              countryCode: client.country_code || 'ZAF',
              shipping: shipping || undefined,
            }),
          });

          const reregData = await reregResp.json();

          if (reregData.success && reregData.clientId) {
            // Update local record with re-homing tracking
            const apiKey = Deno.env.get('DRGREEN_API_KEY') || '';
            await serviceClient
              .from('drgreen_clients')
              .update({
                old_drgreen_client_id: client.drgreen_client_id,
                drgreen_client_id: reregData.clientId,
                kyc_link: reregData.kycLink || null,
                rehome_status: 'success',
                rehome_error: null,
                rehomed_at: new Date().toISOString(),
                api_key_scope: apiKey.slice(0, 8),
                is_kyc_verified: false,
                admin_approval: 'PENDING',
                updated_at: new Date().toISOString(),
              })
              .eq('id', client.id);

            results.push({
              clientId: client.drgreen_client_id,
              email: client.email || '',
              status: 'success',
              oldId: client.drgreen_client_id,
              newId: reregData.clientId,
            });
          } else {
            const errMsg = reregData.error || 'Unknown re-registration error';
            await serviceClient
              .from('drgreen_clients')
              .update({
                rehome_status: 'failed',
                rehome_error: errMsg,
                updated_at: new Date().toISOString(),
              })
              .eq('id', client.id);

            results.push({
              clientId: client.drgreen_client_id,
              email: client.email || '',
              status: 'failed',
              error: errMsg,
            });
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          await serviceClient
            .from('drgreen_clients')
            .update({
              rehome_status: 'failed',
              rehome_error: errMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', client.id);

          results.push({
            clientId: client.drgreen_client_id,
            email: client.email || '',
            status: 'failed',
            error: errMsg,
          });
        }
      });

      await Promise.all(batchPromises);

      // Delay between batches (except after the last batch)
      if (i + BATCH_SIZE < clients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    const summary = {
      total: results.length,
      succeeded: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };

    console.log('[drgreen-rehome] Complete:', JSON.stringify(summary));

    return new Response(JSON.stringify({
      success: true,
      message: `Batch re-homing complete: ${summary.succeeded} succeeded, ${summary.failed} failed, ${summary.skipped} skipped`,
      summary,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[drgreen-rehome] Error:', message);
    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.1.0";
import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256";
import { hmac } from "https://esm.sh/@noble/hashes@1.4.0/hmac";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Initialize secp256k1
secp256k1.etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  for (const msg of messages) h.update(msg);
  return h.digest();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = "https://api.drgreennft.com/api/v1";

function extractRawPrivateKey(base64Key: string): Uint8Array {
  const decoded = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  // PKCS8 DER: raw 32-byte key is typically at the end
  if (decoded.length > 32) {
    // Look for the octet string tag (0x04, 0x20) that precedes the 32-byte key
    for (let i = 0; i < decoded.length - 33; i++) {
      if (decoded[i] === 0x04 && decoded[i + 1] === 0x20) {
        return decoded.slice(i + 2, i + 34);
      }
    }
    // Fallback: last 32 bytes
    return decoded.slice(decoded.length - 32);
  }
  return decoded;
}

function signPayload(payload: string, privateKeyBase64: string): string {
  const rawKey = extractRawPrivateKey(privateKeyBase64);
  const msgHash = sha256(new TextEncoder().encode(payload));
  const signature = secp256k1.sign(msgHash, rawKey);
  const derSig = signature.toDERRawBytes();
  return base64Encode(derSig);
}

async function drGreenGet(path: string, queryParams: Record<string, string | number>, apiKey: string, privateKey: string): Promise<Response> {
  const qs = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  
  const signature = signPayload(qs, privateKey);
  const url = `${API_BASE}${path}?${qs}`;
  
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-apikey': apiKey,
      'x-auth-signature': signature,
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check - admin only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API credentials
    const apiKey = Deno.env.get('DRGREEN_API_KEY')!;
    const privateKey = Deno.env.get('DRGREEN_PRIVATE_KEY')!;

    // Fetch ALL auth users (service role can do this)
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const emailToUserId = new Map<string, string>();
    for (const u of authUsers || []) {
      if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
    }

    console.log(`[SyncClients] Found ${emailToUserId.size} auth users`);

    // Paginate through Dr. Green API clients
    let page = 1;
    const take = 50;
    let totalSynced = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalUnlinked = 0;
    let hasMore = true;

    while (hasMore) {
      const resp = await drGreenGet('/dapp/clients', { page, take, orderBy: 'desc' }, apiKey, privateKey);
      
      if (!resp.ok) {
        console.error(`[SyncClients] API error page ${page}:`, resp.status);
        break;
      }

      const json = await resp.json() as { data?: { clients?: Array<Record<string, unknown>> } };
      const clients = json.data?.clients || [];

      if (clients.length === 0) {
        hasMore = false;
        break;
      }

      for (const client of clients) {
        const clientId = client.id as string;
        const email = (client.email as string || '').toLowerCase();
        const firstName = client.firstName as string || '';
        const lastName = client.lastName as string || '';
        const isKYCVerified = client.isKYCVerified as boolean || false;
        const adminApproval = client.adminApproval as string || 'PENDING';
        const shippings = client.shippings as Array<{ country?: string }> || [];
        const phoneCountryCode = client.phoneCountryCode as string || '';
        const countryCode = shippings[0]?.country || phoneCountryCode || 'PT';

        // Check if already in drgreen_clients
        const { data: existing } = await adminClient
          .from('drgreen_clients')
          .select('id, is_kyc_verified, admin_approval, user_id')
          .eq('drgreen_client_id', clientId)
          .maybeSingle();

        if (existing) {
          // Update if status changed
          if (existing.is_kyc_verified !== isKYCVerified || existing.admin_approval !== adminApproval) {
            await adminClient
              .from('drgreen_clients')
              .update({
                is_kyc_verified: isKYCVerified,
                admin_approval: adminApproval,
                email,
                full_name: `${firstName} ${lastName}`.trim(),
                country_code: countryCode,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
            totalUpdated++;
          }
          totalSynced++;
        } else {
          // Match by email to auth user
          const userId = emailToUserId.get(email);
          if (userId) {
            // Check if this user already has a drgreen_clients record
            const { data: userExisting } = await adminClient
              .from('drgreen_clients')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();

            if (userExisting) {
              // Update existing record with this client ID
              await adminClient
                .from('drgreen_clients')
                .update({
                  drgreen_client_id: clientId,
                  is_kyc_verified: isKYCVerified,
                  admin_approval: adminApproval,
                  email,
                  full_name: `${firstName} ${lastName}`.trim(),
                  country_code: countryCode,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userExisting.id);
              totalUpdated++;
            } else {
              await adminClient
                .from('drgreen_clients')
                .insert({
                  user_id: userId,
                  drgreen_client_id: clientId,
                  is_kyc_verified: isKYCVerified,
                  admin_approval: adminApproval,
                  email,
                  full_name: `${firstName} ${lastName}`.trim(),
                  country_code: countryCode,
                });
              totalCreated++;
            }
            totalSynced++;
          } else {
            totalUnlinked++;
            console.log(`[SyncClients] Unlinked: ${email} (no auth user)`);
          }
        }
      }

      hasMore = clients.length === take;
      page++;
      if (page > 20) break;
    }

    const result = {
      success: true,
      synced: totalSynced,
      created: totalCreated,
      updated: totalUpdated,
      unlinked: totalUnlinked,
      syncedAt: new Date().toISOString(),
    };

    console.log(`[SyncClients] Complete:`, result);

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[SyncClients] Error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

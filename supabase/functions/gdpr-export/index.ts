import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user ID from token
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub;
      } else {
        const { data: { user }, error } = await supabaseClient.auth.getUser(token);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid authentication token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userId = user.id;
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to bypass RLS (we control the user_id filter)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all user data in parallel
    const [profileRes, clientRes, ordersRes, dosageRes] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', userId).maybeSingle(),
      adminClient.from('drgreen_clients').select('*').eq('user_id', userId).maybeSingle(),
      adminClient.from('drgreen_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminClient.from('dosage_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      profile: profileRes.data || null,
      drGreenClient: clientRes.data
        ? {
            ...clientRes.data,
            // Redact internal IDs not meaningful to the user
            id: undefined,
          }
        : null,
      orders: (ordersRes.data || []).map(o => ({
        ...o,
        id: undefined, // internal UUID
      })),
      dosageLogs: (dosageRes.data || []).map(d => ({
        ...d,
        id: undefined,
      })),
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="healing-buds-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      }
    );
  } catch (err) {
    console.error('[GDPR Export] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[MIGRATE] Starting external client migration...');

    // External Supabase credentials (source) - using service role key to bypass RLS
    const externalUrl = "https://texrwjjwrkvhdfjemnf.supabase.co";
    const externalServiceKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY');
    
    if (!externalServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'EXTERNAL_SUPABASE_SERVICE_KEY not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Current project credentials (destination)
    const currentUrl = Deno.env.get('SUPABASE_URL')!;
    const currentServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create clients - using service role keys to bypass RLS on both ends
    const externalClient = createClient(externalUrl, externalServiceKey);
    const currentClient = createClient(currentUrl, currentServiceKey);

    console.log('[MIGRATE] Fetching clients from external project...');

    // First, try to diagnose what data exists
    // Check profiles table first as a connectivity test
    const { data: profileTest, error: profileTestError } = await externalClient
      .from('profiles')
      .select('id, full_name')
      .limit(5);
    
    console.log('[MIGRATE] Profile test result:', { 
      found: profileTest?.length || 0, 
      error: profileTestError?.message 
    });

    // Fetch all drgreen_clients from external project
    const { data: externalClients, error: fetchError } = await externalClient
      .from('drgreen_clients')
      .select('*');

    if (fetchError) {
      console.error('[MIGRATE] Error fetching external clients:', fetchError);
      
      // Check if the table doesn't exist
      if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01') {
        // Try alternative table names
        console.log('[MIGRATE] drgreen_clients table not found, checking alternatives...');
        
        // Check for 'clients' table
        const { data: altClients, error: altError } = await externalClient
          .from('clients')
          .select('*');
        
        if (altClients && altClients.length > 0) {
          console.log(`[MIGRATE] Found ${altClients.length} clients in 'clients' table`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Table name mismatch',
              message: `Found 'clients' table with ${altClients.length} records instead of 'drgreen_clients'`,
              sampleClient: altClients[0]
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch from external project',
          details: fetchError.message,
          code: fetchError.code
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[MIGRATE] Found ${externalClients?.length || 0} clients in external project`);

    if (!externalClients || externalClients.length === 0) {
      // Check if there are profiles but no clients
      const { data: allProfiles } = await externalClient.from('profiles').select('*');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No clients found in external project drgreen_clients table',
          migrated: 0,
          diagnostics: {
            profilesFound: allProfiles?.length || 0,
            tableChecked: 'drgreen_clients'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the clients we found
    for (const client of externalClients) {
      console.log(`[MIGRATE] External client: ${client.full_name || client.email} - KYC: ${client.is_kyc_verified}, Approval: ${client.admin_approval}`);
    }

    // Upsert clients into current project (using drgreen_client_id as conflict key)
    const { data: upsertedClients, error: upsertError } = await currentClient
      .from('drgreen_clients')
      .upsert(
        externalClients.map(client => ({
          id: client.id,
          user_id: client.user_id,
          drgreen_client_id: client.drgreen_client_id,
          country_code: client.country_code || 'PT',
          is_kyc_verified: client.is_kyc_verified,
          admin_approval: client.admin_approval,
          kyc_link: client.kyc_link,
          email: client.email,
          full_name: client.full_name,
          created_at: client.created_at,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'drgreen_client_id' }
      )
      .select();

    if (upsertError) {
      console.error('[MIGRATE] Error upserting clients:', upsertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to upsert clients',
          details: upsertError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[MIGRATE] Successfully migrated ${upsertedClients?.length || externalClients.length} clients`);

    // Also fetch and migrate profiles if they exist
    const { data: externalProfiles, error: profileFetchError } = await externalClient
      .from('profiles')
      .select('*');

    let profilesMigrated = 0;
    if (externalProfiles && externalProfiles.length > 0) {
      console.log(`[MIGRATE] Found ${externalProfiles.length} profiles in external project`);
      
      const { error: profileUpsertError } = await currentClient
        .from('profiles')
        .upsert(
          externalProfiles.map(profile => ({
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            preferences: profile.preferences,
            created_at: profile.created_at,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' }
        );

      if (!profileUpsertError) {
        profilesMigrated = externalProfiles.length;
        console.log(`[MIGRATE] Successfully migrated ${profilesMigrated} profiles`);
      } else {
        console.warn('[MIGRATE] Profile migration warning:', profileUpsertError.message);
      }
    }

    // Also migrate user_roles if they exist
    const { data: externalRoles, error: roleFetchError } = await externalClient
      .from('user_roles')
      .select('*');

    let rolesMigrated = 0;
    if (externalRoles && externalRoles.length > 0) {
      console.log(`[MIGRATE] Found ${externalRoles.length} user roles in external project`);
      
      const { error: roleUpsertError } = await currentClient
        .from('user_roles')
        .upsert(
          externalRoles.map(role => ({
            id: role.id,
            user_id: role.user_id,
            role: role.role,
            created_at: role.created_at
          })),
          { onConflict: 'id' }
        );

      if (!roleUpsertError) {
        rolesMigrated = externalRoles.length;
        console.log(`[MIGRATE] Successfully migrated ${rolesMigrated} user roles`);
      } else {
        console.warn('[MIGRATE] Role migration warning:', roleUpsertError.message);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migration completed successfully',
        clients: {
          found: externalClients.length,
          migrated: upsertedClients?.length || externalClients.length
        },
        profiles: {
          migrated: profilesMigrated
        },
        roles: {
          migrated: rolesMigrated
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[MIGRATE] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unexpected error during migration',
        details: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

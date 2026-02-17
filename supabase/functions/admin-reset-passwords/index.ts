import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { password } = await req.json();
    const newPassword = password || "12345678";

    // Get all users
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const user of users) {
      try {
        const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
        results.push({ email: user.email || user.id, success: !error, error: error?.message });
      } catch (err) {
        results.push({ email: user.email || user.id, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, results, totalUpdated: results.filter(r => r.success).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

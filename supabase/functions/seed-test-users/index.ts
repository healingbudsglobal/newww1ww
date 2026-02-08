import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Real user accounts - these will sync with Dr. Green API on login
const TEST_USERS = [
  {
    email: "healingbudsglobal@gmail.com",
    password: "H34l1ng@buds2025",
    fullName: "Admin",
    createClient: false,
    role: "admin",
  },
  // Real Dr. Green registered users - already verified in Dr. Green API
  {
    email: "scott.k1@outlook.com",
    password: "H34l1ng@buds2025",
    fullName: "Scott K",
    createClient: false, // Will sync from Dr. Green API
    role: null,
  },
  {
    email: "kayleigh.sm@gmail.com",
    password: "H34l1ng@buds2025",
    fullName: "Kayleigh SM",
    createClient: false, // Will sync from Dr. Green API
    role: null,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results: Array<{ email: string; status: string; userId?: string; error?: string }> = [];

    // First, delete any users that shouldn't exist (old test accounts)
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    const validEmails = TEST_USERS.map(u => u.email);
    
    for (const user of allUsers?.users || []) {
      if (!validEmails.includes(user.email || '')) {
        // Delete user that's not in our valid list
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`Deleted old user: ${user.email}`);
      }
    }

    for (const testUser of TEST_USERS) {
      try {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === testUser.email);

        let userId: string;

        if (existingUser) {
          const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            {
              password: testUser.password,
              email_confirm: true,
            }
          );
          if (updateError) throw updateError;
          userId = existingUser.id;
          console.log(`Updated existing user: ${testUser.email}`);
        } else {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
            user_metadata: { full_name: testUser.fullName },
          });
          if (createError) throw createError;
          userId = newUser.user.id;
          console.log(`Created new user: ${testUser.email}`);
        }

        // Upsert profile
        await supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, full_name: testUser.fullName }, { onConflict: "id" });

        // Delete any mock drgreen_clients record - force sync from real API
        await supabaseAdmin.from("drgreen_clients").delete().eq("user_id", userId);

        // Assign role if needed
        if (testUser.role) {
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: userId, role: testUser.role }, { onConflict: "user_id,role" });
        }

        results.push({ email: testUser.email, status: "success", userId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing ${testUser.email}:`, errorMessage);
        results.push({ email: testUser.email, status: "error", error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Seed error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

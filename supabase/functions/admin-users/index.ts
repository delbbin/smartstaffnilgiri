import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify calling user is admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role to check admin and perform operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await adminClient.rpc("is_admin", {
      user_uuid: userId,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case "create_user": {
        const { email, password, full_name, role, department, roll_number, phone } = payload;

        const { data: newUser, error: createErr } =
          await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });

        if (createErr) throw createErr;

        const { error: profileErr } = await adminClient
          .from("profiles")
          .insert({
            user_id: newUser.user.id,
            email,
            full_name,
            role,
            department: department || null,
            roll_number: roll_number || null,
            phone: phone || null,
          });

        if (profileErr) throw profileErr;

        // If staff role, also create staff_members entry
        if (role === "staff") {
          await adminClient.from("staff_members").insert({
            name: full_name,
            title: "Staff",
            email,
            department: department || "General",
            profile_id: null, // Will be linked after profile creation
          });
        }

        return new Response(
          JSON.stringify({ success: true, user_id: newUser.user.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_user": {
        const { profile_id, full_name, role, department, roll_number, phone } = payload;

        const { error } = await adminClient
          .from("profiles")
          .update({ full_name, role, department, roll_number, phone })
          .eq("id", profile_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        const { profile_id } = payload;

        // Get user_id from profile
        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("id", profile_id)
          .single();

        if (profile?.user_id) {
          await adminClient.auth.admin.deleteUser(profile.user_id);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_password": {
        const { profile_id, new_password } = payload;

        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("id", profile_id)
          .single();

        if (!profile?.user_id) throw new Error("User not found");

        const { error } = await adminClient.auth.admin.updateUserById(
          profile.user_id,
          { password: new_password }
        );

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Admin users error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

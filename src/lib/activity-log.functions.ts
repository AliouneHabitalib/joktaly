import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listActivityLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Accès refusé");

    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const logQuotaRefusal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ kind: z.enum(["devis", "facture"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: entreprise } = await supabaseAdmin
      .from("entreprises")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    const { error } = await supabaseAdmin.rpc("log_quota_refusal", {
      _user_id: userId,
      _entreprise_id: entreprise?.id ?? null,
      _kind: data.kind,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
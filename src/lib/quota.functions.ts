import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMonthStartISO } from "./quota-period";

export const getUserQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const { data: entreprise } = await supabase
      .from("entreprises")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: effective } = await supabase.rpc("effective_plan", { _user_id: userId });
    const monthStartStr = getMonthStartISO();

    let devisCount = 0;
    let facturesCount = 0;

    if (entreprise) {
      const [devisRes, facturesRes] = await Promise.all([
        supabase
          .from("devis")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entreprise.id)
          .gte("created_at", monthStartStr),
        supabase
          .from("factures")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entreprise.id)
          .gte("created_at", monthStartStr),
      ]);
      devisCount = devisRes.count ?? 0;
      facturesCount = facturesRes.count ?? 0;
    }

    return {
      plan: ((effective as string | null) ?? (profile?.plan as string) ?? "gratuit") as import("./plans").PlanType,
      devisCount,
      facturesCount,
    };
  });

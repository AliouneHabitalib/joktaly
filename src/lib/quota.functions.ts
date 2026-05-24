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

    const monthStartStr = getMonthStartISO();

    let devisCount = 0;
    let facturesCount = 0;

    if (entreprise) {
      const [devisRes, facturesRes] = await Promise.all([
        supabase
          .from("devis")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entreprise.id)
          .gte("date_emission", monthStartStr),
        supabase
          .from("factures")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", entreprise.id)
          .gte("date_emission", monthStartStr),
      ]);
      devisCount = devisRes.count ?? 0;
      facturesCount = facturesRes.count ?? 0;
    }

    return {
      plan: (profile?.plan as "gratuit" | "starter" | "pro" | "business") ?? "gratuit",
      devisCount,
      facturesCount,
    };
  });

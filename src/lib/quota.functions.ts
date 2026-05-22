import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().split("T")[0];

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
      plan: (profile?.plan as "starter" | "pro" | "business") ?? "starter",
      devisCount,
      facturesCount,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSubscriptionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: pending }] = await Promise.all([
      supabase.from("profiles").select("plan, plan_expires_at").eq("id", userId).maybeSingle(),
      (supabase as any)
        .from("abonnements")
        .select("id, plan, cycle, montant, statut, created_at")
        .eq("user_id", userId)
        .eq("statut", "en_attente")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const plan = (profile?.plan as string) ?? "gratuit";
    // Aucun prestataire de paiement : on ne bloque plus l'accès.
    const requiresPayment = false;

    return {
      plan,
      planExpiresAt: (profile as any)?.plan_expires_at ?? null,
      pending: pending
        ? {
            id: pending.id as string,
            plan: pending.plan as string,
            cycle: pending.cycle as string,
            montant: Number(pending.montant),
          }
        : null,
      requiresPayment,
    };
  });

/** Enregistre l'intention d'abonnement payant (bloque l'accès au dashboard). */
export const selectPaidPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { plan: string; cycle: string }) => data)
  .handler(async ({ data, context }) => {
    const { normalizePlan, normalizeCycle, chargedAmount, isPaidPlan } = await import("./pricing");
    const plan = normalizePlan(data.plan);
    if (!plan || !isPaidPlan(plan)) throw new Error("Plan invalide");
    const cycle = normalizeCycle(data.cycle);
    const montant = chargedAmount(plan, cycle);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: profile } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    if (profile?.plan && profile.plan !== "gratuit") {
      return { ok: true as const, alreadyActive: true as const };
    }

    const { data: existing } = await admin
      .from("abonnements")
      .select("id, plan, cycle")
      .eq("user_id", context.userId)
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.plan !== plan || existing.cycle !== cycle) {
        await admin
          .from("abonnements")
          .update({ plan, cycle, montant, provider_token: null })
          .eq("id", existing.id);
      }
      return { ok: true as const, alreadyActive: false as const };
    }

    await admin.from("abonnements").insert({
      user_id: context.userId,
      plan,
      cycle,
      montant,
      statut: "en_attente",
      provider: "aucun",
    });
    return { ok: true as const, alreadyActive: false as const };
  });

export const cancelPendingSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("abonnements")
      .update({ statut: "annule" })
      .eq("user_id", context.userId)
      .eq("statut", "en_attente");
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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
    const requiresPayment = plan === "gratuit" && !!pending;

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
      provider: "paydunya",
    });
    return { ok: true as const, alreadyActive: false as const };
  });

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { plan: string; cycle: string }) => data)
  .handler(async ({ data, context }) => {
    const { normalizePlan, normalizeCycle, chargedAmount, PRICING, isPaidPlan } = await import("./pricing");
    const plan = normalizePlan(data.plan);
    if (!plan || !isPaidPlan(plan)) throw new Error("Plan invalide");
    const cycle = normalizeCycle(data.cycle);
    const montant = chargedAmount(plan, cycle);
    const provider = "paydunya";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    // Une seule demande en attente par utilisateur
    await admin
      .from("abonnements")
      .update({ statut: "annule" })
      .eq("user_id", context.userId)
      .eq("statut", "en_attente");

    const { data: row, error } = await admin
      .from("abonnements")
      .insert({
        user_id: context.userId,
        plan,
        cycle,
        montant,
        statut: "en_attente",
        provider,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const origin = new URL(getRequest().url).origin;
    const label = `Abonnement TERA-DEVIS ${PRICING[plan].nom} (${cycle === "yearly" ? "annuel" : "mensuel"})`;

    if (provider === "paypal") {
      const { getPaypalConfig, createOrder } = await import("./paypal.server");
      const cfg = getPaypalConfig();
      if (!cfg) {
        return {
          ok: false as const,
          abonnementId: row.id as string,
          montant,
          reason: "config_manquante",
          message:
            "Le paiement PayPal n'est pas encore activé : les identifiants PayPal doivent être ajoutés dans les paramètres du projet.",
        };
      }
      try {
        const order = await createOrder({
          cfg,
          amountXof: montant,
          description: label,
          referenceId: String(row.id),
          returnUrl: `${origin}/paiement?statut=retour&provider=paypal`,
          cancelUrl: `${origin}/paiement?statut=annule`,
        });
        await admin
          .from("abonnements")
          .update({ provider_token: order.id, provider_response: order.raw as any })
          .eq("id", row.id);
        return { ok: true as const, abonnementId: row.id as string, montant, url: order.url, token: order.id };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erreur de paiement";
        await admin.from("abonnements").update({ statut: "echoue" }).eq("id", row.id);
        return { ok: false as const, abonnementId: row.id as string, montant, reason: "provider_error", message };
      }
    }

    const { getPaydunyaConfig, createInvoice } = await import("./paydunya.server");
    const cfg = getPaydunyaConfig();
    if (!cfg) {
      return {
        ok: false as const,
        abonnementId: row.id as string,
        montant,
        reason: "config_manquante",
        message:
          "Le paiement en ligne n'est pas encore activé : les clés API PayDunya doivent être ajoutées dans les paramètres du projet.",
      };
    }

    try {
      const invoice = await createInvoice({
        cfg,
        amount: montant,
        description: label,
        itemName: `TERA-DEVIS ${PRICING[plan].nom}`,
        returnUrl: `${origin}/paiement?statut=retour`,
        cancelUrl: `${origin}/paiement?statut=annule`,
        callbackUrl: `${origin}/api/public/hooks/paydunya-ipn`,
        customData: { abonnement_id: String(row.id), user_id: context.userId },
      });

      await admin
        .from("abonnements")
        .update({ provider_token: invoice.token, provider_response: invoice.raw as any })
        .eq("id", row.id);

      return { ok: true as const, abonnementId: row.id as string, montant, url: invoice.url, token: invoice.token };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur de paiement";
      await admin.from("abonnements").update({ statut: "echoue" }).eq("id", row.id);
      return { ok: false as const, abonnementId: row.id as string, montant, reason: "provider_error", message };
    }
  });

export const refreshPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: row } = await admin
      .from("abonnements")
      .select("id, user_id, plan, cycle, provider, provider_token, statut")
      .eq("user_id", context.userId)
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return { statut: "aucun" as const };
    if (!row.provider_token) return { statut: "en_attente" as const };

    if (row.provider === "paypal") {
      const { getPaypalConfig, captureOrder } = await import("./paypal.server");
      const cfg = getPaypalConfig();
      if (!cfg) return { statut: "en_attente" as const };
      const { status, raw } = await captureOrder(cfg, row.provider_token as string);
      if (status === "COMPLETED") {
        const { activateAbonnement } = await import("./abonnement.server");
        await activateAbonnement(row, raw);
        return { statut: "paye" as const, plan: row.plan as string };
      }
      if (status === "VOIDED" || status === "PAYER_ACTION_REQUIRED") {
        await admin.from("abonnements").update({ statut: "echoue", provider_response: raw }).eq("id", row.id);
        return { statut: "echoue" as const };
      }
      return { statut: "en_attente" as const };
    }

    const { getPaydunyaConfig, confirmInvoice } = await import("./paydunya.server");
    const cfg = getPaydunyaConfig();
    if (!cfg) return { statut: "en_attente" as const };

    const { status, raw } = await confirmInvoice(cfg, row.provider_token as string);
    if (status === "completed") {
      const { activateAbonnement } = await import("./abonnement.server");
      await activateAbonnement(row, raw);
      return { statut: "paye" as const, plan: row.plan as string };
    }
    if (status === "cancelled" || status === "failed") {
      await admin.from("abonnements").update({ statut: "echoue", provider_response: raw }).eq("id", row.id);
      return { statut: "echoue" as const };
    }
    return { statut: "en_attente" as const };
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

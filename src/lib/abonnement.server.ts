import type { BillingCycle } from "./pricing";

/** Active l'abonnement payé : marque la ligne et met à jour le plan du profil. */
export async function activateAbonnement(row: {
  id: string;
  user_id: string;
  plan: string;
  cycle: string;
  provider_response?: unknown;
}, raw?: unknown) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const now = new Date();
  // Renouvellement : on prolonge depuis l'échéance en cours si elle n'est pas dépassée
  const { data: current } = await admin
    .from("profiles").select("plan, plan_expires_at").eq("id", row.user_id).maybeSingle();
  const base = current?.plan === row.plan && current?.plan_expires_at && new Date(current.plan_expires_at) > now
    ? new Date(current.plan_expires_at) : now;
  const expires = new Date(base);
  if ((row.cycle as BillingCycle) === "yearly") expires.setFullYear(expires.getFullYear() + 1);
  else expires.setMonth(expires.getMonth() + 1);

  const { error: e1 } = await admin
    .from("abonnements")
    .update({
      statut: "paye",
      paid_at: now.toISOString(),
      ...(raw ? { provider_response: raw } : {}),
    })
    .eq("id", row.id)
    .eq("statut", "en_attente");
  if (e1) throw new Error("Activation impossible : " + e1.message);

  const { error: e2 } = await admin
    .from("profiles")
    .update({ plan: row.plan, plan_expires_at: expires.toISOString() })
    .eq("id", row.user_id);
  if (e2) throw new Error("Activation impossible : " + e2.message);

  return { plan: row.plan, expiresAt: expires.toISOString() };
}

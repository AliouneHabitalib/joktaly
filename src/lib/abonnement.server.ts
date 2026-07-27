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
  const expires = new Date(now);
  if ((row.cycle as BillingCycle) === "yearly") expires.setFullYear(expires.getFullYear() + 1);
  else expires.setMonth(expires.getMonth() + 1);

  await admin
    .from("abonnements")
    .update({
      statut: "paye",
      paid_at: now.toISOString(),
      ...(raw ? { provider_response: raw } : {}),
    })
    .eq("id", row.id);

  await admin
    .from("profiles")
    .update({ plan: row.plan, plan_expires_at: expires.toISOString() })
    .eq("id", row.user_id);

  return { plan: row.plan, expiresAt: expires.toISOString() };
}

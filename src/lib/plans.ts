export type PlanType = "gratuit" | "starter" | "essentiel" | "pro" | "business";

export interface PlanConfig {
  id: PlanType;
  nom: string;
  prix_fcfa: number;
  prix_usd: number;
  limites: {
    devis_par_mois: number | null;
    factures_par_mois: number | null;
    clients_max: number | null;
    utilisateurs: number;
    statistiques_avancees: boolean;
    rappels_auto: boolean;
    api_access: boolean;
  };
  features: string[];
}

/** Public offers; essentiel remains a compatibility key only. */
export const PUBLIC_PLANS: PlanType[] = ["gratuit", "starter", "pro", "business"];

function definePlan(config: Omit<PlanConfig, "features">, extras: string[]): PlanConfig {
  const limits = config.limites;
  const features = limits.devis_par_mois === null && limits.factures_par_mois === null
    ? ["Devis et factures illimités"]
    : [
        `${limits.devis_par_mois} devis / mois`,
        `${limits.factures_par_mois} facture${limits.factures_par_mois === 1 ? "" : "s"} / mois`,
      ];
  features.push(limits.clients_max === null ? "Clients illimités" : `${limits.clients_max} clients`);
  if (limits.utilisateurs > 1) features.push(`Jusqu'à ${limits.utilisateurs} utilisateurs`);
  if (limits.rappels_auto) features.push("Rappels automatiques");
  features.push(...extras);
  if (limits.statistiques_avancees) features.push("Statistiques avancées");
  if (limits.api_access) features.push("Accès API et webhooks");
  return { ...config, features };
}

const pro = definePlan({
  id: "pro", nom: "Pro", prix_fcfa: 6000, prix_usd: 10,
  limites: {
    devis_par_mois: 20, factures_par_mois: 10, clients_max: 50,
    utilisateurs: 1, statistiques_avancees: false, rappels_auto: true, api_access: false,
  },
}, ["Modèles personnalisés"]);

export const PLANS: Record<PlanType, PlanConfig> = {
  gratuit: definePlan({
    id: "gratuit", nom: "Gratuit", prix_fcfa: 0, prix_usd: 0,
    limites: {
      devis_par_mois: 3, factures_par_mois: 1, clients_max: 5,
      utilisateurs: 1, statistiques_avancees: false, rappels_auto: false, api_access: false,
    },
  }, []),
  starter: definePlan({
    id: "starter", nom: "Starter", prix_fcfa: 3000, prix_usd: 5,
    limites: {
      devis_par_mois: 10, factures_par_mois: 5, clients_max: 30,
      utilisateurs: 1, statistiques_avancees: false, rappels_auto: false, api_access: false,
    },
  }, ["Conversion devis → facture"]),
  pro,
  essentiel: pro,
  business: definePlan({
    id: "business", nom: "Business", prix_fcfa: 15000, prix_usd: 25,
    limites: {
      devis_par_mois: null, factures_par_mois: null, clients_max: null,
      utilisateurs: 5, statistiques_avancees: true, rappels_auto: true, api_access: true,
    },
  }, []),
};

export const checkLimit = (
  plan: PlanType,
  type: "devis" | "factures",
  currentCount: number,
): { allowed: boolean; limit: number | null; message?: string } => {
  const limit =
    type === "devis"
      ? PLANS[plan].limites.devis_par_mois
      : PLANS[plan].limites.factures_par_mois;
  if (limit === null) return { allowed: true, limit: null };
  if (currentCount >= limit) {
    return {
      allowed: false,
      limit,
      message: `Vous avez atteint la limite de ${limit} ${type}/mois du plan ${PLANS[plan].nom}. Passez au plan supérieur pour continuer.`,
    };
  }
  return { allowed: true, limit };
};
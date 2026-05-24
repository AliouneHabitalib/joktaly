export type PlanType = "gratuit" | "starter" | "pro" | "business";

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

export const PLANS: Record<PlanType, PlanConfig> = {
  gratuit: {
    id: "gratuit",
    nom: "Gratuit",
    prix_fcfa: 0,
    prix_usd: 0,
    limites: {
      devis_par_mois: 3,
      factures_par_mois: 1,
      clients_max: 5,
      utilisateurs: 1,
      statistiques_avancees: false,
      rappels_auto: false,
      api_access: false,
    },
    features: [
      "3 devis par mois",
      "1 facture par mois",
      "5 clients maximum",
      "Produits et services basiques",
      "Export PDF",
      "Support communautaire",
    ],
  },
  starter: {
    id: "starter",
    nom: "Starter",
    prix_fcfa: 3000,
    prix_usd: 5,
    limites: {
      devis_par_mois: 10,
      factures_par_mois: 5,
      clients_max: 30,
      utilisateurs: 1,
      statistiques_avancees: false,
      rappels_auto: false,
      api_access: false,
    },
    features: [
      "10 devis par mois",
      "5 factures par mois",
      "30 clients",
      "Produits et services illimités",
      "Conversion devis en facture",
      "Export PDF professionnel",
      "Support par email",
    ],
  },
  pro: {
    id: "pro",
    nom: "Pro",
    prix_fcfa: 6000,
    prix_usd: 10,
    limites: {
      devis_par_mois: null,
      factures_par_mois: null,
      clients_max: null,
      utilisateurs: 1,
      statistiques_avancees: true,
      rappels_auto: true,
      api_access: false,
    },
    features: [
      "Devis et factures illimités",
      "Clients illimités",
      "Statistiques avancées",
      "Relance des factures impayées",
      "Export PDF premium",
      "Support prioritaire",
    ],
  },
  business: {
    id: "business",
    nom: "Business",
    prix_fcfa: 15000,
    prix_usd: 25,
    limites: {
      devis_par_mois: null,
      factures_par_mois: null,
      clients_max: null,
      utilisateurs: 5,
      statistiques_avancees: true,
      rappels_auto: true,
      api_access: true,
    },
    features: [
      "Tout du plan Pro",
      "Multi-utilisateurs (5)",
      "Gestion multi-entreprises",
      "Rapports mensuels",
      "Modèles personnalisés",
      "Assistance WhatsApp prioritaire",
    ],
  },
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
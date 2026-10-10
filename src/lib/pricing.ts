import type { PlanType } from "./plans";

export type BillingCycle = "monthly" | "yearly";

export interface PlanPricing {
  id: PlanType;
  nom: string;
  /** Prix mensuel de référence en FCFA */
  base: number;
  ideal: string;
  features: string[];
}

/** Catalogue tarifaire affiché sur la page d'accueil et la page de paiement. */
export const PRICING: Record<PlanType, PlanPricing> = {
  gratuit: {
    id: "gratuit",
    nom: "Gratuit",
    base: 0,
    ideal: "Tester l'application",
    features: ["3 devis / mois", "1 facture / mois", "5 clients", "Export PDF"],
  },
  starter: {
    id: "starter",
    nom: "Starter",
    base: 3000,
    ideal: "Petits entrepreneurs",
    features: ["10 devis / mois", "5 factures / mois", "30 clients", "Conversion devis → facture"],
  },
  essentiel: {
    id: "essentiel",
    nom: "Essentiel",
    base: 6000,
    ideal: "Activités en croissance",
    features: ["20 devis / mois", "10 factures / mois", "50 clients", "Rappels automatiques"],
  },
  pro: {
    id: "pro",
    nom: "Pro",
    base: 6000,
    ideal: "Activités en croissance",
    features: ["20 devis / mois", "10 factures / mois", "50 clients", "Rappels automatiques", "Modèles personnalisés"],
  },
  business: {
    id: "business",
    nom: "Business",
    base: 15000,
    ideal: "Équipes et entreprises",
    features: ["Devis et factures illimités", "Jusqu'à 5 utilisateurs", "Statistiques avancées", "Accès API et webhooks"],
  },
};

export const PAID_PLANS: PlanType[] = ["starter", "essentiel", "pro", "business"];

export function isPaidPlan(plan: string | undefined | null): plan is PlanType {
  return !!plan && (PAID_PLANS as string[]).includes(plan);
}

export function normalizePlan(plan: string | undefined | null): PlanType | null {
  if (!plan) return null;
  const p = plan.toLowerCase();
  return p in PRICING ? (p as PlanType) : null;
}

export function normalizeCycle(cycle: string | undefined | null): BillingCycle {
  return cycle === "yearly" ? "yearly" : "monthly";
}

/** Prix mensuel affiché (remise de 20% en annuel) */
export function monthlyPrice(plan: PlanType, cycle: BillingCycle): number {
  const base = PRICING[plan].base;
  return cycle === "yearly" ? Math.round(base * 0.8) : base;
}

/** Montant réellement facturé (12 mois en annuel) */
export function chargedAmount(plan: PlanType, cycle: BillingCycle): number {
  const m = monthlyPrice(plan, cycle);
  return cycle === "yearly" ? m * 12 : m;
}

export function cycleLabel(cycle: BillingCycle): string {
  return cycle === "yearly" ? "Annuel" : "Mensuel";
}

import { PLANS, type PlanType } from "./plans";

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
const IDEALS: Record<PlanType, string> = {
  gratuit: "Tester l'application",
  starter: "Petits entrepreneurs",
  pro: "Activités en croissance",
  essentiel: "Activités en croissance",
  business: "Équipes et entreprises",
};

export const PRICING = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [key, {
    id: plan.id,
    nom: plan.nom,
    base: plan.prix_fcfa,
    ideal: IDEALS[key as PlanType],
    features: plan.features,
  }]),
) as Record<PlanType, PlanPricing>;

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

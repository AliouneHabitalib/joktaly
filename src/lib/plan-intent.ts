/** Mémorise le plan choisi avant une redirection OAuth (Google), puis le relit au retour. */
const KEY = "tera-devis:plan-intent";

export interface PlanIntent {
  plan?: string;
  cycle?: "monthly" | "yearly";
}

export function savePlanIntent(intent: PlanIntent) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

export function readPlanIntent(): PlanIntent {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PlanIntent) : {};
  } catch {
    return {};
  }
}

export function clearPlanIntent() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Calcule la date de début du mois courant (ou d'une date donnée) au format
 * YYYY-MM-DD. Sert de borne inférieure pour les compteurs mensuels de devis
 * et factures. Le compteur se réinitialise donc automatiquement au 1er de
 * chaque mois car les documents émis le mois précédent ne sont plus inclus.
 */
export function getMonthStartISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Indique si une date d'émission est comptabilisée dans le mois de `now`. */
export function isInCurrentMonth(dateEmission: string, now: Date = new Date()): boolean {
  return dateEmission >= getMonthStartISO(now);
}
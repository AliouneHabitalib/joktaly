// Exemple de devis utilisé dans les visuels de démonstration de la landing page.
export const DEMO_DEVIS = {
  numero: "DEV-2026-118",
  client: "SEN-BTP Construction SARL",
  ville: "Dakar, Sénégal",
  objet: "Rénovation plateau bureaux — 180 m²",
  lignes: [
    { designation: "Étude technique & plans d'exécution", qte: 1, total: 450000 },
    { designation: "Fourniture matériaux (lot 1)", qte: 1, total: 1250000 },
    { designation: "Main-d'œuvre qualifiée — 15 jours", qte: 15, total: 900000 },
  ],
  sousTotal: 2600000,
  remise: 130000,
  tva: 444600,
  total: 2914600,
} as const;

export const fmtFcfa = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

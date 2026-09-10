/**
 * Métadonnées <head> pour les pages privées (espace connecté).
 * Titre/description uniques par page + noindex (pages non publiques).
 */
export function privateHead(title: string, description: string) {
  return () => ({
    meta: [
      { title: `${title} — TERA-DEVIS` },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `${title} — TERA-DEVIS` },
      { property: "og:description", content: description },
    ],
  });
}

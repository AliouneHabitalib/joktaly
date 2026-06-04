export interface EntrepriseExtras {
  couleur_secondaire?: string;
  prefixe_devis?: string;
  prefixe_facture?: string;
  numerotation_auto?: boolean;
  conditions_paiement?: string;
  mentions_legales?: string;
}

const KEY = (id: string) => `devispro:entreprise-extras:${id}`;

export function getEntrepriseExtras(entrepriseId: string | undefined | null): EntrepriseExtras {
  if (!entrepriseId || typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY(entrepriseId));
    return raw ? (JSON.parse(raw) as EntrepriseExtras) : {};
  } catch {
    return {};
  }
}
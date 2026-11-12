export interface EntrepriseExtras {
  couleur_secondaire?: string;
  prefixe_devis?: string;
  prefixe_facture?: string;
  numerotation_auto?: boolean;
  conditions_paiement?: string;
  mentions_legales?: string;
}

const KEY = (id: string) => `devispro:entreprise-extras:${id}`;

type EntrepriseRef = string | { id?: string; document_settings?: unknown } | undefined | null;

/** Réglages documents : enregistrés dans le compte, avec repli sur l'ancienne copie locale. */
export function getEntrepriseExtras(e: EntrepriseRef): EntrepriseExtras {
  if (!e) return {};
  const id = typeof e === "string" ? e : (e.id ?? "");
  const db =
    typeof e === "object" && e.document_settings && typeof e.document_settings === "object"
      ? (e.document_settings as EntrepriseExtras)
      : {};
  let local: EntrepriseExtras = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(KEY(id));
      if (raw) local = JSON.parse(raw) as EntrepriseExtras;
    } catch {
      /* ignore */
    }
  }
  return Object.keys(db).length ? db : local;
}

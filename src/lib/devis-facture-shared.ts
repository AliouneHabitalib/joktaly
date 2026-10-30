import { supabase } from "@/integrations/supabase/client";
import type { PdfDoc } from "./pdf";
import { getEntrepriseExtras } from "./entreprise-extras";

export interface EntrepriseLite {
  id?: string;
  nom: string;
  slogan?: string | null;
  logo_url?: string | null;
  adresse?: string | null;
  ville?: string | null;
  pays?: string | null;
  telephone?: string | null;
  email?: string | null;
  site_web?: string | null;
  ninea?: string | null;
  rc?: string | null;
  devise?: string | null;
  couleur_primaire?: string | null;
  coordonnees_bancaires?: string | null;
}

export async function buildPdfDoc(params: {
  type: "devis" | "facture";
  id: string;
  entreprise: EntrepriseLite;
}): Promise<PdfDoc> {
  const { type, id, entreprise } = params;
  const extras = getEntrepriseExtras(entreprise.id);
  const table = type === "devis" ? "devis" : "factures";
  const lignesTable = type === "devis" ? "devis_lignes" : "factures_lignes";
  const fk = type === "devis" ? "devis_id" : "facture_id";

  const { data: doc, error: e1 } = await supabase
    .from(table)
    .select("*, clients(*)")
    .eq("id", id)
    .single();
  if (e1 || !doc) throw e1 ?? new Error("Document introuvable");

  const { data: lignes, error: e2 } = await (supabase as any)
    .from(lignesTable)
    .select("*")
    .eq(fk, id)
    .order("ordre");
  if (e2) throw e2;

  return {
    type,
    numero: doc.numero,
    titre: doc.titre,
    objet: doc.objet,
    date_emission: doc.date_emission,
    date_echeance: (doc as any).date_echeance ?? null,
    date_validite: (doc as any).date_validite ?? null,
    statut: doc.statut,
    sous_total: Number(doc.sous_total),
    montant_tva: Number(doc.montant_tva),
    total_ttc: Number(doc.total_ttc),
    remise_montant: Number(doc.remise_montant),
    tva_active: doc.tva_active,
    notes: doc.notes,
    conditions_paiement: doc.conditions_paiement,
    lignes: (lignes ?? []).map((l: any) => ({
      description: l.description,
      quantite: Number(l.quantite),
      unite: l.unite,
      prix_unitaire: Number(l.prix_unitaire),
      tva_taux: Number(l.tva_taux),
      total_ht: Number(l.total_ht),
      total_ttc: Number(l.total_ttc),
    })),
    client: {
      nom: (doc as any).clients?.nom ?? "",
      prenom: (doc as any).clients?.prenom,
      entreprise_nom: (doc as any).clients?.entreprise_nom,
      email: (doc as any).clients?.email,
      telephone: (doc as any).clients?.telephone,
      adresse: (doc as any).clients?.adresse,
      ville: (doc as any).clients?.ville,
    },
    entreprise: {
      nom: entreprise.nom,
      slogan: entreprise.slogan,
      logo_url: entreprise.logo_url,
      adresse: entreprise.adresse,
      ville: entreprise.ville,
      pays: entreprise.pays,
      telephone: entreprise.telephone,
      email: entreprise.email,
      site_web: entreprise.site_web,
      ninea: entreprise.ninea,
      rc: entreprise.rc,
      devise: entreprise.devise ?? "FCFA",
      couleur_primaire: entreprise.couleur_primaire ?? "#0A63F0",
      coordonnees_bancaires: entreprise.coordonnees_bancaires,
      mentions_legales: extras.mentions_legales ?? null,
    },
  };
}

export interface LigneDraft {
  id: string; // local id
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  tva_taux: number;
}

export function calculerTotaux(
  lignes: LigneDraft[],
  tva_active: boolean,
  remise_pourcent: number,
) {
  let sous_total = 0;
  let montant_tva = 0;
  for (const l of lignes) {
    const ht = (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0);
    sous_total += ht;
    if (tva_active) montant_tva += ht * ((Number(l.tva_taux) || 0) / 100);
  }
  const remise_montant = sous_total * ((Number(remise_pourcent) || 0) / 100);
  const total_ttc = sous_total - remise_montant + montant_tva;
  return {
    sous_total: round(sous_total),
    montant_tva: round(montant_tva),
    remise_montant: round(remise_montant),
    total_ttc: round(total_ttc),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
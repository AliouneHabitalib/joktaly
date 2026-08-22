import { supabase } from "@/integrations/supabase/client";

/**
 * Crée une facture à partir d'un devis existant (client, lignes, TVA, remise,
 * conditions) et marque le devis comme accepté.
 */
export async function convertDevisToFacture(devisId: string, entrepriseId: string) {
  const { data: full, error: e1 } = await supabase
    .from("devis")
    .select("*, devis_lignes(*)")
    .eq("id", devisId)
    .single();
  if (e1 || !full) throw e1 ?? new Error("Devis introuvable");

  const { data: numero, error: nerr } = await supabase.rpc("next_facture_numero", {
    _entreprise_id: entrepriseId,
  });
  if (nerr) throw nerr;

  const { data: facture, error: e2 } = await supabase
    .from("factures")
    .insert({
      entreprise_id: entrepriseId,
      client_id: full.client_id,
      devis_id: full.id,
      numero: numero as string,
      titre: full.titre,
      objet: full.objet,
      tva_active: full.tva_active,
      tva_taux: full.tva_taux,
      remise_pourcent: full.remise_pourcent,
      remise_montant: full.remise_montant,
      sous_total: full.sous_total,
      montant_tva: full.montant_tva,
      total_ttc: full.total_ttc,
      notes: full.notes,
      conditions_paiement: full.conditions_paiement,
    })
    .select()
    .single();
  if (e2) throw e2;

  const lignes = ((full as any).devis_lignes ?? []).map((l: any) => ({
    facture_id: facture.id,
    description: l.description,
    quantite: l.quantite,
    unite: l.unite,
    prix_unitaire: l.prix_unitaire,
    tva_taux: l.tva_taux,
    total_ht: l.total_ht,
    total_ttc: l.total_ttc,
    ordre: l.ordre,
  }));
  if (lignes.length) {
    const { error: e3 } = await supabase.from("factures_lignes").insert(lignes);
    if (e3) throw e3;
  }

  await supabase.from("devis").update({ statut: "accepte" }).eq("id", devisId);

  return { factureId: facture.id as string, numero: numero as string };
}

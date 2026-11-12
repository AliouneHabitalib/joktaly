import { supabase } from "@/integrations/supabase/client";

/** Crée la facture d'un devis en une seule opération (tout ou rien) et marque le devis accepté. */
export async function convertDevisToFacture(devisId: string, _entrepriseId?: string) {
  const { data, error } = await supabase.rpc("convert_devis_to_facture", { _devis_id: devisId });
  if (error) throw error;
  const r = data as { id: string; numero: string };
  return { factureId: r.id, numero: r.numero };
}

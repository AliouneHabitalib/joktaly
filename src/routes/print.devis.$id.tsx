import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildPdfDoc } from "@/lib/devis-facture-shared";
import { PrintDocument } from "@/components/print-document";
import type { PdfDoc } from "@/lib/pdf";

export const Route = createFileRoute("/print/devis/$id")({
  component: PrintDevisPage,
});

function PrintDevisPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: entreprise, error: eErr } = await supabase
        .from("entreprises")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (eErr || !entreprise) {
        setError("Entreprise introuvable. Configurez-la dans Paramètres.");
        return;
      }
      try {
        const pdfDoc = await buildPdfDoc({ type: "devis", id, entreprise });
        setDoc(pdfDoc);
        document.title = `Devis ${pdfDoc.numero}`;
      } catch (e: any) {
        setError(e?.message ?? "Erreur de chargement du devis");
      }
    })();
  }, [id, navigate]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", color: "#c00" }}>
        {error}
      </div>
    );
  }
  if (!doc) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", color: "#666" }}>
        Chargement du devis…
      </div>
    );
  }
  return <PrintDocument doc={doc} autoPrint />;
}
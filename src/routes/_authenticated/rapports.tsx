import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { privateHead } from "@/lib/private-head";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMontant, formatDate, toDateInput } from "@/lib/format";
import { computeRapport, computeTresorerie, inRange, periodBounds, toCsv, type Periode } from "@/lib/rapports";

export const Route = createFileRoute("/_authenticated/rapports")({
  head: privateHead("Rapports", "Ventes, encaissements, dépenses et bénéfice estimé par jour, semaine, mois ou année."),
  component: RapportsPage,
});

const PERIODES: { k: Periode; label: string }[] = [
  { k: "jour", label: "Jour" },
  { k: "semaine", label: "Semaine" },
  { k: "mois", label: "Mois" },
  { k: "annee", label: "Année" },
];

function RapportsPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const devise = entreprise?.devise ?? "FCFA";
  const [periode, setPeriode] = useState<Periode>("mois");
  const [ref, setRef] = useState(toDateInput(new Date()));

  const { data } = useQuery({
    queryKey: ["rapports", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const eid = entreprise!.id;
      const [f, p, d, dp] = await Promise.all([
        supabase.from("factures").select("id, numero, date_emission, total_ttc, statut, client:clients(nom, entreprise_nom)").eq("entreprise_id", eid),
        supabase.from("paiements").select("montant, date_paiement, mode, facture:factures!inner(numero, entreprise_id)").eq("facture.entreprise_id", eid),
        supabase.from("depenses").select("date_depense, categorie, description, montant, montant_paye").eq("entreprise_id", eid),
        supabase.from("depenses_paiements").select("montant, date_paiement, depense:depenses!inner(entreprise_id)").eq("depense.entreprise_id", eid),
      ]);
      if (dp.error) throw dp.error;
      if (f.error) throw f.error;
      if (p.error) throw p.error;
      if (d.error) throw d.error;
      return { factures: f.data, paiements: p.data, depenses: d.data, sorties: dp.data };
    },
  });

  const bounds = useMemo(() => periodBounds(periode, new Date(ref + "T12:00:00")), [periode, ref]);
  const r = useMemo(() => computeRapport(data ?? { factures: [], paiements: [], depenses: [] }, bounds), [data, bounds]);
  const qc = useQueryClient();
  const ent = entreprise as { solde_initial?: number; solde_initial_date?: string | null } | null | undefined;
  const t = useMemo(
    () =>
      computeTresorerie(
        {
          soldeInitial: Number(ent?.solde_initial ?? 0),
          soldeInitialDate: ent?.solde_initial_date ?? null,
          entrees: (data?.paiements ?? []).map((x) => ({ date: x.date_paiement, montant: Number(x.montant) })),
          sorties: (data?.sorties ?? []).map((x) => ({ date: x.date_paiement, montant: Number(x.montant) })),
        },
        bounds,
      ),
    [data, bounds, ent?.solde_initial, ent?.solde_initial_date],
  );
  const [soldeEdit, setSoldeEdit] = useState<{ montant: string; date: string } | null>(null);
  const saveSolde = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("entreprises")
        .update({ solde_initial: Number(soldeEdit!.montant) || 0, solde_initial_date: soldeEdit!.date || null })
        .eq("id", entreprise!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Solde de départ enregistré"); setSoldeEdit(null); qc.invalidateQueries({ queryKey: ["entreprise"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const facturesP = (data?.factures ?? []).filter((x) => x.statut !== "annulee" && inRange(x.date_emission, bounds));
  const depensesP = (data?.depenses ?? []).filter((x) => inRange(x.date_depense, bounds));
  const titre = `Rapport du ${formatDate(bounds.debut)} au ${formatDate(bounds.fin)}`;
  const clientNom = (c: unknown) => { const x = c as { nom?: string; entreprise_nom?: string } | null; return x?.entreprise_nom || x?.nom || ""; };

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [entreprise?.nom ?? "", titre],
      [],
      ["Factures émises", r.nbFactures],
      ["Montant facturé", r.facture],
      ["Encaissé", r.encaisse],
      ["Dépenses", r.depense],
      ["Bénéfice estimé (encaissé - dépenses)", r.benefice],
      [],
      ["TRÉSORERIE", ""],
      ["Solde début de période", t.soldeDebut],
      ["Argent entré", t.entrees],
      ["Argent sorti", t.sorties],
      ["Solde fin de période", t.soldeFin],
      [],
      ["FACTURES", "Numéro", "Client", "Montant TTC", "Statut"],
      ...facturesP.map((x) => [x.date_emission, x.numero, clientNom(x.client), Number(x.total_ttc), x.statut]),
      [],
      ["DÉPENSES", "Catégorie", "Description", "Montant", "Payé"],
      ...depensesP.map((x) => [x.date_depense, x.categorie, x.description ?? "", Number(x.montant), Number(x.montant_paye)]),
    ];
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapport-${bounds.debut}_${bounds.fin}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPdf = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const m = (n: number) => formatMontant(n, devise).replace(/[\u202f\u00a0]/g, " ");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(entreprise?.nom ?? "Rapport", 15, 18);
    doc.setFontSize(11);
    doc.text(titre, 15, 26);
    autoTable(doc, {
      startY: 32,
      styles: { fontSize: 10.5 },
      body: [["Factures émises", String(r.nbFactures)], ["Montant facturé", m(r.facture)], ["Encaissé", m(r.encaisse)], ["Dépenses", m(r.depense)], ["Bénéfice estimé (encaissé − dépenses)", m(r.benefice)], ["Trésorerie — solde début", m(t.soldeDebut)], ["Argent entré", m(t.entrees)], ["Argent sorti", m(t.sorties)], ["Trésorerie — solde fin", m(t.soldeFin)]],
      margin: { left: 15, right: 15 },
    });
    const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    autoTable(doc, { startY: y1, head: [["Date", "N°", "Client", "Montant TTC"]], body: facturesP.map((x) => [formatDate(x.date_emission), x.numero, clientNom(x.client), m(Number(x.total_ttc))]), styles: { fontSize: 10 }, margin: { left: 15, right: 15 } });
    const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    autoTable(doc, { startY: y2, head: [["Date", "Catégorie", "Description", "Montant"]], body: depensesP.map((x) => [formatDate(x.date_depense), x.categorie, x.description ?? "", m(Number(x.montant))]), styles: { fontSize: 10 }, margin: { left: 15, right: 15 } });
    doc.save(`rapport-${bounds.debut}_${bounds.fin}.pdf`);
  };

  const Kpi = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 tabular-nums ${strong ? "text-xl font-bold" : "text-lg font-semibold"}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-sm text-muted-foreground">{titre}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-11" onClick={exportCsv}><FileSpreadsheet className="mr-1 h-4 w-4" /> Excel (CSV)</Button>
          <Button variant="outline" className="h-11" onClick={exportPdf}><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {PERIODES.map((p) => (
            <button key={p.k} onClick={() => setPeriode(p.k)} className={`h-10 rounded-md px-3 text-sm font-medium ${periode === p.k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{p.label}</button>
          ))}
        </div>
        <Input type="date" className="h-11 w-auto text-base md:text-sm" value={ref} onChange={(e) => e.target.value && setRef(e.target.value)} aria-label="Date de référence" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Factures émises" value={String(r.nbFactures)} />
        <Kpi label="Montant facturé" value={formatMontant(r.facture, devise)} />
        <Kpi label="Encaissé" value={formatMontant(r.encaisse, devise)} />
        <Kpi label="Dépenses" value={formatMontant(r.depense, devise)} />
        <Kpi label="Bénéfice estimé" value={formatMontant(r.benefice, devise)} strong />
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Trésorerie (cash réel)</h2>
          <Button variant="outline" className="h-11" onClick={() => setSoldeEdit({ montant: String(ent?.solde_initial ?? 0), date: ent?.solde_initial_date ?? toDateInput(new Date()) })}>Solde de départ</Button>
        </div>
        {soldeEdit && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
            <div className="grid gap-1.5"><Label>Argent disponible ({devise})</Label><Input type="number" inputMode="decimal" className="h-11 text-base md:text-sm" value={soldeEdit.montant} onChange={(e) => setSoldeEdit({ ...soldeEdit, montant: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>À la date du</Label><Input type="date" className="h-11 text-base md:text-sm" value={soldeEdit.date} onChange={(e) => setSoldeEdit({ ...soldeEdit, date: e.target.value })} /></div>
            <Button className="h-11" disabled={saveSolde.isPending} onClick={() => saveSolde.mutate()}>Enregistrer</Button>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Solde début de période" value={formatMontant(t.soldeDebut, devise)} />
          <Kpi label="Argent entré" value={formatMontant(t.entrees, devise)} />
          <Kpi label="Argent sorti" value={formatMontant(t.sorties, devise)} />
          <Kpi label="Solde fin de période" value={formatMontant(t.soldeFin, devise)} strong />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Argent entré = paiements clients enregistrés. Argent sorti = paiements de dépenses, à leur date. Les mouvements avant la date du solde de départ ne sont pas comptés.</p>
      </div>
      <p className="text-xs text-muted-foreground">Bénéfice estimé = paiements reçus sur la période − dépenses enregistrées sur la période. Factures annulées exclues.</p>
    </div>
  );
}

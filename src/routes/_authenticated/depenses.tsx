import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet, Paperclip, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { privateHead } from "@/lib/private-head";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMontant, formatDate, toDateInput } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/depenses")({
  head: privateHead("Dépenses", "Enregistrez vos dépenses, achats fournisseurs et justificatifs."),
  component: DepensesPage,
});

const CATEGORIES = ["Achats / marchandises", "Loyer", "Salaires", "Transport", "Électricité / eau", "Téléphone / internet", "Fournitures", "Impôts / taxes", "Autre"];
const NONE = "__none__";

function emptyForm() {
  return { date_depense: toDateInput(new Date()), categorie: "Autre", description: "", montant: "", montant_paye: "", fournisseur_id: NONE };
}

function DepensesPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [pay, setPay] = useState<{ id: string; reste: number } | null>(null);
  const [payForm, setPayForm] = useState({ montant: "", date: toDateInput(new Date()), mode: "" });
  const devise = entreprise?.devise ?? "FCFA";

  const { data } = useQuery({
    queryKey: ["depenses", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const [d, f] = await Promise.all([
        supabase.from("depenses").select("*, fournisseur:fournisseurs(nom)").eq("entreprise_id", entreprise!.id).order("date_depense", { ascending: false }),
        supabase.from("fournisseurs").select("id, nom").eq("entreprise_id", entreprise!.id).order("nom"),
      ]);
      if (d.error) throw d.error;
      return { depenses: d.data, fournisseurs: f.data ?? [] };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const montant = Number(form.montant);
      if (!(montant > 0)) throw new Error("Indiquez un montant supérieur à 0.");
      const paye = editId ? 0 : form.montant_paye === "" ? montant : Number(form.montant_paye);
      if (paye < 0 || paye > montant) throw new Error("Le montant payé doit être entre 0 et le montant total.");
      let justificatif_path: string | undefined;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Justificatif trop lourd (5 Mo maximum).");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        justificatif_path = `${entreprise!.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("justificatifs").upload(justificatif_path, file, { contentType: file.type });
        if (up.error) throw up.error;
      }
      const payload = {
        date_depense: form.date_depense,
        categorie: form.categorie,
        description: form.description || null,
        montant,
        ...(editId ? {} : { montant_paye: paye }),
        fournisseur_id: form.fournisseur_id === NONE ? null : form.fournisseur_id,
        ...(justificatif_path ? { justificatif_path } : {}),
      };
      const res = editId
        ? await supabase.from("depenses").update(payload).eq("id", editId)
        : await supabase.from("depenses").insert({ ...payload, entreprise_id: entreprise!.id });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rapports"] });
      toast.success("Dépense enregistrée");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["depenses"] });
      qc.invalidateQueries({ queryKey: ["fournisseurs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addPay = useMutation({
    mutationFn: async () => {
      const m = Number(payForm.montant);
      if (!(m > 0)) throw new Error("Indiquez un montant supérieur à 0.");
      if (m > pay!.reste) throw new Error("Le paiement dépasse le reste à payer.");
      const { error } = await supabase.from("depenses_paiements").insert({ depense_id: pay!.id, montant: m, date_paiement: payForm.date, mode: payForm.mode || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paiement enregistré");
      setPay(null);
      qc.invalidateQueries({ queryKey: ["depenses"] });
      qc.invalidateQueries({ queryKey: ["fournisseurs"] });
      qc.invalidateQueries({ queryKey: ["rapports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: { id: string; justificatif_path: string | null }) => {
      const { error } = await supabase.from("depenses").delete().eq("id", row.id);
      if (error) throw error;
      if (row.justificatif_path) await supabase.storage.from("justificatifs").remove([row.justificatif_path]);
    },
    onSuccess: () => {
      toast.success("Dépense supprimée");
      qc.invalidateQueries({ queryKey: ["depenses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openJustificatif = async (path: string) => {
    const { data: s, error } = await supabase.storage.from("justificatifs").createSignedUrl(path, 300);
    if (error || !s) return toast.error("Impossible d'ouvrir le justificatif.");
    window.open(s.signedUrl, "_blank", "noopener");
  };

  const rows = data?.depenses ?? [];
  const total = rows.reduce((s, r) => s + Number(r.montant), 0);
  const reste = rows.reduce((s, r) => s + Math.max(0, Number(r.montant) - Number(r.montant_paye)), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dépenses</h1>
          <p className="text-sm text-muted-foreground">Total {formatMontant(total, devise)} · reste à payer {formatMontant(reste, devise)}</p>
        </div>
        <Button className="h-11" onClick={() => { setEditId(null); setForm(emptyForm()); setFile(null); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Nouvelle dépense
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <Wallet className="mx-auto mb-2 h-8 w-8" /> Aucune dépense enregistrée.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Date</th><th className="p-3">Catégorie</th><th className="p-3">Description</th><th className="p-3">Fournisseur</th><th className="p-3 text-right">Montant</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const restant = Number(r.montant) - Number(r.montant_paye);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{formatDate(r.date_depense)}</td>
                    <td className="p-3">{r.categorie}</td>
                    <td className="p-3 text-muted-foreground">{r.description || "—"}</td>
                    <td className="p-3">{(r.fournisseur as { nom: string } | null)?.nom ?? "—"}</td>
                    <td className="p-3 text-right tabular-nums">
                      {formatMontant(Number(r.montant), devise)}
                      {restant > 0 && <div className="text-xs text-destructive">reste {formatMontant(restant, devise)}</div>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {restant > 0 && (
                        <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Enregistrer un paiement" onClick={() => { setPay({ id: r.id, reste: restant }); setPayForm({ montant: String(restant), date: toDateInput(new Date()), mode: "" }); }}><HandCoins className="h-4 w-4" /></Button>
                      )}
                      {r.justificatif_path && (
                        <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Voir le justificatif" onClick={() => openJustificatif(r.justificatif_path!)}><Paperclip className="h-4 w-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Modifier" onClick={() => {
                        setEditId(r.id);
                        setFile(null);
                        setForm({ date_depense: r.date_depense, categorie: r.categorie, description: r.description ?? "", montant: String(r.montant), montant_paye: String(r.montant_paye), fournisseur_id: r.fournisseur_id ?? NONE });
                        setOpen(true);
                      }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Supprimer" onClick={() => { if (confirm("Supprimer cette dépense ?")) remove.mutate(r); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Date</Label><Input type="date" className="text-base md:text-sm" value={form.date_depense} onChange={(e) => setForm({ ...form, date_depense: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5"><Label>Description</Label><Input className="text-base md:text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Montant ({devise}) *</Label><Input type="number" inputMode="decimal" min="0" className="text-base md:text-sm" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
              {!editId && <div className="grid gap-1.5"><Label>Déjà payé</Label><Input type="number" inputMode="decimal" min="0" placeholder="Tout" className="text-base md:text-sm" value={form.montant_paye} onChange={(e) => setForm({ ...form, montant_paye: e.target.value })} /></div>}
            </div>
            <div className="grid gap-1.5"><Label>Fournisseur</Label>
              <Select value={form.fournisseur_id} onValueChange={(v) => setForm({ ...form, fournisseur_id: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucun</SelectItem>
                  {(data?.fournisseurs ?? []).map((f) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Justificatif (photo ou PDF, 5 Mo max)</Label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          {editId && <p className="text-xs text-muted-foreground">Les paiements se saisissent avec le bouton « Enregistrer un paiement », pour garder leur date.</p>}
          <DialogFooter><Button className="h-11" disabled={save.isPending} onClick={() => save.mutate()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Reste à payer : {formatMontant(pay?.reste ?? 0, devise)}</p>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Montant *</Label><Input type="number" inputMode="decimal" min="0" className="text-base md:text-sm" value={payForm.montant} onChange={(e) => setPayForm({ ...payForm, montant: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Date du paiement</Label><Input type="date" className="text-base md:text-sm" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Moyen (espèces, Wave…)</Label><Input className="text-base md:text-sm" value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })} /></div>
          </div>
          <DialogFooter><Button className="h-11" disabled={addPay.isPending} onClick={() => addPay.mutate()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

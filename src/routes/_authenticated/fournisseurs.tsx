import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { privateHead } from "@/lib/private-head";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMontant, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fournisseurs")({
  head: privateHead("Fournisseurs", "Vos fournisseurs, leurs achats et ce que vous leur devez."),
  component: FournisseursPage,
});

const EMPTY = { nom: "", telephone: "", email: "", adresse: "", notes: "" };

function FournisseursPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["fournisseurs", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const [f, d] = await Promise.all([
        supabase.from("fournisseurs").select("*").eq("entreprise_id", entreprise!.id).order("nom"),
        supabase
          .from("depenses")
          .select("id, fournisseur_id, date_depense, categorie, description, montant, montant_paye")
          .eq("entreprise_id", entreprise!.id)
          .not("fournisseur_id", "is", null)
          .order("date_depense", { ascending: false }),
      ]);
      if (f.error) throw f.error;
      if (d.error) throw d.error;
      return { fournisseurs: f.data, achats: d.data };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nom.trim()) throw new Error("Le nom est obligatoire.");
      const payload = {
        nom: form.nom.trim(),
        telephone: form.telephone || null,
        email: form.email || null,
        adresse: form.adresse || null,
        notes: form.notes || null,
      };
      const res = editId
        ? await supabase.from("fournisseurs").update(payload).eq("id", editId)
        : await supabase.from("fournisseurs").insert({ ...payload, entreprise_id: entreprise!.id });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Fournisseur enregistré");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["fournisseurs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fournisseurs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fournisseur supprimé");
      qc.invalidateQueries({ queryKey: ["fournisseurs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const devise = entreprise?.devise ?? "FCFA";
  const achatsDe = (id: string) => (data?.achats ?? []).filter((a) => a.fournisseur_id === id);
  const detteDe = (id: string) =>
    achatsDe(id).reduce((s, a) => s + Math.max(0, Number(a.montant) - Number(a.montant_paye)), 0);
  const detailF = data?.fournisseurs.find((f) => f.id === detail);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground">Les achats se saisissent dans Dépenses, en choisissant le fournisseur.</p>
        </div>
        <Button className="h-11" onClick={() => { setEditId(null); setForm(EMPTY); setOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Nouveau fournisseur
        </Button>
      </div>

      {(data?.fournisseurs ?? []).length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <Truck className="mx-auto mb-2 h-8 w-8" /> Aucun fournisseur pour l'instant.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Nom</th><th className="p-3">Contact</th><th className="p-3 text-right">Achats</th><th className="p-3 text-right">Reste à payer</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {data!.fournisseurs.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="p-3"><button className="font-medium underline-offset-2 hover:underline" onClick={() => setDetail(f.id)}>{f.nom}</button></td>
                  <td className="p-3 text-muted-foreground">{[f.telephone, f.email].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="p-3 text-right tabular-nums">{formatMontant(achatsDe(f.id).reduce((s, a) => s + Number(a.montant), 0), devise)}</td>
                  <td className="p-3 text-right font-medium tabular-nums">{formatMontant(detteDe(f.id), devise)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Modifier" onClick={() => { setEditId(f.id); setForm({ nom: f.nom, telephone: f.telephone ?? "", email: f.email ?? "", adresse: f.adresse ?? "", notes: f.notes ?? "" }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Supprimer" onClick={() => { if (confirm(`Supprimer ${f.nom} ? Ses achats restent dans Dépenses.`)) remove.mutate(f.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {(["nom", "telephone", "email", "adresse"] as const).map((k) => (
              <div key={k} className="grid gap-1.5">
                <Label>{{ nom: "Nom *", telephone: "Téléphone", email: "E-mail", adresse: "Adresse" }[k]}</Label>
                <Input className="text-base md:text-sm" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div className="grid gap-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button className="h-11" disabled={save.isPending} onClick={() => save.mutate()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detailF?.nom} — historique des achats</DialogTitle></DialogHeader>
          {detail && achatsDe(detail).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun achat enregistré.</p>
          ) : (
            <ul className="divide-y text-sm">
              {detail && achatsDe(detail).map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-2">
                  <span>{formatDate(a.date_depense)} · {a.description || a.categorie}</span>
                  <span className="tabular-nums">{formatMontant(Number(a.montant), devise)}{Number(a.montant_paye) < Number(a.montant) && <span className="text-destructive"> (reste {formatMontant(Number(a.montant) - Number(a.montant_paye), devise)})</span>}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

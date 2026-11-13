import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Boxes, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { privateHead } from "@/lib/private-head";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMontant, formatNumber, formatDate, toDateInput } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stocks")({
  head: privateHead("Stocks", "Suivez vos quantités en stock, entrées, sorties et alertes."),
  component: StocksPage,
});

const EMPTY = { nom: "", reference: "", unite: "unité", quantite: "0", prix_achat: "0", seuil_alerte: "0" };

function StocksPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const devise = entreprise?.devise ?? "FCFA";
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [mvt, setMvt] = useState<{ id: string; nom: string; type: "entree" | "sortie" } | null>(null);
  const [mvtForm, setMvtForm] = useState({ quantite: "", date: toDateInput(new Date()), note: "" });
  const [histo, setHisto] = useState<{ id: string; nom: string } | null>(null);

  const { data: articles = [] } = useQuery({
    queryKey: ["stocks", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_articles").select("*").eq("entreprise_id", entreprise!.id).order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { data: mouvements = [] } = useQuery({
    queryKey: ["stock-mouvements", histo?.id],
    enabled: !!histo,
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_mouvements").select("*").eq("article_id", histo!.id).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["stocks"] });
    qc.invalidateQueries({ queryKey: ["stock-mouvements"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nom.trim()) throw new Error("Le nom est obligatoire.");
      const base = { nom: form.nom.trim(), reference: form.reference || null, unite: form.unite || "unité", prix_achat: Number(form.prix_achat) || 0, seuil_alerte: Number(form.seuil_alerte) || 0 };
      if (editId) {
        const { error } = await supabase.from("stock_articles").update(base).eq("id", editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("stock_articles").insert({ ...base, entreprise_id: entreprise!.id }).select("id").single();
        if (error) throw error;
        const q = Number(form.quantite) || 0;
        if (q > 0) {
          const r = await supabase.from("stock_mouvements").insert({ article_id: data.id, type: "entree", quantite: q, note: "Stock initial" });
          if (r.error) throw r.error;
        }
      }
    },
    onSuccess: () => { toast.success("Article enregistré"); setOpen(false); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMvt = useMutation({
    mutationFn: async () => {
      const q = Number(mvtForm.quantite);
      if (!(q > 0)) throw new Error("Indiquez une quantité supérieure à 0.");
      const { error } = await supabase.from("stock_mouvements").insert({ article_id: mvt!.id, type: mvt!.type, quantite: q, date_mouvement: mvtForm.date, note: mvtForm.note || null });
      if (error) throw new Error(error.message.includes("Stock insuffisant") ? error.message : "Mouvement impossible.");
    },
    onSuccess: () => { toast.success(mvt?.type === "entree" ? "Entrée enregistrée" : "Sortie enregistrée"); setMvt(null); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Article supprimé"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const valeur = articles.reduce((s, a) => s + Number(a.quantite) * Number(a.prix_achat), 0);
  const alertes = articles.filter((a) => Number(a.seuil_alerte) > 0 && Number(a.quantite) <= Number(a.seuil_alerte));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stocks</h1>
          <p className="text-sm text-muted-foreground">Valeur du stock (prix d'achat) : {formatMontant(valeur, devise)}</p>
        </div>
        <Button className="h-11" onClick={() => { setEditId(null); setForm(EMPTY); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Nouvel article</Button>
      </div>

      {alertes.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p><span className="font-medium">Stock bas :</span> {alertes.map((a) => `${a.nom} (${formatNumber(a.quantite)})`).join(", ")}</p>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground"><Boxes className="mx-auto mb-2 h-8 w-8" /> Aucun article en stock.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Article</th><th className="p-3 text-right">Quantité</th><th className="p-3 text-right">Prix d'achat</th><th className="p-3 text-right">Valeur</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const bas = Number(a.seuil_alerte) > 0 && Number(a.quantite) <= Number(a.seuil_alerte);
                return (
                  <tr key={a.id} className="border-t">
                    <td className="p-3"><button className="font-medium hover:underline" onClick={() => setHisto({ id: a.id, nom: a.nom })}>{a.nom}</button>{a.reference && <div className="text-xs text-muted-foreground">{a.reference}</div>}</td>
                    <td className={`p-3 text-right tabular-nums ${bas ? "font-semibold text-destructive" : ""}`}>{formatNumber(a.quantite)} {a.unite}</td>
                    <td className="p-3 text-right tabular-nums">{formatMontant(Number(a.prix_achat), devise)}</td>
                    <td className="p-3 text-right tabular-nums">{formatMontant(Number(a.quantite) * Number(a.prix_achat), devise)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Entrée" onClick={() => { setMvt({ id: a.id, nom: a.nom, type: "entree" }); setMvtForm({ quantite: "", date: toDateInput(new Date()), note: "" }); }}><ArrowDownToLine className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Sortie" onClick={() => { setMvt({ id: a.id, nom: a.nom, type: "sortie" }); setMvtForm({ quantite: "", date: toDateInput(new Date()), note: "" }); }}><ArrowUpFromLine className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Modifier" onClick={() => { setEditId(a.id); setForm({ nom: a.nom, reference: a.reference ?? "", unite: a.unite, quantite: String(a.quantite), prix_achat: String(a.prix_achat), seuil_alerte: String(a.seuil_alerte) }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Supprimer" onClick={() => { if (confirm(`Supprimer ${a.nom} et son historique ?`)) remove.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? "Modifier l'article" : "Nouvel article"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Nom *</Label><Input className="text-base md:text-sm" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Référence</Label><Input className="text-base md:text-sm" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Unité</Label><Input className="text-base md:text-sm" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} /></div>
              {!editId && <div className="grid gap-1.5"><Label>Quantité initiale</Label><Input type="number" min="0" className="text-base md:text-sm" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} /></div>}
              <div className="grid gap-1.5"><Label>Prix d'achat ({devise})</Label><Input type="number" min="0" className="text-base md:text-sm" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Seuil d'alerte</Label><Input type="number" min="0" className="text-base md:text-sm" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} /></div>
            </div>
            {editId && <p className="text-xs text-muted-foreground">La quantité se modifie avec les boutons Entrée et Sortie, pour garder l'historique.</p>}
          </div>
          <DialogFooter><Button className="h-11" disabled={save.isPending} onClick={() => save.mutate()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mvt} onOpenChange={(o) => !o && setMvt(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{mvt?.type === "entree" ? "Entrée en stock" : "Sortie de stock"} — {mvt?.nom}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Quantité *</Label><Input type="number" min="0" inputMode="decimal" className="text-base md:text-sm" value={mvtForm.quantite} onChange={(e) => setMvtForm({ ...mvtForm, quantite: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Date</Label><Input type="date" className="text-base md:text-sm" value={mvtForm.date} onChange={(e) => setMvtForm({ ...mvtForm, date: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Note</Label><Input className="text-base md:text-sm" value={mvtForm.note} onChange={(e) => setMvtForm({ ...mvtForm, note: e.target.value })} /></div>
          </div>
          <DialogFooter><Button className="h-11" disabled={addMvt.isPending} onClick={() => addMvt.mutate()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!histo} onOpenChange={(o) => !o && setHisto(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Historique — {histo?.nom}</DialogTitle></DialogHeader>
          {mouvements.length === 0 ? <p className="text-sm text-muted-foreground">Aucun mouvement.</p> : (
            <ul className="divide-y text-sm">
              {mouvements.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-2">
                  <span>{formatDate(m.date_mouvement)}{m.note ? ` · ${m.note}` : ""}</span>
                  <span className={m.type === "entree" ? "text-primary" : "text-destructive"}>{m.type === "entree" ? "+" : "−"}{formatNumber(m.quantite)}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

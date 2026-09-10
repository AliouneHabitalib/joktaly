import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/private-head";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { formatMontant } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/produits")({
  head: privateHead("Mes produits et services", "Gérez votre catalogue de produits et services réutilisables dans vos devis et factures."),
  component: ProduitsPage,
});

type ProduitRow = {
  id: string;
  nom: string;
  type: "produit" | "service";
  description: string | null;
  prix_unitaire: number;
  unite: string;
  tva_applicable: boolean;
};

const UNITES = ["unité", "heure", "jour", "mois", "forfait", "kg", "m²", "m³"];

const EMPTY_FORM = {
  nom: "",
  type: "service" as "produit" | "service",
  description: "",
  prix_unitaire: "",
  unite: "unité",
  tva_applicable: true,
};

function ProduitsPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "produit" | "service">("all");
  const [editing, setEditing] = useState<ProduitRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ProduitRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["produits", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produits_services")
        .select("*")
        .eq("entreprise_id", entreprise!.id)
        .order("nom");
      if (error) throw error;
      return data as ProduitRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filterType !== "all" && p.type !== filterType) return false;
      if (!q) return true;
      return (
        p.nom.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, filterType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!entreprise?.id) throw new Error("Aucune entreprise");
      const prix = parseFloat(form.prix_unitaire) || 0;
      const payload = {
        nom: form.nom,
        type: form.type,
        description: form.description || null,
        prix_unitaire: prix,
        unite: form.unite,
        tva_applicable: form.tva_applicable,
      };
      if (editing) {
        const { error } = await supabase
          .from("produits_services")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("produits_services")
          .insert({ ...payload, entreprise_id: entreprise.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Article modifié" : "Article ajouté");
      qc.invalidateQueries({ queryKey: ["produits"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produits_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article supprimé");
      qc.invalidateQueries({ queryKey: ["produits"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: ProduitRow) => {
    setEditing(p);
    setForm({
      nom: p.nom,
      type: p.type,
      description: p.description ?? "",
      prix_unitaire: String(p.prix_unitaire),
      unite: p.unite,
      tva_applicable: p.tva_applicable,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produits & services</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} article{items.length > 1 ? "s" : ""} au catalogue
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Nouvel article
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {(["all", "produit", "service"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filterType === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "Tous" : t === "produit" ? "Produits" : "Services"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold">
            {search || filterType !== "all"
              ? "Aucun article trouvé"
              : "Aucun article au catalogue"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || filterType !== "all"
              ? "Essayez d'autres critères."
              : "Ajoutez vos produits et services pour les insérer rapidement dans vos devis."}
          </p>
          {!search && filterType === "all" && (
            <Button className="mt-6" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Ajouter un article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.type === "produit"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    {p.type === "produit" ? "Produit" : "Service"}
                  </span>
                  <h3 className="mt-2 truncate font-semibold">{p.nom}</h3>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {p.description}
                </p>
              )}
              <div className="mt-4 flex items-baseline justify-between border-t pt-3">
                <span className="text-lg font-bold tabular-nums">
                  {formatMontant(p.prix_unitaire)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {p.unite} {p.tva_applicable ? "· TVA" : "· HT"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
            <DialogDescription>
              Produit ou service réutilisable dans vos devis et factures.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as "produit" | "service" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="produit">Produit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Unité</Label>
                <Select value={form.unite} onValueChange={(v) => setForm({ ...form, unite: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITES.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Prix unitaire (FCFA)</Label>
              <Input
                type="number"
                value={form.prix_unitaire}
                onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">TVA applicable</Label>
                <p className="text-xs text-muted-foreground">Ajoute la TVA au prix dans les devis</p>
              </div>
              <Switch
                checked={form.tva_applicable}
                onCheckedChange={(c) => setForm({ ...form, tva_applicable: c })}
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.nom.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les devis et factures déjà créés ne seront pas affectés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
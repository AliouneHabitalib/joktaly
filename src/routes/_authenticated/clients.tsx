import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { formatMontant } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clients")({
  component: ClientsPage,
});

type ClientRow = {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise_nom: string | null;
  email: string | null;
  telephone: string | null;
  whatsapp: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  notes: string | null;
};

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  entreprise_nom: "",
  email: "",
  telephone: "",
  whatsapp: "",
  adresse: "",
  ville: "",
  pays: "Sénégal",
  notes: "",
};

function ClientsPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ClientRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("entreprise_id", entreprise!.id)
        .order("nom");
      if (error) throw error;
      return data as ClientRow[];
    },
  });

  // Aggregated stats per client (devis + factures)
  const { data: stats = {} } = useQuery({
    queryKey: ["clients-stats", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const [devisRes, facturesRes] = await Promise.all([
        supabase.from("devis").select("client_id").eq("entreprise_id", entreprise!.id),
        supabase
          .from("factures")
          .select("client_id,total_ttc,montant_paye")
          .eq("entreprise_id", entreprise!.id),
      ]);
      const map: Record<string, { devis: number; factures: number; total: number; paye: number }> = {};
      (devisRes.data ?? []).forEach((d) => {
        const m = (map[d.client_id] ??= { devis: 0, factures: 0, total: 0, paye: 0 });
        m.devis += 1;
      });
      (facturesRes.data ?? []).forEach((f) => {
        const m = (map[f.client_id] ??= { devis: 0, factures: 0, total: 0, paye: 0 });
        m.factures += 1;
        m.total += Number(f.total_ttc);
        m.paye += Number(f.montant_paye);
      });
      return map;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.nom, c.prenom, c.entreprise_nom, c.email, c.telephone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!entreprise?.id) throw new Error("Aucune entreprise");
      const payload = {
        ...form,
        prenom: form.prenom || null,
        entreprise_nom: form.entreprise_nom || null,
        email: form.email || null,
        telephone: form.telephone || null,
        whatsapp: form.whatsapp || null,
        adresse: form.adresse || null,
        ville: form.ville || null,
        notes: form.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ ...payload, entreprise_id: entreprise.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Client modifié" : "Client ajouté");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client supprimé");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: ClientRow) => {
    setEditing(c);
    setForm({
      nom: c.nom,
      prenom: c.prenom ?? "",
      entreprise_nom: c.entreprise_nom ?? "",
      email: c.email ?? "",
      telephone: c.telephone ?? "",
      whatsapp: c.whatsapp ?? "",
      adresse: c.adresse ?? "",
      ville: c.ville ?? "",
      pays: c.pays ?? "Sénégal",
      notes: c.notes ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length > 1 ? "s" : ""} enregistré{clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Nouveau client
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold">
            {search ? "Aucun client trouvé" : "Aucun client pour le moment"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Essayez un autre terme de recherche." : "Ajoutez votre premier client pour commencer à facturer."}
          </p>
          {!search && (
            <Button className="mt-6" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Ajouter un client
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-right">Devis</th>
                  <th className="px-4 py-3 text-right">Factures</th>
                  <th className="px-4 py-3 text-right">Reste dû</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => {
                  const s = stats[c.id] ?? { devis: 0, factures: 0, total: 0, paye: 0 };
                  const reste = s.total - s.paye;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                        </div>
                        {c.entreprise_nom && (
                          <div className="text-xs text-muted-foreground">{c.entreprise_nom}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.email && <div>{c.email}</div>}
                        {c.telephone && <div className="text-xs text-muted-foreground">{c.telephone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.devis}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.factures}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {reste > 0 ? (
                          <span className="font-medium text-accent">{formatMontant(reste)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setToDelete(c)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>Informations du client pour vos devis et factures.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
            <Field label="Prénom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
            <Field
              label="Entreprise / Organisation"
              value={form.entreprise_nom}
              onChange={(v) => setForm({ ...form, entreprise_nom: v })}
              className="sm:col-span-2"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Téléphone"
              value={form.telephone}
              onChange={(v) => setForm({ ...form, telephone: v })}
            />
            <Field
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(v) => setForm({ ...form, whatsapp: v })}
            />
            <Field label="Ville" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} />
            <Field
              label="Adresse"
              value={form.adresse}
              onChange={(v) => setForm({ ...form, adresse: v })}
              className="sm:col-span-2"
            />
            <Field label="Pays" value={form.pays} onChange={(v) => setForm({ ...form, pays: v })} />
            <div className="sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les devis et factures associés ne seront pas supprimés.
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
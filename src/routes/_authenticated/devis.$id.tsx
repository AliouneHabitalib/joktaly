import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowLeft, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { formatMontant, addDays, toDateInput } from "@/lib/format";
import { calculerTotaux, type LigneDraft } from "@/lib/devis-facture-shared";
import { buildPdfDoc } from "@/lib/devis-facture-shared";
import { downloadPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/devis/$id")({
  component: DevisEditorPage,
});

const newLigne = (): LigneDraft => ({
  id: crypto.randomUUID(),
  description: "",
  quantite: 1,
  unite: "unité",
  prix_unitaire: 0,
  tva_taux: 18,
});

function DevisEditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [clientId, setClientId] = useState<string>("");
  const [titre, setTitre] = useState("");
  const [objet, setObjet] = useState("");
  const [dateEmission, setDateEmission] = useState(toDateInput(new Date()));
  const [dateValidite, setDateValidite] = useState(toDateInput(addDays(new Date(), 30)));
  const [statut, setStatut] = useState<"brouillon" | "envoye" | "accepte" | "refuse" | "expire">("brouillon");
  const [tvaActive, setTvaActive] = useState(true);
  const [tvaTaux, setTvaTaux] = useState(18);
  const [remisePourcent, setRemisePourcent] = useState(0);
  const [notes, setNotes] = useState("");
  const [conditions, setConditions] = useState("");
  const [lignes, setLignes] = useState<LigneDraft[]>([newLigne()]);

  // Load clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom, prenom, entreprise_nom")
        .eq("entreprise_id", entreprise!.id)
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  // Load produits for quick add
  const { data: produits = [] } = useQuery({
    queryKey: ["produits-quick", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produits_services")
        .select("id, nom, prix_unitaire, unite, tva_applicable")
        .eq("entreprise_id", entreprise!.id);
      if (error) throw error;
      return data;
    },
  });

  // Load existing devis
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["devis", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devis")
        .select("*, devis_lignes(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setClientId(existing.client_id);
      setTitre(existing.titre ?? "");
      setObjet(existing.objet ?? "");
      setDateEmission(existing.date_emission);
      setDateValidite(existing.date_validite);
      setStatut(existing.statut);
      setTvaActive(existing.tva_active);
      setTvaTaux(Number(existing.tva_taux));
      setRemisePourcent(Number(existing.remise_pourcent));
      setNotes(existing.notes ?? "");
      setConditions(existing.conditions_paiement ?? "");
      const lgs = (existing.devis_lignes ?? [])
        .sort((a: any, b: any) => a.ordre - b.ordre)
        .map((l: any) => ({
          id: l.id,
          description: l.description,
          quantite: Number(l.quantite),
          unite: l.unite,
          prix_unitaire: Number(l.prix_unitaire),
          tva_taux: Number(l.tva_taux),
        }));
      if (lgs.length) setLignes(lgs);
    }
  }, [existing]);

  const totaux = useMemo(
    () => calculerTotaux(lignes, tvaActive, remisePourcent),
    [lignes, tvaActive, remisePourcent],
  );

  const updateLigne = (idx: number, patch: Partial<LigneDraft>) => {
    setLignes((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const ajouterProduit = (produitId: string) => {
    const p = produits.find((x) => x.id === produitId);
    if (!p) return;
    setLignes((prev) => [
      ...prev.filter((l) => l.description.trim() || l.prix_unitaire > 0),
      {
        id: crypto.randomUUID(),
        description: p.nom,
        quantite: 1,
        unite: p.unite,
        prix_unitaire: Number(p.prix_unitaire),
        tva_taux: p.tva_applicable ? tvaTaux : 0,
      },
    ]);
  };

  const save = useMutation({
    mutationFn: async (opts: { thenDownload?: boolean } = {}) => {
      if (!entreprise?.id) throw new Error("Aucune entreprise");
      if (!clientId) throw new Error("Sélectionnez un client");
      const lignesClean = lignes.filter((l) => l.description.trim());
      if (lignesClean.length === 0) throw new Error("Ajoutez au moins une ligne");

      const lignesPayload = lignesClean.map((l, i) => {
        const ht = l.quantite * l.prix_unitaire;
        const ttc = ht + (tvaActive ? ht * (l.tva_taux / 100) : 0);
        return {
          description: l.description,
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire: l.prix_unitaire,
          tva_taux: l.tva_taux,
          total_ht: Math.round(ht * 100) / 100,
          total_ttc: Math.round(ttc * 100) / 100,
          ordre: i,
        };
      });

      const devisData = {
        entreprise_id: entreprise.id,
        client_id: clientId,
        titre: titre || null,
        objet: objet || null,
        date_emission: dateEmission,
        date_validite: dateValidite,
        statut,
        tva_active: tvaActive,
        tva_taux: tvaTaux,
        remise_pourcent: remisePourcent,
        remise_montant: totaux.remise_montant,
        sous_total: totaux.sous_total,
        montant_tva: totaux.montant_tva,
        total_ttc: totaux.total_ttc,
        notes: notes || null,
        conditions_paiement: conditions || null,
      };

      let devisId = id;
      if (isNew) {
        const { data: numero, error: nerr } = await supabase.rpc("next_devis_numero", {
          _entreprise_id: entreprise.id,
        });
        if (nerr) throw nerr;
        const { data: created, error } = await supabase
          .from("devis")
          .insert({ ...devisData, numero: numero as string })
          .select()
          .single();
        if (error) throw error;
        devisId = created.id;
      } else {
        const { error } = await supabase.from("devis").update(devisData).eq("id", id);
        if (error) throw error;
        await supabase.from("devis_lignes").delete().eq("devis_id", id);
      }

      const { error: lerr } = await supabase
        .from("devis_lignes")
        .insert(lignesPayload.map((l) => ({ ...l, devis_id: devisId })));
      if (lerr) throw lerr;

      return { devisId, thenDownload: opts.thenDownload };
    },
    onSuccess: async ({ devisId, thenDownload }) => {
      toast.success(isNew ? "Devis créé" : "Devis enregistré");
      qc.invalidateQueries({ queryKey: ["devis"] });
      if (thenDownload && entreprise) {
        try {
          const pdfDoc = await buildPdfDoc({ type: "devis", id: devisId, entreprise });
          downloadPdf(pdfDoc);
        } catch (e) {
          toast.error((e as Error).message);
        }
      }
      navigate({ to: "/devis" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isNew && loadingExisting) {
    return <div className="text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/devis">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "Nouveau devis" : `Devis ${existing?.numero ?? ""}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Remplissez les informations puis enregistrez.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="outline"
              onClick={() => save.mutate({ thenDownload: true })}
              disabled={save.isPending}
            >
              <Download className="mr-1 h-4 w-4" /> Enregistrer + PDF
            </Button>
          )}
          <Button onClick={() => save.mutate({})} disabled={save.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* En-tête infos */}
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Informations
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    Aucun client. Créez-en d'abord depuis l'onglet Clients.
                  </div>
                ) : (
                  clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.entreprise_nom || `${c.prenom ?? ""} ${c.nom}`.trim()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Statut</Label>
            <Select value={statut} onValueChange={(v) => setStatut(v as typeof statut)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Titre (interne)</Label>
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Projet site web" />
          </div>
          <div>
            <Label className="text-xs">Objet (visible sur le PDF)</Label>
            <Input value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Ex : Création de site vitrine" />
          </div>
          <div>
            <Label className="text-xs">Date d'émission</Label>
            <Input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Valable jusqu'au</Label>
            <Input type="date" value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lignes du devis
          </h2>
          {produits.length > 0 && (
            <Select onValueChange={ajouterProduit}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="+ Ajouter depuis le catalogue" />
              </SelectTrigger>
              <SelectContent>
                {produits.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} — {formatMontant(p.prix_unitaire, entreprise?.devise ?? "FCFA")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          {lignes.map((l, i) => {
            const ht = l.quantite * l.prix_unitaire;
            return (
              <div
                key={l.id}
                className="grid grid-cols-12 gap-2 rounded-lg border bg-background p-3"
              >
                <div className="col-span-12 md:col-span-5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={l.description}
                    onChange={(e) => updateLigne(i, { description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Label className="text-xs">Qté</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.quantite}
                    onChange={(e) => updateLigne(i, { quantite: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Label className="text-xs">Unité</Label>
                  <Input
                    value={l.unite}
                    onChange={(e) => updateLigne(i, { unite: e.target.value })}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">P.U.</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.prix_unitaire}
                    onChange={(e) =>
                      updateLigne(i, { prix_unitaire: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label className="text-xs">Total HT</Label>
                  <div className="flex h-9 items-center justify-end rounded-md border bg-muted/30 px-3 text-sm tabular-nums">
                    {formatMontant(ht, entreprise?.devise ?? "FCFA")}
                  </div>
                </div>
                <div className="col-span-6 flex items-end md:col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLignes((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={lignes.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="mt-3"
          onClick={() => setLignes((prev) => [...prev, newLigne()])}
        >
          <Plus className="mr-1 h-4 w-4" /> Ajouter une ligne
        </Button>
      </div>

      {/* Totaux & options */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] md:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Options
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>TVA applicable</Label>
                <p className="text-xs text-muted-foreground">
                  Désactivez si vous n'êtes pas assujetti à la TVA.
                </p>
              </div>
              <Switch checked={tvaActive} onCheckedChange={setTvaActive} />
            </div>
            {tvaActive && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Taux TVA par défaut (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={tvaTaux}
                    onChange={(e) => setTvaTaux(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Remise globale (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={remisePourcent}
                    onChange={(e) => setRemisePourcent(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs">Conditions de paiement</Label>
              <Textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Ex : 50% à la commande, solde à la livraison"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques visibles sur le devis"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Récapitulatif
          </h2>
          <div className="space-y-2 text-sm">
            <Row label="Sous-total HT" value={formatMontant(totaux.sous_total, entreprise?.devise ?? "FCFA")} />
            {remisePourcent > 0 && (
              <Row
                label={`Remise (${remisePourcent}%)`}
                value={`- ${formatMontant(totaux.remise_montant, entreprise?.devise ?? "FCFA")}`}
              />
            )}
            {tvaActive && (
              <Row label="TVA" value={formatMontant(totaux.montant_tva, entreprise?.devise ?? "FCFA")} />
            )}
            <div className="my-3 border-t" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total TTC</span>
              <span className="text-xl font-bold tabular-nums text-primary">
                {formatMontant(totaux.total_ttc, entreprise?.devise ?? "FCFA")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
  Download,
  MessageCircle,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { formatMontant, formatDate } from "@/lib/format";
import { buildPdfDoc } from "@/lib/devis-facture-shared";

export const Route = createFileRoute("/_authenticated/devis/")({
  component: DevisListPage,
});

type DevisRow = {
  id: string;
  numero: string;
  titre: string | null;
  objet: string | null;
  date_emission: string;
  date_validite: string;
  statut: "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
  total_ttc: number;
  client_id: string;
  clients: { nom: string; prenom: string | null; entreprise_nom: string | null } | null;
};

const STATUT_LABEL: Record<DevisRow["statut"], string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

const STATUT_CLASS: Record<DevisRow["statut"], string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  accepte: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  refuse: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  expire: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function DevisListPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<string>("all");
  const [toDelete, setToDelete] = useState<DevisRow | null>(null);
  const [converting, setConverting] = useState<DevisRow | null>(null);

  const { data: devis = [], isLoading } = useQuery({
    queryKey: ["devis", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devis")
        .select("*, clients(nom, prenom, entreprise_nom)")
        .eq("entreprise_id", entreprise!.id)
        .order("date_emission", { ascending: false });
      if (error) throw error;
      return data as DevisRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devis.filter((d) => {
      if (statut !== "all" && d.statut !== statut) return false;
      if (!q) return true;
      const clientName = d.clients
        ? `${d.clients.prenom ?? ""} ${d.clients.nom} ${d.clients.entreprise_nom ?? ""}`.toLowerCase()
        : "";
      return (
        d.numero.toLowerCase().includes(q) ||
        (d.titre ?? "").toLowerCase().includes(q) ||
        (d.objet ?? "").toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });
  }, [devis, search, statut]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Devis supprimé");
      qc.invalidateQueries({ queryKey: ["devis"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = (d: DevisRow) => {
    // Ouvre la page d'aperçu HTML qui déclenche window.print() (export PDF natif navigateur)
    window.open(`/print/devis/${d.id}`, "_blank", "noopener");
  };

  const handleWhatsapp = async (d: DevisRow) => {
    if (!entreprise) return;
    const { data: client } = await supabase
      .from("clients")
      .select("whatsapp, telephone, nom, prenom")
      .eq("id", d.client_id)
      .single();
    const phoneRaw = client?.whatsapp || client?.telephone;
    if (!phoneRaw) {
      toast.error("Aucun numéro WhatsApp/téléphone pour ce client");
      return;
    }
    const phone = phoneRaw.replace(/\D/g, "");
    const greeting = `Bonjour ${client?.prenom ?? client?.nom ?? ""}`.trim();
    const msg = `${greeting},\n\nVeuillez trouver ci-joint le devis ${d.numero} d'un montant de ${formatMontant(d.total_ttc, entreprise.devise ?? "FCFA")}.\n\nCordialement,\n${entreprise.nom}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleConvert = async (d: DevisRow) => {
    if (!entreprise) return;
    try {
      // Fetch devis + lignes
      const { data: full, error: e1 } = await supabase
        .from("devis")
        .select("*, devis_lignes(*)")
        .eq("id", d.id)
        .single();
      if (e1 || !full) throw e1 ?? new Error("Devis introuvable");

      // Generate numero
      const { data: numero, error: nerr } = await supabase.rpc("next_facture_numero", {
        _entreprise_id: entreprise.id,
      });
      if (nerr) throw nerr;

      const { data: facture, error: e2 } = await supabase
        .from("factures")
        .insert({
          entreprise_id: entreprise.id,
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

      const lignes = (full.devis_lignes ?? []).map((l: any) => ({
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

      // Mark devis as accepte
      await supabase.from("devis").update({ statut: "accepte" }).eq("id", d.id);

      toast.success(`Facture ${numero} créée`);
      setConverting(null);
      navigate({ to: "/factures" });
    } catch (e) {
      toast.error((e as Error).message);
      setConverting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-sm text-muted-foreground">
            {devis.length} devis au total
          </p>
        </div>
        <Button asChild>
          <Link to="/devis/$id" params={{ id: "new" }}>
            <Plus className="mr-1 h-4 w-4" /> Nouveau devis
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="envoye">Envoyé</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold">
            {search || statut !== "all" ? "Aucun devis trouvé" : "Aucun devis pour le moment"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statut !== "all"
              ? "Essayez d'autres filtres."
              : "Créez votre premier devis en quelques secondes."}
          </p>
          {!search && statut === "all" && (
            <Button className="mt-6" asChild>
              <Link to="/devis/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-4 w-4" /> Créer un devis
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Numéro</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((d) => {
                  const clientName = d.clients
                    ? d.clients.entreprise_nom ||
                      `${d.clients.prenom ?? ""} ${d.clients.nom}`.trim()
                    : "—";
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to="/devis/$id"
                          params={{ id: d.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {d.numero}
                        </Link>
                        {d.titre && (
                          <div className="text-xs text-muted-foreground">{d.titre}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{clientName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(d.date_emission)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_CLASS[d.statut]}`}
                        >
                          {STATUT_LABEL[d.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatMontant(d.total_ttc, entreprise?.devise ?? "FCFA")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate({ to: "/devis/$id", params: { id: d.id } })}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(d)}>
                              <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWhatsapp(d)}>
                              <MessageCircle className="mr-2 h-4 w-4" /> Envoyer WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConverting(d)}>
                              <FileCheck2 className="mr-2 h-4 w-4" /> Convertir en facture
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setToDelete(d)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis {toDelete?.numero} et ses lignes seront supprimés définitivement.
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

      <AlertDialog open={!!converting} onOpenChange={(o) => !o && setConverting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une nouvelle facture sera créée à partir du devis {converting?.numero}, avec les mêmes lignes et montants. Le devis sera marqué comme "Accepté".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => converting && handleConvert(converting)}>
              Convertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
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
  Receipt,
  Pencil,
  Trash2,
  Download,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatMontant, formatDate } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf";
import { buildPdfDoc } from "@/lib/devis-facture-shared";
import { buildDocumentMessage } from "@/lib/whatsapp";
import { WhatsappShareDialog, type WhatsappSharePayload } from "@/components/whatsapp-share-dialog";
import { ListSkeleton } from "./devis.index";

export const Route = createFileRoute("/_authenticated/factures/")({
  component: FacturesListPage,
});

type FactureRow = {
  id: string;
  numero: string;
  titre: string | null;
  objet: string | null;
  date_emission: string;
  date_echeance: string;
  statut: "non_payee" | "partiellement_payee" | "payee" | "annulee";
  total_ttc: number;
  montant_paye: number;
  client_id: string;
  clients: { nom: string; prenom: string | null; entreprise_nom: string | null } | null;
};

const STATUT_LABEL: Record<FactureRow["statut"], string> = {
  non_payee: "Non payée",
  partiellement_payee: "Partielle",
  payee: "Payée",
  annulee: "Annulée",
};

const STATUT_CLASS: Record<FactureRow["statut"], string> = {
  non_payee: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  partiellement_payee: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  payee: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  annulee: "bg-muted text-muted-foreground",
};

function FacturesListPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<string>("all");
  const [toDelete, setToDelete] = useState<FactureRow | null>(null);
  const [waPayload, setWaPayload] = useState<WhatsappSharePayload | null>(null);

  const { data: factures = [], isLoading } = useQuery({
    queryKey: ["factures", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select("*, clients(nom, prenom, entreprise_nom)")
        .eq("entreprise_id", entreprise!.id)
        .order("date_emission", { ascending: false });
      if (error) throw error;
      return data as FactureRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return factures.filter((f) => {
      if (statut !== "all" && f.statut !== statut) return false;
      if (!q) return true;
      const clientName = f.clients
        ? `${f.clients.prenom ?? ""} ${f.clients.nom} ${f.clients.entreprise_nom ?? ""}`.toLowerCase()
        : "";
      return (
        f.numero.toLowerCase().includes(q) ||
        (f.titre ?? "").toLowerCase().includes(q) ||
        (f.objet ?? "").toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });
  }, [factures, search, statut]);

  const totals = useMemo(() => {
    let total = 0;
    let paye = 0;
    for (const f of factures) {
      if (f.statut === "annulee") continue;
      total += Number(f.total_ttc);
      paye += Number(f.montant_paye);
    }
    return { total, paye, du: total - paye };
  }, [factures]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("factures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Facture supprimée");
      qc.invalidateQueries({ queryKey: ["factures"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = async (f: FactureRow) => {
    if (!entreprise) return;
    try {
      const pdfDoc = await buildPdfDoc({ type: "facture", id: f.id, entreprise });
      downloadPdf(pdfDoc);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleWhatsapp = async (f: FactureRow) => {
    if (!entreprise) return;
    const { data: client } = await supabase
      .from("clients")
      .select("whatsapp, telephone, nom, prenom")
      .eq("id", f.client_id)
      .single();
    setWaPayload({
      phone: client?.whatsapp || client?.telephone || "",
      title: `Envoyer la facture ${f.numero}`,
      message: buildDocumentMessage({
        type: "facture",
        numero: f.numero,
        montant: Number(f.total_ttc),
        reste: Number(f.total_ttc) - Number(f.montant_paye),
        devise: entreprise.devise,
        clientNom: client?.prenom || client?.nom || null,
        entrepriseNom: entreprise.nom,
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-sm text-muted-foreground">{factures.length} facture(s)</p>
        </div>
        <Button asChild>
          <Link to="/factures/$id" params={{ id: "new" }}>
            <Plus className="mr-1 h-4 w-4" /> Nouvelle facture
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase text-muted-foreground">Total facturé</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatMontant(totals.total, entreprise?.devise ?? "FCFA")}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase text-muted-foreground">Encaissé</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
            {formatMontant(totals.paye, entreprise?.devise ?? "FCFA")}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase text-muted-foreground">Reste dû</p>
          <p className="mt-1 text-xl font-bold text-amber-600 tabular-nums">
            {formatMontant(totals.du, entreprise?.devise ?? "FCFA")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture…"
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
            <SelectItem value="non_payee">Non payées</SelectItem>
            <SelectItem value="partiellement_payee">Partiellement payées</SelectItem>
            <SelectItem value="payee">Payées</SelectItem>
            <SelectItem value="annulee">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold">
            {search || statut !== "all"
              ? "Aucune facture trouvée"
              : "Aucune facture pour le moment"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statut !== "all"
              ? "Essayez d'autres filtres."
              : "Créez votre première facture, ou convertissez un devis accepté."}
          </p>
          {!search && statut === "all" && (
            <Button className="mt-6" asChild>
              <Link to="/factures/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-4 w-4" /> Créer une facture
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
                  <th className="px-4 py-3 text-left">Échéance</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-right">Reste</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((f) => {
                  const clientName = f.clients
                    ? f.clients.entreprise_nom ||
                      `${f.clients.prenom ?? ""} ${f.clients.nom}`.trim()
                    : "—";
                  const reste = Number(f.total_ttc) - Number(f.montant_paye);
                  const enRetard =
                    f.statut !== "payee" &&
                    f.statut !== "annulee" &&
                    new Date(f.date_echeance) < new Date();
                  return (
                    <tr key={f.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to="/factures/$id"
                          params={{ id: f.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {f.numero}
                        </Link>
                        {f.titre && (
                          <div className="text-xs text-muted-foreground">{f.titre}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{clientName}</td>
                      <td className="px-4 py-3">
                        <span className={enRetard ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {formatDate(f.date_echeance)}
                          {enRetard && " (retard)"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_CLASS[f.statut]}`}
                        >
                          {STATUT_LABEL[f.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatMontant(f.total_ttc, entreprise?.devise ?? "FCFA")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {reste > 0
                          ? formatMontant(reste, entreprise?.devise ?? "FCFA")
                          : "—"}
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
                              onClick={() =>
                                navigate({ to: "/factures/$id", params: { id: f.id } })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/factures/$id",
                                  params: { id: f.id },
                                  hash: "paiements",
                                })
                              }
                            >
                              <Wallet className="mr-2 h-4 w-4" /> Enregistrer un paiement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(f)}>
                              <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWhatsapp(f)}>
                              <MessageCircle className="mr-2 h-4 w-4" /> Envoyer WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setToDelete(f)}
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
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture {toDelete?.numero}, ses lignes et ses paiements seront supprimés définitivement.
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
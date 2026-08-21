import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Receipt, Wallet, Mail, Phone, MapPin } from "lucide-react";
import { formatMontant, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clients/$id")({
  component: ClientDetailPage,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ClientDetailPage() {
  const { id } = Route.useParams();
  const valid = UUID_RE.test(id);
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const devise = entreprise?.devise ?? "FCFA";

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-detail", id],
    enabled: valid,
    retry: false,
    queryFn: async () => {
      const [clientRes, devisRes, facturesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).single(),
        supabase
          .from("devis")
          .select("id, numero, date_emission, statut, total_ttc")
          .eq("client_id", id)
          .order("date_emission", { ascending: false }),
        supabase
          .from("factures")
          .select("id, numero, date_emission, date_echeance, statut, total_ttc, montant_paye")
          .eq("client_id", id)
          .order("date_emission", { ascending: false }),
      ]);
      if (clientRes.error) throw clientRes.error;
      const factures = facturesRes.data ?? [];
      const factureIds = factures.map((f) => f.id);
      const paiements = factureIds.length
        ? (
            await supabase
              .from("paiements")
              .select("id, montant, date_paiement, mode, reference, facture_id")
              .in("facture_id", factureIds)
              .order("date_paiement", { ascending: false })
          ).data ?? []
        : [];
      return { client: clientRes.data, devis: devisRes.data ?? [], factures, paiements };
    },
  });

  if (!valid || error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold">Client introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ce client n'existe plus ou le lien est incorrect.</p>
        <Button className="mt-6" asChild>
          <Link to="/clients">Retour aux clients</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { client, devis, factures, paiements } = data;
  const actives = factures.filter((f) => f.statut !== "annulee");
  const totalFacture = actives.reduce((s, f) => s + Number(f.total_ttc), 0);
  const totalPaye = actives.reduce((s, f) => s + Number(f.montant_paye), 0);
  const resteDu = totalFacture - totalPaye;
  const nomAffiche = client.entreprise_nom || `${client.prenom ?? ""} ${client.nom}`.trim();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{nomAffiche}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {client.entreprise_nom ? `${client.prenom ?? ""} ${client.nom}`.trim() : (client.ville ?? client.pays ?? "Client")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total facturé" value={formatMontant(totalFacture, devise)} icon={Receipt} />
        <StatCard label="Encaissé" value={formatMontant(totalPaye, devise)} icon={Wallet} tone="ok" />
        <StatCard label="Reste dû" value={formatMontant(resteDu, devise)} icon={Wallet} tone={resteDu > 0 ? "warn" : undefined} />
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold">Coordonnées</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {client.email && <Info icon={Mail} value={client.email} />}
          {client.telephone && <Info icon={Phone} value={client.telephone} />}
          {client.whatsapp && <Info icon={Phone} value={`WhatsApp : ${client.whatsapp}`} />}
          {(client.adresse || client.ville || client.pays) && (
            <Info icon={MapPin} value={[client.adresse, client.ville, client.pays].filter(Boolean).join(", ")} />
          )}
        </div>
        {client.notes && <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{client.notes}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Devis ({devis.length})
            </h2>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/devis/$id" params={{ id: "new" }}>Nouveau</Link>
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {devis.length === 0 && <EmptyLine text="Aucun devis pour ce client." />}
            {devis.map((d) => (
              <li key={d.id}>
                <Link
                  to="/devis/$id"
                  params={{ id: d.id }}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.numero}</span>
                    <span className="block text-xs text-muted-foreground">{formatDate(d.date_emission)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums">{formatMontant(Number(d.total_ttc), devise)}</span>
                    <StatutBadge statut={d.statut} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Receipt className="h-4 w-4" /> Factures ({factures.length})
            </h2>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/factures/$id" params={{ id: "new" }}>Nouvelle</Link>
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {factures.length === 0 && <EmptyLine text="Aucune facture pour ce client." />}
            {factures.map((f) => (
              <li key={f.id}>
                <Link
                  to="/factures/$id"
                  params={{ id: f.id }}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{f.numero}</span>
                    <span className="block text-xs text-muted-foreground">Échéance {formatDate(f.date_echeance)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums">{formatMontant(Number(f.total_ttc), devise)}</span>
                    <StatutBadge statut={f.statut} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4" /> Paiements ({paiements.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {paiements.length === 0 && <EmptyLine text="Aucun paiement enregistré." />}
          {paiements.map((p) => {
            const f = factures.find((x) => x.id === p.facture_id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{f?.numero ?? "Facture"}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(p.date_paiement)} · {String(p.mode).replace("_", " ")}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-emerald-600">
                  {formatMontant(Number(p.montant), devise)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{text}</li>;
}

function Info({ icon: Icon, value }: { icon: React.ComponentType<{ className?: string }>; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div
        className={`mt-2 text-xl font-bold tabular-nums ${
          tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    brouillon: { label: "Brouillon", cls: "bg-muted text-muted-foreground" },
    envoye: { label: "Envoyé", cls: "bg-blue-500/10 text-blue-600" },
    accepte: { label: "Accepté", cls: "bg-emerald-500/10 text-emerald-600" },
    refuse: { label: "Refusé", cls: "bg-destructive/10 text-destructive" },
    expire: { label: "Expiré", cls: "bg-muted text-muted-foreground" },
    non_payee: { label: "Impayée", cls: "bg-amber-500/10 text-amber-600" },
    partiellement_payee: { label: "Partielle", cls: "bg-blue-500/10 text-blue-600" },
    payee: { label: "Payée", cls: "bg-emerald-500/10 text-emerald-600" },
    annulee: { label: "Annulée", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[statut] ?? { label: statut, cls: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={`mt-0.5 border-transparent text-[10px] font-medium ${m.cls}`}>{m.label}</Badge>;
}

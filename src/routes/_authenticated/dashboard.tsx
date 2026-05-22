import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { getUserQuota } from "@/lib/quota.functions";
import { formatMontant } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Receipt, Users, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const fetchQuota = useServerFn(getUserQuota);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const [facturesRes, devisRes, clientsRes] = await Promise.all([
        supabase.from("factures").select("total_ttc, montant_paye, statut, date_emission").eq("entreprise_id", entreprise!.id),
        supabase.from("devis").select("total_ttc, statut").eq("entreprise_id", entreprise!.id),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("entreprise_id", entreprise!.id),
      ]);
      const factures = facturesRes.data ?? [];
      const devis = devisRes.data ?? [];
      const ca = factures.filter((f) => f.statut === "payee").reduce((s, f) => s + Number(f.total_ttc), 0);
      const impayes = factures.filter((f) => f.statut !== "payee" && f.statut !== "annulee");
      const impayesMontant = impayes.reduce((s, f) => s + (Number(f.total_ttc) - Number(f.montant_paye)), 0);
      const devisEnAttente = devis.filter((d) => d.statut === "envoye").length;
      const devisAcceptes = devis.filter((d) => d.statut === "accepte").length;
      const tauxConversion = devis.length > 0 ? Math.round((devisAcceptes / devis.length) * 100) : 0;
      return {
        ca,
        impayesNombre: impayes.length,
        impayesMontant,
        devisEnAttente,
        tauxConversion,
        clientsCount: clientsRes.count ?? 0,
      };
    },
  });

  const { data: quota } = useQuery({
    queryKey: ["quota"],
    queryFn: () => fetchQuota(),
  });

  const devisLimit = quota ? PLANS[quota.plan].limites.devis_par_mois : null;
  const facturesLimit = quota ? PLANS[quota.plan].limites.factures_par_mois : null;
  const devisPct = devisLimit && devisLimit > 0 ? Math.min(100, Math.round((quota!.devisCount / devisLimit) * 100)) : 0;
  const facturesPct = facturesLimit && facturesLimit > 0 ? Math.min(100, Math.round((quota!.facturesCount / facturesLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenue {entreprise?.nom ? `chez ${entreprise.nom}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link to="/devis"><Plus className="mr-1 h-4 w-4" /> Nouveau devis</Link></Button>
          <Button variant="outline" asChild><Link to="/factures">Nouvelle facture</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Chiffre d'affaires" value={formatMontant(stats?.ca ?? 0, entreprise?.devise)} tone="primary" />
        <KpiCard icon={Receipt} label="Factures impayées" value={`${stats?.impayesNombre ?? 0}`} sub={formatMontant(stats?.impayesMontant ?? 0, entreprise?.devise)} tone="warning" />
        <KpiCard icon={FileText} label="Devis en attente" value={`${stats?.devisEnAttente ?? 0}`} sub={`Conversion ${stats?.tauxConversion ?? 0}%`} />
        <KpiCard icon={Users} label="Clients" value={`${stats?.clientsCount ?? 0}`} />
      </div>

      {quota && (devisLimit !== null || facturesLimit !== null) && (
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-foreground">Utilisation mensuelle — Plan {PLANS[quota.plan].nom}</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {devisLimit !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Devis</span>
                  <span className="font-medium tabular-nums">{quota.devisCount} / {devisLimit}</span>
                </div>
                <Progress value={devisPct} className="h-2" />
                <p className="text-xs text-muted-foreground">{devisLimit - quota.devisCount} restant(s) ce mois-ci</p>
              </div>
            )}
            {facturesLimit !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Factures</span>
                  <span className="font-medium tabular-nums">{quota.facturesCount} / {facturesLimit}</span>
                </div>
                <Progress value={facturesPct} className="h-2" />
                <p className="text-xs text-muted-foreground">{facturesLimit - quota.facturesCount} restante(s) ce mois-ci</p>
              </div>
            )}
          </div>
        </div>
      )}

      {quota && devisLimit === null && facturesLimit === null && (
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-foreground">Plan {PLANS[quota.plan].nom}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Devis et factures illimités.</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; tone?: "primary" | "warning" }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone === "primary" ? "bg-primary/10 text-primary" : tone === "warning" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

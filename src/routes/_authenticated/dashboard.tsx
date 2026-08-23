import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { getUserQuota } from "@/lib/quota.functions";
import { formatMontant, formatDate } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Receipt, Users, TrendingUp, Plus, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
      const [facturesRes, devisRes, clientsRes, recentFacturesRes, recentDevisRes] = await Promise.all([
        supabase.from("factures").select("id, numero, total_ttc, montant_paye, statut, date_emission, date_echeance, client_id").eq("entreprise_id", entreprise!.id),
        supabase.from("devis").select("id, numero, total_ttc, statut, date_emission, client_id").eq("entreprise_id", entreprise!.id),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("entreprise_id", entreprise!.id),
        supabase.from("factures").select("id, numero, total_ttc, statut, date_emission, client:clients(nom, entreprise_nom)").eq("entreprise_id", entreprise!.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("devis").select("id, numero, total_ttc, statut, date_emission, client:clients(nom, entreprise_nom)").eq("entreprise_id", entreprise!.id).order("created_at", { ascending: false }).limit(5),
      ]);
      const factures = facturesRes.data ?? [];
      const devis = devisRes.data ?? [];
      const ca = factures.filter((f) => f.statut === "payee").reduce((s, f) => s + Number(f.total_ttc), 0);
      const actives = factures.filter((f) => f.statut !== "annulee");
      const totalFacture = actives.reduce((s, f) => s + Number(f.total_ttc), 0);
      const encaisse = actives.reduce((s, f) => s + Number(f.montant_paye), 0);
      const tauxRecouvrement = totalFacture > 0 ? Math.round((encaisse / totalFacture) * 100) : 0;
      const impayes = factures.filter((f) => f.statut !== "payee" && f.statut !== "annulee");
      const impayesMontant = impayes.reduce((s, f) => s + (Number(f.total_ttc) - Number(f.montant_paye)), 0);
      const today = new Date(); today.setHours(0,0,0,0);
      const overdue = impayes.filter((f) => new Date(f.date_echeance) < today);
      const devisEnAttente = devis.filter((d) => d.statut === "envoye").length;
      const devisAcceptes = devis.filter((d) => d.statut === "accepte").length;
      const tauxConversion = devis.length > 0 ? Math.round((devisAcceptes / devis.length) * 100) : 0;

      // CA des 6 derniers mois (basé sur date_emission, factures payées)
      const months: { key: string; label: string; ca: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.push({ key, label: d.toLocaleDateString("fr-FR", { month: "short" }), ca: 0 });
      }
      for (const f of factures) {
        if (f.statut !== "payee") continue;
        const d = new Date(f.date_emission);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const m = months.find((x) => x.key === key);
        if (m) m.ca += Number(f.total_ttc);
      }

      return {
        ca,
        impayesNombre: impayes.length,
        impayesMontant,
        overdueCount: overdue.length,
        devisEnAttente,
        tauxConversion,
        clientsCount: clientsRes.count ?? 0,
        months,
        recentFactures: recentFacturesRes.data ?? [],
        recentDevis: recentDevisRes.data ?? [],
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

      {stats && stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-medium">{stats.overdueCount} facture(s) en retard de paiement</p>
            <p className="text-muted-foreground">Pensez à relancer vos clients.</p>
          </div>
          <Button size="sm" variant="outline" asChild><Link to="/factures">Voir <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Chiffre d'affaires" value={formatMontant(stats?.ca ?? 0, entreprise?.devise)} tone="primary" />
        <KpiCard icon={Receipt} label="Factures impayées" value={`${stats?.impayesNombre ?? 0}`} sub={formatMontant(stats?.impayesMontant ?? 0, entreprise?.devise)} tone="warning" />
        <KpiCard icon={FileText} label="Devis en attente" value={`${stats?.devisEnAttente ?? 0}`} sub={`Conversion ${stats?.tauxConversion ?? 0}%`} />
        <KpiCard icon={Users} label="Clients" value={`${stats?.clientsCount ?? 0}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Chiffre d'affaires — 6 derniers mois</h2>
              <p className="text-xs text-muted-foreground">Basé sur les factures encaissées</p>
            </div>
            <Button size="sm" variant="ghost" asChild><Link to="/statistiques">Détails <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.months ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatMontant(v, entreprise?.devise), "CA"]}
                />
                <Area type="monotone" dataKey="ca" stroke="var(--primary)" strokeWidth={2} fill="url(#caGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Dernières factures</h2>
          <ul className="mt-3 space-y-2">
            {(stats?.recentFactures ?? []).length === 0 && (
              <li className="py-4 text-center text-xs text-muted-foreground">Aucune facture</li>
            )}
            {(stats?.recentFactures ?? []).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background/50 p-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.numero}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.client?.entreprise_nom || f.client?.nom || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatMontant(Number(f.total_ttc), entreprise?.devise)}</p>
                  <StatutBadge statut={f.statut} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Derniers devis</h2>
          <Button size="sm" variant="ghost" asChild><Link to="/devis">Tout voir <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">Numéro</th>
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 text-right font-medium">Montant</th>
                <th className="pb-2 text-right font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(stats?.recentDevis ?? []).length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">Aucun devis</td></tr>
              )}
              {(stats?.recentDevis ?? []).map((d: any) => (
                <tr key={d.id}>
                  <td className="py-2 font-medium">{d.numero}</td>
                  <td className="py-2 text-muted-foreground">{d.client?.entreprise_nom || d.client?.nom || "—"}</td>
                  <td className="py-2 text-muted-foreground">{formatDate(d.date_emission)}</td>
                  <td className="py-2 text-right tabular-nums">{formatMontant(Number(d.total_ttc), entreprise?.devise)}</td>
                  <td className="py-2 text-right"><StatutBadge statut={d.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    brouillon: { label: "Brouillon", cls: "bg-muted text-muted-foreground" },
    envoye: { label: "Envoyé", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    accepte: { label: "Accepté", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    refuse: { label: "Refusé", cls: "bg-destructive/10 text-destructive" },
    expire: { label: "Expiré", cls: "bg-muted text-muted-foreground" },
    non_payee: { label: "Impayée", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    partiellement_payee: { label: "Partielle", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    payee: { label: "Payée", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    annulee: { label: "Annulée", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[statut] ?? { label: statut, cls: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={`border-transparent text-xs font-medium ${m.cls}`}>{m.label}</Badge>;
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

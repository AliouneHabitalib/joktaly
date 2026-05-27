import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEntreprise } from "@/hooks/use-entreprise";
import { formatMontant } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Receipt, FileText, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/statistiques")({
  component: StatistiquesPage,
});

const STATUT_COLORS: Record<string, string> = {
  payee: "hsl(142 71% 45%)",
  partiellement_payee: "hsl(217 91% 60%)",
  non_payee: "hsl(38 92% 50%)",
  annulee: "hsl(0 0% 60%)",
};

const STATUT_LABELS: Record<string, string> = {
  payee: "Payée",
  partiellement_payee: "Partielle",
  non_payee: "Impayée",
  annulee: "Annulée",
};

function StatistiquesPage() {
  const { user } = useAuth();
  const { data: entreprise } = useEntreprise(user?.id);
  const [periode, setPeriode] = useState<"6m" | "12m" | "ytd">("12m");

  const { data } = useQuery({
    queryKey: ["stats", entreprise?.id],
    enabled: !!entreprise?.id,
    queryFn: async () => {
      const [facturesRes, devisRes, clientsRes, produitsRes] = await Promise.all([
        supabase.from("factures").select("id, total_ttc, montant_paye, statut, date_emission, client_id, client:clients(nom, entreprise_nom)").eq("entreprise_id", entreprise!.id),
        supabase.from("devis").select("id, total_ttc, statut, date_emission").eq("entreprise_id", entreprise!.id),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("entreprise_id", entreprise!.id),
        supabase.from("produits_services").select("id", { count: "exact", head: true }).eq("entreprise_id", entreprise!.id),
      ]);
      return {
        factures: facturesRes.data ?? [],
        devis: devisRes.data ?? [],
        clientsCount: clientsRes.count ?? 0,
        produitsCount: produitsRes.count ?? 0,
      };
    },
  });

  const months = useMemo(() => {
    const n = periode === "6m" ? 6 : periode === "12m" ? 12 : new Date().getMonth() + 1;
    const list: { key: string; label: string; ca: number; encaisse: number; factures: number; devis: number }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        ca: 0, encaisse: 0, factures: 0, devis: 0,
      });
    }
    for (const f of data?.factures ?? []) {
      const d = new Date(f.date_emission);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = list.find((x) => x.key === key);
      if (m) {
        m.factures += 1;
        m.ca += Number(f.total_ttc);
        m.encaisse += Number(f.montant_paye);
      }
    }
    for (const dv of data?.devis ?? []) {
      const d = new Date(dv.date_emission);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = list.find((x) => x.key === key);
      if (m) m.devis += 1;
    }
    return list;
  }, [data, periode]);

  const statutData = useMemo(() => {
    const map: Record<string, { count: number; montant: number }> = {};
    for (const f of data?.factures ?? []) {
      const k = f.statut as string;
      if (!map[k]) map[k] = { count: 0, montant: 0 };
      map[k].count += 1;
      map[k].montant += Number(f.total_ttc);
    }
    return Object.entries(map).map(([k, v]) => ({
      name: STATUT_LABELS[k] ?? k,
      key: k,
      value: v.count,
      montant: v.montant,
    }));
  }, [data]);

  const topClients = useMemo(() => {
    const map = new Map<string, { nom: string; ca: number; nb: number }>();
    for (const f of data?.factures ?? []) {
      if (f.statut === "annulee") continue;
      const id = f.client_id as string;
      const nom = (f as any).client?.entreprise_nom || (f as any).client?.nom || "—";
      const cur = map.get(id) ?? { nom, ca: 0, nb: 0 };
      cur.ca += Number(f.total_ttc);
      cur.nb += 1;
      map.set(id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.ca - a.ca).slice(0, 5);
  }, [data]);

  const totalCA = months.reduce((s, m) => s + m.ca, 0);
  const totalEncaisse = months.reduce((s, m) => s + m.encaisse, 0);
  const totalImpaye = (data?.factures ?? [])
    .filter((f) => f.statut !== "payee" && f.statut !== "annulee")
    .reduce((s, f) => s + (Number(f.total_ttc) - Number(f.montant_paye)), 0);
  const devisTotal = data?.devis?.length ?? 0;
  const devisAcceptes = (data?.devis ?? []).filter((d) => d.statut === "accepte").length;
  const tauxConversion = devisTotal > 0 ? Math.round((devisAcceptes / devisTotal) * 100) : 0;
  const panierMoyen = (data?.factures ?? []).length > 0 ? totalCA / months.reduce((s, m) => s + m.factures, 0 || 1) : 0;

  // Trend vs mois précédent
  const lastIdx = months.length - 1;
  const last = months[lastIdx];
  const prev = months[lastIdx - 1];
  const trend = prev && prev.ca > 0 ? Math.round(((last.ca - prev.ca) / prev.ca) * 100) : null;

  const devise = entreprise?.devise;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-sm text-muted-foreground">Analysez vos performances commerciales</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periode} onValueChange={(v) => setPeriode(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">6 derniers mois</SelectItem>
              <SelectItem value="12m">12 derniers mois</SelectItem>
              <SelectItem value="ytd">Année en cours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Chiffre d'affaires"
          value={formatMontant(totalCA, devise)}
          trend={trend}
          tone="primary"
        />
        <StatCard icon={Wallet} label="Encaissé" value={formatMontant(totalEncaisse, devise)} tone="success" />
        <StatCard icon={Receipt} label="Reste dû" value={formatMontant(totalImpaye, devise)} tone="warning" />
        <StatCard icon={FileText} label="Taux de conversion" value={`${tauxConversion}%`} sub={`${devisAcceptes}/${devisTotal} devis acceptés`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="text-sm font-semibold">Évolution du chiffre d'affaires</h2>
          <p className="text-xs text-muted-foreground">CA facturé vs encaissé</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatMontant(v, devise)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ca" name="Facturé" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="encaisse" name="Encaissé" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Répartition des factures</h2>
          <p className="text-xs text-muted-foreground">Par statut</p>
          <div className="mt-4 h-72">
            {statutData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Aucune facture
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {statutData.map((entry) => (
                      <Cell key={entry.key} fill={STATUT_COLORS[entry.key] ?? "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, _n, p: any) => [`${v} facture(s) — ${formatMontant(p.payload.montant, devise)}`, p.payload.name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Activité — Devis vs Factures</h2>
          <p className="text-xs text-muted-foreground">Nombre de documents émis</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="devis" name="Devis" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="factures" name="Factures" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Top 5 clients</h2>
              <p className="text-xs text-muted-foreground">Par chiffre d'affaires</p>
            </div>
            <Button size="sm" variant="ghost" asChild><Link to="/clients">Voir tout</Link></Button>
          </div>
          <ul className="mt-4 space-y-2">
            {topClients.length === 0 && (
              <li className="py-8 text-center text-xs text-muted-foreground">Aucune donnée client</li>
            )}
            {topClients.map((c, i) => {
              const max = topClients[0].ca || 1;
              const pct = Math.round((c.ca / max) * 100);
              return (
                <li key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                      <span className="truncate font-medium">{c.nom}</span>
                      <span className="text-xs text-muted-foreground">· {c.nb} facture{c.nb > 1 ? "s" : ""}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{formatMontant(c.ca, devise)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={Users} label="Clients" value={`${data?.clientsCount ?? 0}`} />
        <MiniStat icon={FileText} label="Produits / Services" value={`${data?.produitsCount ?? 0}`} />
        <MiniStat icon={Receipt} label="Panier moyen" value={formatMontant(isFinite(panierMoyen) ? panierMoyen : 0, devise)} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, trend, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; trend?: number | null;
  tone?: "primary" | "success" | "warning";
}) {
  const toneCls =
    tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : tone === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      {trend !== undefined && trend !== null && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-destructive"}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend >= 0 ? "+" : ""}{trend}% vs mois précédent
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
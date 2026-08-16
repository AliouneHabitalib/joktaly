import { useEffect, useState } from "react";
import { DEMO_DEVIS, fmtFcfa } from "@/lib/demo-data";
import { Check, Download, FileText, Receipt, Send, Users, BarChart3 } from "lucide-react";

type TabKey = "devis" | "factures" | "clients" | "stats";

const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "devis", label: "Devis", icon: FileText },
  { key: "factures", label: "Factures", icon: Receipt },
  { key: "clients", label: "Clients", icon: Users },
  { key: "stats", label: "Statistiques", icon: BarChart3 },
];

export function InteractiveDemo() {
  const [tab, setTab] = useState<TabKey>("devis");
  const [sent, setSent] = useState(false);
  const [relances, setRelances] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, [loading]);

  const selectTab = (key: TabKey) => {
    if (key === tab) return;
    setTab(key);
    setLoading(true);
  };

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-elegant)]">
      {/* Barre de fenêtre */}
      <div className="flex items-center justify-between gap-3 bg-secondary px-4 py-3 text-secondary-foreground">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-card/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-card/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-card/30" />
        </div>
        <span className="rounded-md bg-card/10 px-3 py-1 text-xs font-medium">
          app.tera-devis.com
        </span>
        <span className="hidden text-xs opacity-70 sm:inline">Aperçu</span>
      </div>

      {/* Onglets */}
      <div className="flex snap-x snap-mandatory overflow-x-auto border-b bg-muted/40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = key === tab;
          return (
            <button
              key={key}
              onClick={() => selectTab(key)}
              aria-current={active}
              className={`relative flex flex-1 snap-start items-center justify-center gap-2 whitespace-nowrap px-3 py-3 text-xs font-medium transition-colors duration-200 sm:px-4 sm:text-sm ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
              <span className="hidden xs:inline sm:inline">{label}</span>
              <span className="sr-only">{label}</span>
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 animate-scale-in rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[460px] p-3 sm:min-h-[420px] sm:p-6">
        {loading && <DemoSkeleton />}
        {!loading && tab === "devis" && (
          <div key="devis" className="animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Devis</p>
                <p className="font-mono text-sm font-bold text-foreground">{DEMO_DEVIS.numero}</p>
                <p className="mt-1 text-sm text-muted-foreground">{DEMO_DEVIS.objet}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
                <p className="font-semibold leading-snug">{DEMO_DEVIS.client}</p>
                <p className="text-sm text-muted-foreground">{DEMO_DEVIS.ville}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-2 py-2.5 text-left font-semibold sm:px-3">Désignation</th>
                    <th className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">Qté</th>
                    <th className="px-2 py-2.5 text-right font-semibold sm:px-3">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_DEVIS.lignes.map((l, i) => (
                    <tr
                      key={l.designation}
                      className="animate-fade-in border-t transition-colors hover:bg-muted/40"
                      style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
                    >
                      <td className="px-2 py-2.5 sm:px-3">
                        {l.designation}
                        <span className="block text-[11px] text-muted-foreground sm:hidden">
                          Qté : {l.qte}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{l.qte}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums sm:px-3">
                        {fmtFcfa(l.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-1.5 text-sm sm:ml-auto sm:w-72">
              <Row label="Sous-total" value={fmtFcfa(DEMO_DEVIS.sousTotal)} />
              <Row label="Remise 5 %" value={`- ${fmtFcfa(DEMO_DEVIS.remise)}`} />
              <Row label="TVA 18 %" value={fmtFcfa(DEMO_DEVIS.tva)} />
              <div className="mt-1 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 font-bold text-primary">
                <span>Total TTC</span>
                <span className="tabular-nums">{fmtFcfa(DEMO_DEVIS.total)}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:opacity-90 active:scale-[0.98]">
                <Download className="h-4 w-4" /> Télécharger le PDF
              </button>
              <button
                onClick={() => setSent(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                  sent
                    ? "bg-success text-success-foreground"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                }`}
              >
                {sent ? <Check className="h-4 w-4 animate-scale-in" /> : <Send className="h-4 w-4" />}
                {sent ? "Devis envoyé au client" : "Envoyer au client"}
              </button>
            </div>
          </div>
        )}

        {!loading && tab === "factures" && (
          <div className="animate-fade-in space-y-2.5">
            {[
              { n: "FAC-2026-054", c: "SEN-BTP Construction SARL", m: 2914600, s: "Payée" },
              { n: "FAC-2026-053", c: "Clinique Médina", m: 1180000, s: "En attente" },
              { n: "FAC-2026-051", c: "Groupe Teranga Logistics", m: 745000, s: "En retard" },
              { n: "FAC-2026-049", c: "Cabinet Ndiaye & Associés", m: 430000, s: "Payée" },
            ].map((f, i) => {
              const tone =
                f.s === "Payée"
                  ? "bg-success/15 text-success"
                  : f.s === "En attente"
                    ? "bg-accent/20 text-accent-foreground"
                    : "bg-destructive/10 text-destructive";
              const done = relances[i];
              return (
                <div
                  key={f.n}
                  className="grid animate-fade-in grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border p-3.5 transition-colors hover:bg-muted/40 sm:flex sm:flex-wrap sm:justify-between"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{f.n}</p>
                    <p className="truncate text-xs text-muted-foreground">{f.c}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm font-medium tabular-nums">
                    {fmtFcfa(f.m)}
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                    {f.s}
                  </span>
                  {f.s !== "Payée" && (
                    <button
                      onClick={() => setRelances((r) => ({ ...r, [i]: true }))}
                      className={`w-fit justify-self-end rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                        done
                          ? "bg-success text-success-foreground"
                          : "bg-secondary text-secondary-foreground hover:opacity-90"
                      }`}
                    >
                      {done ? "Relance envoyée" : "Relancer"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "clients" && (
          <div className="animate-fade-in space-y-2.5">
            {[
              { n: "SEN-BTP Construction SARL", e: "contact@senbtp.sn", d: 14, ca: 8420000 },
              { n: "Clinique Médina", e: "compta@clinique-medina.sn", d: 9, ca: 3150000 },
              { n: "Groupe Teranga Logistics", e: "achats@teranga-log.com", d: 21, ca: 12680000 },
              { n: "Cabinet Ndiaye & Associés", e: "info@ndiaye-associes.sn", d: 6, ca: 1970000 },
            ].map((c, i) => (
              <div
                key={c.n}
                className="flex animate-fade-in items-center gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted/40"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {c.n.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.n}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.e}</p>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  {c.d} documents
                </div>
                <div className="whitespace-nowrap text-right text-xs font-semibold tabular-nums sm:text-sm">
                  {fmtFcfa(c.ca)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "stats" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { l: "CA encaissé (mois)", v: fmtFcfa(6480000) },
                { l: "Devis envoyés", v: "31" },
                { l: "Taux d'acceptation", v: "68 %" },
                { l: "Impayés", v: fmtFcfa(1925000) },
              ].map((s, i) => (
                <div
                  key={s.l}
                  className="animate-fade-in rounded-xl border bg-muted/30 p-3 transition-transform hover:-translate-y-0.5 sm:p-4"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                >
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                  <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border p-4">
              <p className="text-sm font-semibold">Évolution du chiffre d'affaires</p>
              <div className="mt-4 flex h-32 items-end gap-2">
                {[38, 52, 44, 61, 73, 88].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full origin-bottom rounded-t-md bg-primary/80 transition-all duration-700 ease-out hover:bg-primary"
                      style={{ height: `${h}%`, animation: `scale-in 600ms ease-out ${i * 80}ms backwards` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {["Mar", "Avr", "Mai", "Juin", "Juil", "Août"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3.5 text-sm text-accent-foreground">
              Conseil : 2 factures dépassent 30 jours. Une relance peut récupérer 1 925 000 FCFA
              cette semaine.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function DemoSkeleton() {
  return (
    <div className="animate-fade-in space-y-3" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="w-1/2 space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border p-3.5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

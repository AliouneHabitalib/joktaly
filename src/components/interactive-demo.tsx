import { useState } from "react";

const NAVY = "#1B2A6B";
const GOLD = "#C9A84C";

type TabKey = "devis" | "factures" | "clients" | "stats";

const tabs: { key: TabKey; label: string; emoji: string }[] = [
  { key: "devis", label: "Devis", emoji: "📄" },
  { key: "factures", label: "Factures", emoji: "🧾" },
  { key: "clients", label: "Clients", emoji: "👥" },
  { key: "stats", label: "Stats", emoji: "📊" },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function InteractiveDemo() {
  const [tab, setTab] = useState<TabKey>("devis");
  const [waSent, setWaSent] = useState(false);
  const [relances, setRelances] = useState<Record<number, boolean>>({});

  return (
    <div
      className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 25px 60px -15px rgba(27,42,107,0.25)" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: NAVY }}
      >
        <span className="font-bold tracking-wide" style={{ color: GOLD }}>
          TERA-DEVIS
        </span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-orange-400" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b bg-slate-50">
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors"
              style={{ color: active ? NAVY : "#64748b" }}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
              {active && (
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                  style={{ backgroundColor: NAVY }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 min-h-[420px]">
        {tab === "devis" && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500">Devis n°</p>
                <p className="font-bold" style={{ color: NAVY }}>
                  DEV-2026-042
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Client</p>
                <p className="font-medium">Entreprise Sow & Fils, Dakar</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#f1f3fb" }}>
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: NAVY }}>
                      Désignation
                    </th>
                    <th className="px-3 py-2 text-right font-semibold" style={{ color: NAVY }}>
                      Qté
                    </th>
                    <th className="px-3 py-2 text-right font-semibold" style={{ color: NAVY }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { d: "Conception site web", q: 1, t: 150000 },
                    { d: "Maintenance mensuelle", q: 3, t: 25000 * 3 },
                    { d: "Formation utilisateurs", q: 1, t: 35000 },
                  ].map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{l.d}</td>
                      <td className="px-3 py-2 text-right">{l.q}</td>
                      <td className="px-3 py-2 text-right">{fmt(l.t)}</td>
                    </tr>
                  ))}
                  <tr className="border-t" style={{ backgroundColor: "#f8f9ff" }}>
                    <td className="px-3 py-2 font-bold" style={{ color: NAVY }} colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold" style={{ color: NAVY }}>
                      {fmt(260000)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: NAVY }}
              >
                Télécharger PDF
              </button>
              <button
                onClick={() => setWaSent(true)}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: waSent ? "#16a34a" : GOLD }}
              >
                {waSent ? "✅ Votre client a reçu le devis sur WhatsApp" : "Envoyer par WhatsApp"}
              </button>
            </div>
          </div>
        )}

        {tab === "factures" && (
          <div className="space-y-2">
            {[
              { n: "FAC-2026-018", c: "Boutique Diop", m: 85000, s: "Payée" },
              { n: "FAC-2026-019", c: "Ets Ndiaye", m: 120000, s: "En attente" },
              { n: "FAC-2026-020", c: "Sarl Cissé", m: 45000, s: "Relancée" },
              { n: "FAC-2026-021", c: "Auto-école Ba", m: 230000, s: "Payée" },
            ].map((f, i) => {
              const color =
                f.s === "Payée"
                  ? { bg: "#dcfce7", text: "#166534" }
                  : f.s === "En attente"
                    ? { bg: "#fed7aa", text: "#9a3412" }
                    : { bg: "#fecaca", text: "#991b1b" };
              const done = relances[i];
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold" style={{ color: NAVY }}>
                      {f.n}
                    </p>
                    <p className="text-xs text-slate-500">{f.c}</p>
                  </div>
                  <div className="font-medium">{fmt(f.m)}</div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {f.s}
                  </span>
                  {f.s !== "Payée" && (
                    <button
                      onClick={() => setRelances((r) => ({ ...r, [i]: true }))}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                      style={{ backgroundColor: done ? "#16a34a" : NAVY }}
                    >
                      {done ? "✅ Relancé via WhatsApp" : "Relancer"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "clients" && (
          <div className="space-y-2">
            {[
              { n: "Aminata Sow", e: "aminata@sow-fils.sn", d: 8, ca: 1250000 },
              { n: "Moussa Diop", e: "m.diop@boutique.sn", d: 5, ca: 680000 },
              { n: "Fatou Ndiaye", e: "fatou@ndiaye.com", d: 12, ca: 2340000 },
              { n: "Cheikh Ba", e: "cheikh.ba@auto.sn", d: 3, ca: 450000 },
            ].map((c, i) => {
              const initials = c.n
                .split(" ")
                .map((w) => w[0])
                .join("");
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: NAVY, color: GOLD }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" style={{ color: NAVY }}>
                      {c.n}
                    </p>
                    <p className="truncate text-xs text-slate-500">{c.e}</p>
                  </div>
                  <div className="hidden text-right text-xs text-slate-500 sm:block">
                    {c.d} documents
                  </div>
                  <div className="text-right text-sm font-semibold" style={{ color: NAVY }}>
                    {fmt(c.ca)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "stats" && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "CA du mois", v: fmt(1450000) },
                { l: "Devis envoyés", v: "23" },
                { l: "Impayés", v: fmt(165000) },
                { l: "Clients actifs", v: "18" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4"
                  style={{ backgroundColor: "#f8f9ff" }}
                >
                  <p className="text-xs text-slate-500">{s.l}</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: NAVY }}>
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="mt-4 rounded-lg border border-yellow-200 p-3 text-sm"
              style={{ backgroundColor: "#fef9c3", color: "#713f12" }}
            >
              💡 Conseil : relancez vos 2 factures en retard pour récupérer 165 000 FCFA cette
              semaine.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
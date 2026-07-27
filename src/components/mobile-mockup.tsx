import logoAsset from "@/assets/tera-devis-logo.png.asset.json";

const NAVY = "#1B2A6B";
const GOLD = "#C9A84C";

export function MobileMockup() {
  return (
    <div className="relative mx-auto w-[240px] shrink-0">
      <div className="rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-white">
          <div className="absolute left-1/2 top-0 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-slate-900" aria-hidden="true" />
          <div className="flex items-center gap-2 px-3 pb-2 pt-6" style={{ backgroundColor: NAVY }}>
            <img src={logoAsset.url} alt="Logo TERA-DEVIS sur mobile" className="h-5 w-5 object-contain" />
            <span className="text-xs font-bold" style={{ color: GOLD }}>TERA-DEVIS</span>
          </div>

          <div className="space-y-2 p-3 text-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">Devis</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                DEV-2026-042
              </span>
            </div>
            <p className="text-xs font-semibold">Entreprise Sow & Fils</p>

            <div className="divide-y rounded-lg border text-[11px]">
              {[
                ["Conception site web", "150 000"],
                ["Maintenance × 3", "75 000"],
                ["Formation utilisateurs", "35 000"],
              ].map(([d, m]) => (
                <div key={d} className="flex justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-slate-600">{d}</span>
                  <span className="whitespace-nowrap font-medium">{m}</span>
                </div>
              ))}
              <div className="flex justify-between px-2 py-1.5" style={{ backgroundColor: "#f8f9ff" }}>
                <span className="font-bold" style={{ color: NAVY }}>Total</span>
                <span className="font-bold" style={{ color: NAVY }}>260 000 FCFA</span>
              </div>
            </div>

            <button
              className="w-full rounded-md py-2 text-[11px] font-semibold text-white"
              style={{ backgroundColor: "#25D366" }}
            >
              Envoyer par WhatsApp
            </button>
            <p className="text-center text-[10px] text-slate-400">Optimisé 3G · Mobile-first</p>
          </div>
        </div>
      </div>
    </div>
  );
}

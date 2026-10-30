import { DEMO_DEVIS, fmtFcfa } from "@/lib/demo-data";
import { Send } from "lucide-react";
import logoAsset from "@/assets/joktaly-logo.png.asset.json";

export function MobileMockup() {
  return (
    <div className="relative mx-auto w-[240px] shrink-0">
      <div className="rounded-[2.2rem] border-[6px] border-secondary bg-secondary shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-card">
          <div
            className="absolute left-1/2 top-0 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-secondary"
            aria-hidden="true"
          />
          <div className="flex items-center gap-2 bg-secondary px-3 pb-2 pt-6 text-secondary-foreground">
            <img src={logoAsset.url} alt="JOKTALY sur mobile" className="h-5 w-5 object-contain" />
            <span className="text-xs font-bold">JOKTALY</span>
          </div>

          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Devis</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {DEMO_DEVIS.numero}
              </span>
            </div>
            <p className="text-xs font-semibold">{DEMO_DEVIS.client}</p>

            <div className="divide-y rounded-lg border text-[11px]">
              {DEMO_DEVIS.lignes.map((l) => (
                <div key={l.designation} className="flex justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-muted-foreground">{l.designation}</span>
                  <span className="whitespace-nowrap font-medium tabular-nums">
                    {new Intl.NumberFormat("fr-FR").format(l.total)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between bg-primary/10 px-2 py-1.5 text-primary">
                <span className="font-bold">Total TTC</span>
                <span className="whitespace-nowrap font-bold tabular-nums">
                  {fmtFcfa(DEMO_DEVIS.total)}
                </span>
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent py-2 text-[11px] font-semibold text-accent-foreground">
              <Send className="h-3 w-3" /> Envoyer au client
            </button>
            <p className="text-center text-[10px] text-muted-foreground">
              Optimisé 3G · Mobile-first
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

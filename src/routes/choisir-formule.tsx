import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/pricing";
import type { PlanType } from "@/lib/plans";
import { cancelPendingSubscription } from "@/lib/abonnement.functions";
import logoAsset from "@/assets/joktaly-logo.png.asset.json";

const PLANS: PlanType[] = ["gratuit", "starter", "pro", "business"];

export const Route = createFileRoute("/choisir-formule")({
  component: ChoisirFormulePage,
  head: () => ({
    meta: [
      { title: "Choisissez votre formule — JOKTALY" },
      { name: "description", content: "Choisissez la formule JOKTALY adaptée à votre activité." },
      { property: "og:title", content: "Choisissez votre formule — JOKTALY" },
      { property: "og:description", content: "Choisissez la formule JOKTALY adaptée à votre activité." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ChoisirFormulePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const chooseFree = useServerFn(cancelPendingSubscription);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const pick = async (plan: PlanType) => {
    if (plan === "gratuit") {
      setBusy(true);
      await chooseFree().catch(() => {});
      await qc.invalidateQueries({ queryKey: ["subscription-status"] });
      navigate({ to: "/dashboard" });
      return;
    }
    navigate({ to: "/paiement", search: { plan, cycle: "monthly", statut: undefined, provider: undefined } });
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-6xl text-center">
        <img src={logoAsset.url} alt="JOKTALY" className="mx-auto h-10 w-10 object-contain" />
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Choisissez votre formule</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sélectionnez une formule pour accéder à votre espace.
        </p>
      </div>
      <div className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((id) => {
          const p = PRICING[id];
          const popular = id === "pro";
          return (
            <div key={id} className={`flex flex-col rounded-2xl border bg-card p-6 ${popular ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{p.nom}</h2>
                {popular && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Populaire</span>}
              </div>
              <p className="mt-2 whitespace-nowrap text-2xl font-bold tabular-nums">
                {p.base.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">FCFA / mois</span>
              </p>
              <p className="text-xs text-muted-foreground">{p.ideal}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={popular ? "default" : "outline"} disabled={busy} onClick={() => pick(id)}>
                Choisir {p.nom}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, CreditCard } from "lucide-react";
import {
  PRICING,
  chargedAmount,
  cycleLabel,
  monthlyPrice,
  normalizeCycle,
  normalizePlan,
} from "@/lib/pricing";
import {
  cancelPendingSubscription,
  getSubscriptionStatus,
  selectPaidPlan,
} from "@/lib/abonnement.functions";
import logoAsset from "@/assets/tera-devis-logo.png.asset.json";

export const Route = createFileRoute("/paiement")({
  component: PaiementPage,
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (typeof search.plan === "string" ? search.plan : undefined) as string | undefined,
    cycle: (search.cycle === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly",
    statut: (typeof search.statut === "string" ? search.statut : undefined) as string | undefined,
    provider: (typeof search.provider === "string" ? search.provider : undefined) as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Finaliser votre abonnement — TERA-DEVIS" },
      { name: "description", content: "Réglez votre abonnement TERA-DEVIS." },
      { property: "og:title", content: "Finaliser votre abonnement — TERA-DEVIS" },
      { property: "og:description", content: "Réglez votre abonnement TERA-DEVIS." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PaiementPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const search = Route.useSearch();
  const fetchStatus = useServerFn(getSubscriptionStatus);
  const select = useServerFn(selectPaidPlan);
  const cancel = useServerFn(cancelPendingSubscription);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    search.statut === "annule" ? "Paiement annulé. Vous pouvez réessayer ci-dessous." : null,
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: status, refetch } = useQuery({
    queryKey: ["subscription-status"],
    enabled: !!user,
    queryFn: () => fetchStatus(),
  });

  const plan = normalizePlan(search.plan ?? status?.pending?.plan) ?? "starter";
  const cycle = normalizeCycle(search.cycle ?? status?.pending?.cycle);
  const config = PRICING[plan];

  // Enregistre l'intention d'abonnement (bloque l'accès au dashboard)
  useEffect(() => {
    if (!user) return;
    select({ data: { plan, cycle } }).then(() => refetch()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, plan, cycle]);

  useEffect(() => {
    if (busy) return;
    if (status && !status.requiresPayment && status.plan !== "gratuit") {
      navigate({ to: "/dashboard" });
    }
  }, [status, navigate, busy]);

  const handleFree = async () => {
    setBusy(true);
    await cancel().catch(() => {});
    toast.success("Vous continuez avec le plan Gratuit.");
    navigate({ to: "/dashboard" });
  };

  const total = chargedAmount(plan, cycle);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoAsset.url} alt="TERA-DEVIS" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">TERA-DEVIS</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Votre formule</h1>
          <p className="text-sm text-muted-foreground">
            Le paiement en ligne sera bientôt disponible. En attendant, utilisez le plan Gratuit.
          </p>
        </div>

        <div className="mt-6 rounded-xl border bg-background/60 p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan sélectionné</p>
              <p className="text-lg font-semibold">{config.nom}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">
                {monthlyPrice(plan, cycle).toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">FCFA / mois</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {cycleLabel(cycle)} — total {total.toLocaleString("fr-FR")} FCFA
                {cycle === "yearly" ? " / an" : ""}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {config.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button className="mt-6 w-full" disabled>
          <CreditCard className="mr-2 h-4 w-4" />
          Paiement en ligne bientôt disponible
        </Button>

        <button
          onClick={handleFree}
          disabled={busy}
          className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Continuer avec le plan Gratuit
        </button>
      </div>
    </div>
  );
}

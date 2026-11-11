import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
      { title: "Finaliser votre abonnement — JOKTALY" },
      { name: "description", content: "Réglez votre abonnement JOKTALY." },
      { property: "og:title", content: "Finaliser votre abonnement — JOKTALY" },
      { property: "og:description", content: "Réglez votre abonnement JOKTALY." },
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

  const qc = useQueryClient();
  const [waveClicked, setWaveClicked] = useState(false);
  const { data: status, refetch, isFetching } = useQuery({
    queryKey: ["subscription-status"],
    enabled: !!user,
    queryFn: () => fetchStatus(),
    // Tant que la formule n'est pas active, on revérifie régulièrement
    refetchInterval: (q) => (!q.state.data || q.state.data.plan === "gratuit" ? 5000 : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
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

  // null = pas encore lu ; true = formule déjà active à l'ouverture
  const initiallyActive = useRef<boolean | null>(null);
  useEffect(() => {
    if (busy || !status) return;
    const paid = ["starter", "pro", "business", "essentiel"].includes(status.plan);
    if (initiallyActive.current === null) initiallyActive.current = paid;
    if (!paid || status.requiresPayment) return;
    if (!initiallyActive.current) {
      const nom = PRICING[normalizePlan(status.plan) ?? "starter"].nom;
      toast.success(`Paiement confirmé : votre formule ${nom} est activée`);
      qc.invalidateQueries({ queryKey: ["subscription-status"] });
      qc.invalidateQueries({ queryKey: ["quota"] });
    }
    navigate({ to: "/dashboard", replace: true });
  }, [status, navigate, busy, qc]);

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
            <img src="/joktaly-insigne.png" alt="JOKTALY" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">JOKTALY</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Votre formule</h1>
          <p className="text-sm text-muted-foreground">
            Réglez votre abonnement via Wave pour activer votre formule.
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

        <div className="mt-6 rounded-xl border bg-background/60 p-4 text-center">
          <p className="text-sm text-muted-foreground">Montant à payer</p>
          <p className="text-3xl font-bold tabular-nums">{total.toLocaleString("fr-FR")} FCFA</p>
          <p className="mt-1 text-xs text-muted-foreground">Veuillez payer JOKTALY avec Wave</p>
        </div>
        <Button asChild className="mt-4 w-full">
          <a
            href={`https://pay.wave.com/m/M_sn_Aix0xKrbNhnP/c/sn/?amount=${total}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setWaveClicked(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payer {total.toLocaleString("fr-FR")} FCFA avec Wave
          </a>
        </Button>

        {waveClicked && (
          <div role="status" className="mt-4 rounded-lg border bg-background/60 p-4 text-center text-sm">
            <p>
              Paiement en attente de confirmation. Cette page se met à jour toute seule dès que votre
              formule est activée.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-11 w-full"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? "Vérification…" : "J'ai payé : vérifier maintenant"}
            </Button>
          </div>
        )}

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

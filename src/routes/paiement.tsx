import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Loader2, ShieldCheck } from "lucide-react";
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
  refreshPaymentStatus,
  selectPaidPlan,
  startCheckout,
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
      { name: "description", content: "Réglez votre abonnement TERA-DEVIS par Wave, Orange Money ou carte bancaire pour activer votre espace." },
      { property: "og:title", content: "Finaliser votre abonnement — TERA-DEVIS" },
      { property: "og:description", content: "Réglez votre abonnement TERA-DEVIS par Wave, Orange Money ou carte bancaire." },
      { property: "og:type", content: "website" },
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
  const checkout = useServerFn(startCheckout);
  const refresh = useServerFn(refreshPaymentStatus);
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

  // Retour depuis PayDunya
  useEffect(() => {
    if (!user || search.statut !== "retour") return;
    setBusy(true);
    refresh()
      .then((r) => {
        if (r.statut === "paye") {
          toast.success("Paiement confirmé — bienvenue sur TERA-DEVIS !");
          navigate({ to: "/dashboard" });
        } else if (r.statut === "echoue") {
          setError("Le paiement n'a pas abouti. Vous pouvez réessayer.");
        } else {
          setError("Paiement en cours de vérification. Réessayez dans un instant.");
        }
      })
      .catch(() => setError("Impossible de vérifier le paiement pour le moment."))
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search.statut]);

  useEffect(() => {
    if (status && !status.requiresPayment && status.plan !== "gratuit") {
      navigate({ to: "/dashboard" });
    }
  }, [status, navigate]);

  const handlePay = async (provider: "paydunya" | "paypal" = "paydunya") => {
    setBusy(true);
    setError(null);
    try {
      const res = await checkout({ data: { plan, cycle, provider } });
      if (res.ok && "url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      setError(("message" in res && res.message) || "Le paiement n'a pas pu être initialisé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(false);
    }
  };

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
          <h1 className="mt-4 text-2xl font-bold">Finalisez votre paiement</h1>
          <p className="text-sm text-muted-foreground">
            Réglez votre abonnement pour accéder à votre espace.
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

        <div className="mt-5">
          <p className="text-sm font-medium">Moyens de paiement acceptés</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {["Wave", "Orange Money", "Free Money", "Carte bancaire (Visa / Mastercard)"].map((m) => (
              <span key={m} className="rounded-full border bg-background px-3 py-1 text-muted-foreground">{m}</span>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button className="mt-6 w-full" onClick={() => handlePay("paydunya")} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Payer {total.toLocaleString("fr-FR")} FCFA — Wave / OM / Carte
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => handlePay("paypal")} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#003087"
                d="M7.08 21.34H3.9a.53.53 0 0 1-.52-.62L6.2 3.13a.75.75 0 0 1 .74-.63h6.2c3.3 0 5.5 1.7 5.02 4.94-.5 3.4-3.1 5.13-6.5 5.13H9.3a.75.75 0 0 0-.74.64l-.85 7.5a.53.53 0 0 1-.63.63z"
              />
              <path
                fill="#009cde"
                d="M18.9 8.16c.6 2.9-1.6 5.9-5.6 5.9h-2a.75.75 0 0 0-.74.64l-.9 6.02a.53.53 0 0 0 .52.62h2.72a.66.66 0 0 0 .65-.56l.66-4.2a.66.66 0 0 1 .65-.56h.9c3.1 0 5.3-1.6 5.75-4.6.3-1.9-.5-3.13-1.6-3.9z"
              />
            </svg>
          )}
          Payer avec PayPal
        </Button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Paiement sécurisé via PayDunya ou PayPal (débité en EUR au
          taux fixe 655,957 FCFA = 1 €)
        </div>

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

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/abonnement.functions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const fetchStatus = useServerFn(getSubscriptionStatus);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: status, isError, isFetching, refetch } = useQuery({
    queryKey: ["subscription-status"],
    enabled: !!user,
    queryFn: () => fetchStatus(),
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  useEffect(() => {
    if (status && !status.planChosen) navigate({ to: "/choisir-formule" });
  }, [status, navigate]);

  useEffect(() => {
    if (status?.requiresPayment && status.pending) {
      toast.info("Finalisez votre paiement pour accéder à votre espace.");
      navigate({
        to: "/paiement",
        search: {
          plan: status.pending.plan,
          cycle: (status.pending.cycle === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly",
          statut: undefined,
          provider: undefined,
        },
      });
    }
  }, [status, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="text-lg font-semibold text-foreground">
            Impossible de charger votre espace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Une erreur est survenue en récupérant les informations de votre compte.
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => refetch()} disabled={isFetching}>
              Réessayer
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (!status || !status.planChosen || status.requiresPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <AppShell />;
}

// AppShell renders <Outlet /> internally
void Outlet;
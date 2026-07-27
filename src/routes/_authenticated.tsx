import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getSubscriptionStatus } from "@/lib/abonnement.functions";
import { AppShell } from "@/components/app-shell";

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

  const { data: status } = useQuery({
    queryKey: ["subscription-status"],
    enabled: !!user,
    queryFn: () => fetchStatus(),
  });

  useEffect(() => {
    if (status?.requiresPayment && status.pending) {
      toast.info("Finalisez votre paiement pour accéder à votre espace.");
      navigate({
        to: "/paiement",
        search: {
          plan: status.pending.plan,
          cycle: status.pending.cycle === "yearly" ? "yearly" : "monthly",
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
  if (status?.requiresPayment) return null;
  return <AppShell />;
}

// AppShell renders <Outlet /> internally
void Outlet;
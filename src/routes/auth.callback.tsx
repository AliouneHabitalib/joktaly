import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isPaidPlan, normalizeCycle, normalizePlan } from "@/lib/pricing";
import { clearPlanIntent, readPlanIntent } from "@/lib/plan-intent";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
  head: () => ({
    meta: [
      { title: "Connexion en cours — TERA-DEVIS" },
      { name: "description", content: "Finalisation de votre connexion sécurisée à TERA-DEVIS." },
      { property: "og:title", content: "Connexion en cours — TERA-DEVIS" },
      { property: "og:description", content: "Finalisation de votre connexion sécurisée à TERA-DEVIS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return false;
      if (cancelled) return true;

      // Crée l'entreprise si l'utilisateur arrive pour la première fois via Google
      const { data: ent, error: readError } = await supabase
        .from("entreprises")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (readError) throw new Error("Impossible de récupérer votre entreprise. Merci de réessayer.");
      if (cancelled) return true;
      if (!ent) {
        const meta = session.user.user_metadata ?? {};
        const nom =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          session.user.email?.split("@")[0] ||
          "Mon entreprise";
        const { error: createError } = await supabase.from("entreprises").insert({
          user_id: session.user.id,
          nom,
          email: session.user.email ?? null,
        });
        if (createError) throw new Error("Impossible de créer votre entreprise. Merci de réessayer.");
      }
      if (cancelled) return true;

      const intent = readPlanIntent();
      clearPlanIntent();
      const plan = normalizePlan(intent.plan);
      if (isPaidPlan(plan)) {
        navigate({
          to: "/paiement",
          search: { plan, cycle: normalizeCycle(intent.cycle), statut: undefined, provider: undefined },
        });
      } else {
        navigate({ to: "/dashboard" });
      }
      return true;
    };

    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (cancelled) return;
      let done: boolean;
      try {
        done = await finish();
      } catch (error) {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "Connexion non aboutie. Merci de réessayer.");
        navigate({ to: "/login" });
        return;
      }
      if (done || cancelled) return;
      tries += 1;
      if (tries > 25) {
        toast.error("Connexion non aboutie. Merci de réessayer.");
        navigate({ to: "/login" });
        return;
      }
      timer = setTimeout(tick, 400);
    };
    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 p-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Connexion sécurisée en cours…</p>
    </div>
  );
}

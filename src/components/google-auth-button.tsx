import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { savePlanIntent } from "@/lib/plan-intent";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  label?: string;
  plan?: string | undefined;
  cycle?: "monthly" | "yearly" | undefined;
  onPendingChange?: (pending: boolean) => void;
}

export function GoogleAuthButton({ label = "Continuer avec Google", plan, cycle, onPendingChange }: Props) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    setLoading(true);
    onPendingChange?.(true);
    savePlanIntent({ plan, cycle });
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (res && "error" in res && res.error) {
        toast.error("Connexion Google impossible pour le moment.");
        setLoading(false);
        onPendingChange?.(false);
        return;
      }
      if (res.redirected) return;
      // Dans l'aperçu, Google ouvre une fenêtre puis rend la session sans redirection.
      await navigate({ to: "/auth/callback" });
    } catch {
      toast.error("Connexion Google impossible pour le moment.");
      setLoading(false);
      onPendingChange?.(false);
    }
  };

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.59-5.17 3.59-8.81z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.08 7.93-2.92l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
          />
          <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.29a12 12 0 0 0 0 10.74z" />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75z"
          />
        </svg>
      )}
      {label}
    </Button>
  );
}

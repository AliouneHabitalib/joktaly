import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — JOKTALY" },
      { name: "description", content: "Recevez un lien pour réinitialiser votre mot de passe JOKTALY." },
      { property: "og:title", content: "Mot de passe oublié — JOKTALY" },
      { property: "og:description", content: "Recevez un lien pour réinitialiser votre mot de passe JOKTALY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        {sent ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Si un compte existe pour {email}, un email avec un lien de réinitialisation vient d'être envoyé.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-6 block text-center text-sm text-primary hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

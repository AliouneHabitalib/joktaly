import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GoogleAuthButton } from "@/components/google-auth-button";
import logoAsset from "@/assets/tera-devis-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Connexion — TERA-DEVIS" },
      {
        name: "description",
        content:
          "Connectez-vous à TERA-DEVIS pour créer des devis et factures professionnels en quelques clics.",
      },
      {
        property: "og:title",
        content: "Connexion — TERA-DEVIS",
      },
      {
        property: "og:description",
        content:
          "Connectez-vous à TERA-DEVIS pour créer des devis et factures professionnels en quelques clics.",
      },
      { property: "og:url", content: "https://tera-devis.lovable.app/login" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Connexion — TERA-DEVIS" },
      {
        name: "twitter:description",
        content:
          "Connectez-vous à TERA-DEVIS pour créer des devis et factures professionnels en quelques clics.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://tera-devis.lovable.app/login" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Connexion réussie");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoAsset.url} alt="TERA-DEVIS" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">TERA-DEVIS</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-muted-foreground">Bienvenue, connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleAuthButton label="Se connecter avec Google" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to="/register" search={{ plan: undefined, cycle: undefined }} className="font-medium text-primary hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
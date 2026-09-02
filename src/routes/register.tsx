import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isPaidPlan, normalizePlan } from "@/lib/pricing";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { useAuth } from "@/hooks/use-auth";
import logoAsset from "@/assets/tera-devis-logo.png.asset.json";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (typeof search.plan === "string" ? search.plan : undefined) as string | undefined,
    cycle: (search.cycle === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly" | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Créer un compte — TERA-DEVIS" },
      {
        name: "description",
        content:
          "Inscrivez-vous gratuitement à TERA-DEVIS et gérez vos devis, factures et paiements pour votre PME.",
      },
      {
        property: "og:title",
        content: "Créer un compte — TERA-DEVIS",
      },
      {
        property: "og:description",
        content:
          "Inscrivez-vous gratuitement à TERA-DEVIS et gérez vos devis, factures et paiements pour votre PME.",
      },
      {
        property: "og:url",
        content: "https://tera-devis.lovable.app/register",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Créer un compte — TERA-DEVIS" },
      {
        name: "twitter:description",
        content:
          "Inscrivez-vous gratuitement à TERA-DEVIS et gérez vos devis, factures et paiements pour votre PME.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://tera-devis.lovable.app/register",
      },
    ],
  }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { plan, cycle } = Route.useSearch();
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : null;
  const [form, setForm] = useState({
    nom: "",
    email: "",
    password: "",
    entreprise_nom: "",
    pays: "Sénégal",
    telephone: "",
  });
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Déjà connecté : on va directement au paiement du plan choisi (ou au dashboard)
  useEffect(() => {
    if (authLoading || !user) return;
    const p = normalizePlan(plan);
    if (isPaidPlan(p)) {
      navigate({ to: "/paiement", search: { plan: p, cycle: cycle ?? "monthly", statut: undefined, provider: undefined } });
    } else {
      navigate({ to: "/dashboard" });
    }
  }, [user, authLoading, plan, cycle, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { nom: form.nom },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }
    if (!data.user) { setLoading(false); return toast.error("Erreur lors de la création du compte"); }

    // Créer l'entreprise (le trigger a déjà créé le profil)
    const { error: errEnt } = await supabase.from("entreprises").insert({
      user_id: data.user.id,
      nom: form.entreprise_nom,
      pays: form.pays,
      telephone: form.telephone,
      email: form.email,
    });
    setLoading(false);
    if (errEnt) return toast.error(errEnt.message);
    toast.success("Compte créé avec succès");
    if (isPaidPlan(normalizePlan(plan))) {
      navigate({ to: "/paiement", search: { plan: normalizePlan(plan)!, cycle: cycle ?? "monthly", statut: undefined, provider: undefined } });
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const PAYS = ["Sénégal", "Côte d'Ivoire", "Mali", "Burkina Faso", "Cameroun", "Guinée", "Togo", "Bénin"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoAsset.url} alt="TERA-DEVIS" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">TERA-DEVIS</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">Commencez gratuitement, sans carte bancaire</p>
          {planLabel && (
            <p className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Plan sélectionné : {planLabel}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Votre nom</Label>
            <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ent">Nom de l'entreprise</Label>
            <Input id="ent" value={form.entreprise_nom} onChange={(e) => setForm({ ...form, entreprise_nom: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pays">Pays</Label>
              <select id="pays" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs" value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })}>
                {PAYS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input id="tel" type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleAuthButton label="S'inscrire avec Google" plan={plan} cycle={cycle ?? "monthly"} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
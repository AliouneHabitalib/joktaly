import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authErrorFr } from "@/lib/auth-errors";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — JOKTALY" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte JOKTALY." },
      { property: "og:title", content: "Nouveau mot de passe — JOKTALY" },
      { property: "og:description", content: "Choisissez un nouveau mot de passe pour votre compte JOKTALY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Page() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Au moins 6 caractères.");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(authErrorFr(error.message));
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">Nouveau mot de passe</Label>
            <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">Confirmer</Label>
            <Input id="pw2" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}

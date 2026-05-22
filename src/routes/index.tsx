import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Users, CreditCard, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70" />
            <span className="text-xl font-bold">DevisPro</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">Connexion</Link></Button>
            <Button asChild><Link to="/register">Commencer</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-20 text-center text-white">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Devis & factures pour les <span className="text-accent">PME africaines</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            Créez vos devis et factures en quelques clics, envoyez-les par WhatsApp ou email,
            et suivez vos paiements. Conçu pour le Sénégal et l'Afrique francophone.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Essayer gratuitement</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20" asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto grid gap-6 px-4 py-20 md:grid-cols-4">
        {[
          { icon: FileText, title: "Devis pro", desc: "Numérotés auto, PDF en 1 clic" },
          { icon: CreditCard, title: "Factures", desc: "Wave, Orange Money, virement" },
          { icon: Users, title: "Clients", desc: "Historique complet, WhatsApp intégré" },
          { icon: BarChart3, title: "Statistiques", desc: "CA, impayés, conversion devis" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <Icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

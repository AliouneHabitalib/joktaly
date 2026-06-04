import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import slideCreerDevis from "@/assets/slide-creer-devis.png.asset.json";
import slideDocumentsPro from "@/assets/slide-documents-pro.png.asset.json";
import slideSuiviPaiements from "@/assets/slide-suivi-paiements.png.asset.json";
import slideGagnezTemps from "@/assets/slide-gagnez-temps.png.asset.json";
import {
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Zap,
  Send,
  Wallet,
  History,
  Globe,
  GraduationCap,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";

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
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
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
        <div className="container mx-auto grid gap-10 px-4 py-14 text-white sm:py-20 md:grid-cols-2 md:items-center md:gap-12 md:py-28">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
              Devis & factures pour les <span className="text-accent">PME africaines</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg md:mx-0">
              Créez vos devis et factures en quelques clics, envoyez-les par WhatsApp ou email,
              et suivez vos paiements. Conçu pour le Sénégal et l'Afrique francophone.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 md:justify-start">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Essayer gratuitement</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20" asChild>
                <Link to="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
          <InvoiceMockup />
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

      {/* Aperçu visuel — slides */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">DevisPro en images</h2>
          <p className="mt-4 text-muted-foreground">
            Découvrez l'application et ses bénéfices en un coup d'œil.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { src: slideCreerDevis.url, alt: "Créez un devis en quelques clics" },
            { src: slideDocumentsPro.url, alt: "Des documents clairs et professionnels" },
            { src: slideSuiviPaiements.url, alt: "Suivez vos paiements facilement" },
            { src: slideGagnezTemps.url, alt: "Gagnez du temps, travaillez plus professionnellement" },
          ].map((img) => (
            <div
              key={img.src}
              className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Pourquoi choisir DevisPro ? */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Pourquoi choisir DevisPro ?</h2>
            <p className="mt-4 text-muted-foreground">
              L'outil de facturation pensé pour vous faire gagner du temps et de l'argent.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Création rapide de devis professionnels",
                desc: "Générez un devis complet en moins de 2 minutes avec numérotation automatique.",
              },
              {
                icon: FileText,
                title: "Génération automatique de factures",
                desc: "Transformez un devis accepté en facture en un clic. Plus d'erreur de saisie.",
              },
              {
                icon: Send,
                title: "Envoi direct par WhatsApp ou email",
                desc: "Partagez vos documents avec vos clients instantanément, où qu'ils soient.",
              },
              {
                icon: Wallet,
                title: "Suivi des paiements",
                desc: "Visualisez en temps réel vos encaissements et relancez les impayés facilement.",
              },
              {
                icon: History,
                title: "Historique client",
                desc: "Retrouvez l'intégralité des transactions, devis et factures par client.",
              },
              {
                icon: Globe,
                title: "Adapté aux entrepreneurs africains",
                desc: "Pensé pour les réalités locales : devis en FCFA, mobile money, connexion lente.",
              },
              {
                icon: GraduationCap,
                title: "Simple à utiliser sans compétence comptable",
                desc: "Interface intuitive. Aucune formation nécessaire pour démarrer.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ils nous font confiance</h2>
          <p className="mt-4 text-muted-foreground">
            Des entrepreneurs africains témoignent de leur expérience avec DevisPro.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              nom: "Aminata Diallo",
              role: "Consultante RH – Dakar",
              initiales: "AD",
              couleur: "bg-primary/15 text-primary",
              citation:
                "En 10 minutes j'avais créé mon premier devis pro. Mes clients reçoivent tout par WhatsApp, c'est parfait.",
            },
            {
              nom: "Moussa Traoré",
              role: "Entrepreneur BTP – Abidjan",
              initiales: "MT",
              couleur: "bg-accent/20 text-accent-foreground",
              citation:
                "Je suivais mes paiements sur un cahier. Maintenant j'ai tout sur mon téléphone. Un vrai gain de temps.",
            },
            {
              nom: "Fatou Seck",
              role: "Gérante de boutique – Dakar",
              initiales: "FS",
              couleur: "bg-secondary text-secondary-foreground",
              citation:
                "Les relances automatiques des impayés m'ont fait récupérer de l'argent que j'avais déjà oublié.",
            },
          ].map((t) => (
            <div
              key={t.nom}
              className="flex flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${t.couleur}`}
                  aria-hidden="true"
                >
                  {t.initiales}
                </div>
                <div>
                  <p className="font-semibold">{t.nom}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-0.5" aria-label="5 étoiles sur 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mt-4 italic text-muted-foreground">"{t.citation}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pour qui ? */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Pour qui ?</h2>
          <p className="mt-4 text-muted-foreground">
            DevisPro s'adresse à tous les professionnels qui veulent facturer simplement et professionnellement.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            "Entrepreneurs",
            "Artisans",
            "Commerçants",
            "Agences",
            "Consultants",
            "Prestataires de services",
            "Entreprises BTP",
            "Agences immobilières",
            "Restaurants",
            "Boutiques",
            "PME",
          ].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Tarifs */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tarifs</h2>
            <p className="mt-4 text-muted-foreground">
              Commencez gratuitement. Évoluez quand votre activité grandit.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                nom: "Gratuit",
                prix: "0",
                periode: "FCFA / mois",
                ideal: "Tester l'application",
                features: ["3 devis / mois", "1 facture / mois", "Export PDF", "Envoi WhatsApp & email"],
                cta: "Commencer",
                variant: "outline" as const,
                highlight: false,
              },
              {
                nom: "Starter",
                prix: "3 000",
                periode: "FCFA / mois",
                ideal: "Petits entrepreneurs",
                features: ["10 devis / mois", "5 factures / mois", "30 clients", "Conversion devis → facture", "Export PDF pro"],
                cta: "Choisir Starter",
                variant: "default" as const,
                highlight: false,
              },
              {
                nom: "Pro",
                prix: "6 000",
                periode: "FCFA / mois",
                ideal: "PME et prestataires actifs",
                features: ["Devis illimités", "Factures illimitées", "Paiements & rappels", "Statistiques de base", "Modèles personnalisés"],
                cta: "Choisir Pro",
                variant: "default" as const,
                highlight: true,
              },
              {
                nom: "Business",
                prix: "15 000",
                periode: "FCFA / mois",
                ideal: "Équipes et entreprises",
                features: ["Jusqu'à 5 utilisateurs", "Statistiques avancées", "Export Excel / CSV", "Support prioritaire", "Accès API + webhooks"],
                cta: "Choisir Business",
                variant: "default" as const,
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.nom}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] ${plan.highlight ? "ring-2 ring-primary" : ""}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Le plus populaire
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.nom}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.prix}</span>
                  <span className="text-sm text-muted-foreground">{plan.periode}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.ideal}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={plan.variant} asChild>
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-bold md:text-3xl">Prêt à simplifier votre facturation ?</h2>
          <p className="mt-4 text-muted-foreground">
            Rejoignez les entrepreneurs qui gagnent du temps chaque jour avec DevisPro.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Essayer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Questions fréquentes</h2>
            <p className="mt-4 text-muted-foreground">
              Tout ce que vous devez savoir pour bien démarrer avec DevisPro.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-card px-6 shadow-[var(--shadow-card)]">
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "Comment puis-je payer mon abonnement ?",
                  a: "Vous pouvez payer via Wave, Orange Money, Free Money ou carte bancaire. Paiement 100% sécurisé.",
                },
                {
                  q: "Puis-je annuler à tout moment ?",
                  a: "Oui, sans engagement. Vous pouvez annuler votre abonnement en un clic depuis votre espace client.",
                },
                {
                  q: "Mes données sont-elles sécurisées ?",
                  a: "Toutes vos données sont chiffrées et hébergées sur des serveurs sécurisés. Nous ne partageons jamais vos informations.",
                },
                {
                  q: "Est-ce que DevisPro fonctionne sans connexion rapide ?",
                  a: "Oui. L'application est optimisée pour les connexions lentes (3G/4G) courantes en Afrique.",
                },
                {
                  q: "Puis-je passer d'un plan à un autre ?",
                  a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre tableau de bord.",
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-base font-semibold">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto flex flex-col gap-6 px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70" />
              <span className="font-bold">DevisPro</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="/conditions" className="hover:text-foreground">
                Conditions d'utilisation
              </a>
              <a href="/confidentialite" className="hover:text-foreground">
                Politique de confidentialité
              </a>
              <a href="/contact" className="hover:text-foreground">
                Contact
              </a>
            </nav>
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t pt-4 text-sm text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} DevisPro. Tous droits réservés.</p>
            <p>
              Made with <span aria-label="amour">❤️</span> pour les entrepreneurs africains
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InvoiceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm md:max-w-md">
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-accent/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-[2rem] border border-white/20 bg-slate-900/60 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur">
        <div className="rounded-[1.5rem] bg-white p-5 text-slate-800 shadow-xl sm:p-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/70" />
              <span className="font-bold text-slate-900">DevisPro</span>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-mono text-slate-600">
              DEV-2026-001
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Client</p>
            <p className="text-sm font-semibold text-slate-900">Entreprise Sow & Fils</p>
            <p className="text-xs text-slate-500">Dakar, Sénégal</p>
          </div>
          <div className="mt-4 divide-y text-sm">
            <div className="flex items-start justify-between gap-3 py-2">
              <span className="text-slate-700">Conception site web</span>
              <span className="whitespace-nowrap font-medium text-slate-900">
                150 000 FCFA
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 py-2">
              <span className="text-slate-700">Maintenance mensuelle</span>
              <span className="whitespace-nowrap font-medium text-slate-900">
                25 000 FCFA
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </span>
            <span className="text-base font-bold text-slate-900">175 000 FCFA</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Send className="h-3 w-3" />
              Envoyé par WhatsApp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

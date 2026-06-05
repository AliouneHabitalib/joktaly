import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  ShieldCheck,
  Lock,
  HeadphonesIcon,
  Server,
  MessageCircle,
  X,
  Facebook,
  Linkedin,
  BadgeCheck,
  PlayCircle,
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
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitShown, setExitShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShown) {
        setShowExitPopup(true);
        setExitShown(true);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [exitShown]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Nav avec CTA */}
      <header className="border-b bg-card/90 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70" />
            <span className="text-lg font-bold sm:text-xl">DevisPro</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
              asChild
            >
              <Link to="/register">Essayer gratuitement</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto grid gap-10 px-4 py-14 text-white sm:py-20 md:grid-cols-2 md:items-center md:gap-12 md:py-24">
          <div className="text-center md:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur sm:text-sm">
              <Check className="h-3.5 w-3.5 text-accent" />
              <span>100+ entrepreneurs africains nous font confiance</span>
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
              Devis & factures pour les <span className="text-accent">PME africaines</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg md:mx-0">
              Créez vos devis et factures en quelques clics, envoyez-les par WhatsApp,
              et suivez vos paiements. Conçu pour le Sénégal et l'Afrique francophone.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 md:justify-start">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
                asChild
              >
                <Link to="/register">
                  Créer mon premier devis gratuit <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                asChild
              >
                <a href="#demo">
                  <PlayCircle className="mr-2 h-4 w-4" /> Voir la démo en 60s
                </a>
              </Button>
            </div>
            {/* Payment methods */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <span className="text-xs uppercase tracking-wide text-white/60">
                Paiements acceptés
              </span>
              {["Wave", "Orange Money", "Free Money"].map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm"
                >
                  {p}
                </span>
              ))}
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

      {/* Voir l'app en action */}
      <section id="demo" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Voir l'app en action</h2>
          <p className="mt-4 text-muted-foreground">
            Regardez la démo vidéo : du devis au paiement en quelques minutes.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
            <div className="relative aspect-video w-full bg-gradient-to-br from-primary/10 via-muted to-accent/10">
              {/* Placeholder vidéo — remplacez src par votre fichier ou utilisez <iframe> YouTube/Vimeo */}
              <video
                className="absolute inset-0 h-full w-full object-cover"
                controls
                preload="metadata"
                poster=""
              >
                <source src="" type="video/mp4" />
                Votre navigateur ne prend pas en charge la lecture vidéo.
              </video>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/90 shadow-lg">
                  <PlayCircle className="h-12 w-12 text-accent-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Vidéo de démo bientôt disponible
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Durée : ~60 secondes • Découvrez les fonctionnalités clés de DevisPro.
          </p>
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
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ils nous font confiance</h2>
          <p className="mt-4 text-muted-foreground">
            Des entrepreneurs africains témoignent de leur expérience avec DevisPro.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              nom: "Aminata Diallo",
              role: "Consultante RH – Dakar",
              ville: "Dakar, Sénégal",
              initiales: "AD",
              couleur: "bg-primary/15 text-primary",
              plan: "Starter",
              citation:
                "En 10 minutes j'avais créé mon premier devis pro. Mes clients reçoivent tout par WhatsApp, c'est parfait.",
            },
            {
              nom: "Moussa Traoré",
              role: "Entrepreneur BTP – Abidjan",
              ville: "Abidjan, Côte d'Ivoire",
              initiales: "MT",
              couleur: "bg-accent/20 text-accent-foreground",
              plan: "Pro",
              citation:
                "Je suivais mes paiements sur un cahier. Maintenant j'ai tout sur mon téléphone. Un vrai gain de temps.",
            },
            {
              nom: "Fatou Seck",
              role: "Gérante de boutique – Dakar",
              ville: "Dakar, Sénégal",
              initiales: "FS",
              couleur: "bg-secondary text-secondary-foreground",
              plan: "Starter",
              citation:
                "Les relances automatiques des impayés m'ont fait récupérer de l'argent que j'avais déjà oublié.",
            },
            {
              nom: "Cheikh N'Diaye",
              role: "Dirigeant agence digitale – Abidjan",
              ville: "Abidjan, Côte d'Ivoire",
              initiales: "CN",
              couleur: "bg-primary/15 text-primary",
              plan: "Business",
              citation:
                "Avec 5 utilisateurs sur DevisPro Business, mon agence facture 3x plus vite. Le support est ultra réactif.",
            },
          ].map((t) => (
            <div
              key={t.nom}
              className="flex flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${t.couleur}`}
                  aria-hidden="true"
                >
                  {t.initiales}
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    {t.nom}
                    <BadgeCheck className="h-4 w-4 text-primary" aria-label="Client vérifié" />
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                  <p className="text-xs text-muted-foreground">{t.ville}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-0.5" aria-label="5 étoiles sur 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
                </div>
                <Badge variant="secondary" className="text-[10px]">Plan {t.plan}</Badge>
              </div>
              <p className="mt-4 text-sm italic text-muted-foreground">"{t.citation}"</p>
              <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-primary">
                ✓ Client vérifié
              </p>
            </div>
          ))}
        </div>
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tarifs</h2>
            <p className="mt-4 text-muted-foreground">
              Commencez gratuitement. Évoluez quand votre activité grandit.
            </p>
            {/* Toggle Monthly/Yearly */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Annuel <span className="ml-1 text-xs text-accent">-20%</span>
              </button>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {[
              {
                nom: "Gratuit",
                base: 0,
                ideal: "Tester l'application",
                features: ["5 devis / mois", "3 factures / mois", "10 clients", "Export PDF", "Envoi WhatsApp"],
                cta: "Commencer",
                variant: "outline" as const,
                highlight: false,
              },
              {
                nom: "Starter",
                base: 3000,
                ideal: "Petits entrepreneurs",
                features: ["10 devis / mois", "5 factures / mois", "30 clients", "Conversion devis → facture", "Export PDF pro"],
                cta: "Choisir Starter",
                variant: "default" as const,
                highlight: false,
              },
              {
                nom: "Essentiel",
                base: 6000,
                ideal: "Activités en croissance",
                features: ["20 devis / mois", "10 factures / mois", "50 clients", "Rappels automatiques", "Modèles personnalisés"],
                cta: "Choisir Essentiel",
                variant: "default" as const,
                highlight: true,
              },
              {
                nom: "Pro",
                base: 9500,
                ideal: "PME et prestataires actifs",
                features: ["Devis illimités", "Factures illimitées", "Paiements & rappels", "Statistiques de base", "Modèles personnalisés"],
                cta: "Choisir Pro",
                variant: "default" as const,
                highlight: false,
              },
              {
                nom: "Business",
                base: 15000,
                ideal: "Équipes et entreprises",
                features: ["Jusqu'à 5 utilisateurs", "Statistiques avancées", "Export Excel / CSV", "Support prioritaire", "Accès API + webhooks"],
                cta: "Choisir Business",
                variant: "default" as const,
                highlight: false,
              },
            ].map((plan) => {
              const isFree = plan.base === 0;
              const monthly = plan.base;
              const yearlyMonthly = Math.round((plan.base * 0.8));
              const display = isFree ? 0 : billing === "yearly" ? yearlyMonthly : monthly;
              return (
              <div
                key={plan.nom}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-lg ${plan.highlight ? "ring-2 ring-primary scale-[1.02]" : ""}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground shadow-md">
                    ⭐ Le plus populaire
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.nom}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{display.toLocaleString("fr-FR")}</span>
                  <span className="text-sm text-muted-foreground">FCFA / mois</span>
                </div>
                {!isFree && billing === "yearly" && (
                  <p className="mt-1 text-xs text-accent font-medium">
                    Économisez 20% — facturé annuellement
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sans engagement • Annulation à tout moment
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.ideal}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full ${plan.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                  variant={plan.variant}
                  asChild
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* Confiance & Sécurité */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Confiance & sécurité</h2>
            <p className="mt-4 text-muted-foreground">
              Vos données sont protégées avec les meilleurs standards du marché.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Lock, title: "SSL sécurisé", desc: "Chiffrement bout-en-bout sur toutes les pages." },
              { icon: Server, title: "Hébergé en Europe", desc: "Conforme RGPD + sauvegarde quotidienne." },
              { icon: ShieldCheck, title: "Conforme DGI Sénégal", desc: "Mentions légales fiscales locales." },
              { icon: CreditCard, title: "Paiement Stripe", desc: "Paiements sécurisés Stripe et mobile money." },
              { icon: HeadphonesIcon, title: "Support réactif", desc: "Réponse sous 4h en jours ouvrés." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center rounded-2xl border bg-card p-5 text-center shadow-[var(--shadow-card)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
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
                  q: "Comment fonctionne l'envoi WhatsApp ?",
                  a: "Depuis n'importe quel devis ou facture, cliquez sur 'Envoyer par WhatsApp'. Le PDF est généré et un message pré-rempli s'ouvre dans WhatsApp avec le lien sécurisé du document.",
                },
                {
                  q: "Puis-je mettre mon logo sur les devis PDF ?",
                  a: "Oui. Depuis les Paramètres entreprise, importez votre logo : il apparaît automatiquement sur tous vos devis et factures PDF.",
                },
                {
                  q: "Que se passe-t-il si je dépasse ma limite mensuelle ?",
                  a: "Vous recevez une notification pour upgrader. Aucun document n'est perdu : vous pourrez à nouveau créer dès le mois suivant ou après changement de plan.",
                },
                {
                  q: "Mes données sont-elles sécurisées ?",
                  a: "Toutes vos données sont chiffrées (SSL) et hébergées en Europe (RGPD), avec sauvegarde automatique quotidienne. Nous ne partageons jamais vos informations.",
                },
                {
                  q: "Puis-je exporter mes données en Excel ?",
                  a: "Oui, à partir du plan Business : exportez vos clients, devis et factures au format Excel / CSV en un clic.",
                },
                {
                  q: "Comment annuler mon abonnement ?",
                  a: "Sans engagement : annulez en un clic depuis votre tableau de bord. Vous gardez l'accès jusqu'à la fin de votre période payée.",
                },
                {
                  q: "Comment puis-je payer mon abonnement ?",
                  a: "Vous pouvez payer via Wave, Orange Money, Free Money ou carte bancaire. Paiement 100% sécurisé.",
                },
                {
                  q: "Est-ce que DevisPro fonctionne sans connexion rapide ?",
                  a: "Oui. L'application est optimisée pour les connexions lentes (3G/4G) courantes en Afrique.",
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
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto grid gap-10 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70" />
              <span className="text-lg font-bold">DevisPro</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              L'outil de facturation pensé pour les entrepreneurs africains.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Facebook" className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://wa.me/" aria-label="WhatsApp" className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Produit</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-foreground">Tarifs</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">À propos</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Légal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
              <li><a href="/conditions" className="hover:text-foreground">Mentions légales</a></li>
              <li><a href="/conditions" className="hover:text-foreground">CGV</a></li>
              <li><a href="/confidentialite" className="hover:text-foreground">Confidentialité</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Newsletter</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Conseils facturation pour entrepreneurs africains.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-3 flex gap-2"
            >
              <input
                type="email"
                required
                placeholder="votre@email.com"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                OK
              </Button>
            </form>
          </div>
        </div>
        <div className="container mx-auto mt-10 flex flex-col items-center justify-between gap-2 border-t px-4 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} DevisPro. Tous droits réservés.</p>
          <p>
            Made with <span aria-label="amour">❤️</span> pour l'Afrique
          </p>
        </div>
      </footer>

      {/* WhatsApp chat widget */}
      <a
        href="https://wa.me/221000000000?text=Bonjour%2C%20j'ai%20une%20question%20sur%20DevisPro"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter sur WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Une question ?</span>
      </a>

      {/* Exit intent popup */}
      {showExitPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setShowExitPopup(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowExitPopup(false)}
              aria-label="Fermer"
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-2xl">
                🎁
              </div>
              <h3 className="mt-4 text-xl font-bold">Une dernière chose !</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Inscrivez-vous maintenant et recevez <strong>10 modèles de devis gratuits</strong> prêts à utiliser.
              </p>
              <Button
                className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                asChild
              >
                <Link to="/register">Recevoir mes modèles gratuits</Link>
              </Button>
              <button
                onClick={() => setShowExitPopup(false)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Non merci
              </button>
            </div>
          </div>
        </div>
      )}
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

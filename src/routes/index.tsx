import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InteractiveDemo } from "@/components/interactive-demo";
import { MobileMockup } from "@/components/mobile-mockup";
import { AiChatWidget } from "@/components/ai-chat-widget";
import heroImage from "@/assets/hero-entrepreneur.jpg";
import coiffeuseImage from "@/assets/hero-coiffeuse.jpg";
import menuisierImage from "@/assets/hero-menuisier.jpg";
import { DEMO_DEVIS, fmtFcfa } from "@/lib/demo-data";
import { PRICING, monthlyPrice } from "@/lib/pricing";
import { PUBLIC_PLANS } from "@/lib/plans";
import { useInView } from "@/hooks/use-in-view";
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
  ShieldCheck,
  Lock,
  HeadphonesIcon,
  Server,
  X,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "JOKTALY — Devis & Factures pour PME d'Afrique" },
      { name: "description", content: "Créez vos devis et factures en 2 minutes, envoyez-les par WhatsApp et suivez vos paiements. Pensé pour les entrepreneurs et PME d'Afrique francophone." },
      { property: "og:title", content: "JOKTALY — Devis & Factures pour PME d'Afrique" },
      { property: "og:description", content: "Créez vos devis et factures en 2 minutes, envoyez-les par WhatsApp et suivez vos paiements. Pensé pour les entrepreneurs et PME d'Afrique francophone." },
      { property: "og:url", content: "https://www.joktaly.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://www.joktaly.com/og-joktaly.jpg" },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:image", content: "https://www.joktaly.com/og-joktaly.jpg" },
      { name: "twitter:title", content: "JOKTALY — Devis & Factures pour PME d'Afrique" },
      { name: "twitter:description", content: "Créez vos devis et factures en 2 minutes, envoyez-les par WhatsApp et suivez vos paiements. Pensé pour les entrepreneurs et PME d'Afrique francophone." },
    ],
    links: [
      { rel: "canonical", href: "https://www.joktaly.com/" },
      { rel: "alternate", hrefLang: "fr", href: "https://www.joktaly.com/" },
      { rel: "alternate", hrefLang: "x-default", href: "https://www.joktaly.com/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "JOKTALY",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://www.joktaly.com/",
          inLanguage: "fr",
          description:
            "Créez vos devis et factures en 2 minutes, envoyez-les par WhatsApp et suivez vos paiements. Pensé pour les entrepreneurs et PME d'Afrique francophone.",
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "XOF",
            lowPrice: String(PRICING.gratuit.base),
            highPrice: String(PRICING.business.base),
            offerCount: String(PUBLIC_PLANS.length),
          },
        }),
      },
    ],
  }),
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
            <img src="/joktaly-insigne.png" alt="Logo JOKTALY — application de devis et factures" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold sm:text-xl">JOKTALY</span>
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
              <Link to="/register" search={{ plan: undefined, cycle: undefined }}>Essayer gratuitement</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="container relative mx-auto grid gap-8 px-4 py-10 text-white sm:py-20 md:grid-cols-2 md:items-center md:gap-12 md:py-24">
          <div className="text-center md:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur sm:text-sm">
              <Check className="h-3.5 w-3.5 text-accent" />
              <span>Fait à Dakar, pour les entrepreneurs d'Afrique francophone</span>
            </div>
            <h1 className="mt-4 text-[2rem] font-bold leading-[1.1] sm:text-5xl md:text-6xl">
              Vous faites le travail.
              <br />
              <span className="text-accent">Nous faisons la paperasse.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/85 sm:mt-5 sm:text-lg md:mx-0">
              <span className="sm:hidden">
                Devis, factures et relances depuis votre téléphone — en français et en FCFA.
              </span>
              <span className="hidden sm:inline">
                Par exemple, une couturière à Dakar prépare son devis avant que le client
                ne quitte sa boutique. Devis, factures, relances : tout se fait depuis
                votre téléphone, en français et en FCFA.
              </span>
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg sm:w-auto"
                asChild
              >
                <Link to="/register" search={{ plan: undefined, cycle: undefined }}>
                  Créer mon premier devis gratuit <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20 sm:w-auto"
                asChild
              >
                <a href="#demo">
                  <PlayCircle className="mr-2 h-4 w-4" /> Voir la démo en 60s
                </a>
              </Button>
            </div>
            {/* Payment methods */}
            <div className="mt-8 hidden flex-wrap items-center justify-center gap-3 sm:flex md:justify-start">
              <span className="text-xs uppercase tracking-wide text-white/60">
                Abonnement
              </span>
              {["Wave · validation manuelle"].map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-md bg-card px-2.5 py-1 text-xs font-semibold text-card-foreground shadow-sm"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <UserStoriesSection />

      {/* Features */}
      <section className="container mx-auto grid gap-6 px-4 py-20 md:grid-cols-4">
        {[
          { icon: FileText, title: "Devis pro", desc: "Numérotés auto, PDF en 1 clic" },
          { icon: CreditCard, title: "Factures", desc: "Enregistrement des paiements reçus" },
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

      {/* Voir l'app en action — démo interactive */}
      <section id="demo" className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Démo interactive
            </span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Un exemple de devis de chantier, du premier clic au partage
            </h2>
            <p className="mt-3 text-muted-foreground">
              Exemple fictif : rénovation de bureaux à Dakar, remise, TVA 18 % et suivi des
              paiements. Cliquez, tout est interactif — sans créer de compte.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center">
            <div className="w-full flex-1">
              <InteractiveDemo />
            </div>
            <div className="flex flex-col items-center">
              <MobileMockup />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                La même app dans votre poche
              </p>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-md text-center">
            <Button size="lg" className="w-full" asChild>
              <Link to="/register" search={{ plan: undefined, cycle: undefined }}>
                Créer mon compte gratuitement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Gratuit · Aucune carte requise · Prêt en 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Pourquoi choisir JOKTALY ? */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Pourquoi choisir JOKTALY ?</h2>
            <p className="mt-4 text-muted-foreground">
              L'outil de facturation pensé pour vous faire gagner du temps et de l'argent.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Création rapide de devis professionnels",
                desc: "Préparez un devis avec numérotation automatique et téléchargement PDF.",
              },
              {
                icon: FileText,
                title: "Conversion de devis en facture",
                desc: "Transformez un devis accepté en facture en un clic. Les lignes et montants sont repris.",
              },
              {
                icon: Send,
                title: "Partage par WhatsApp et préparation d’e-mail",
                desc: "WhatsApp prépare un message. Pour les factures, ouvrez aussi votre messagerie ; joignez le PDF vous-même.",
              },
              {
                icon: Wallet,
                title: "Suivi des paiements",
                desc: "Enregistrez les paiements reçus et préparez une relance WhatsApp des impayés.",
              },
              {
                icon: History,
                title: "Historique client",
                desc: "Retrouvez l'intégralité des transactions, devis et factures par client.",
              },
              {
                icon: Globe,
                title: "Adapté aux entrepreneurs africains",
                desc: "Devis en FCFA, TVA configurable et utilisation depuis votre téléphone.",
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

      {/* Pour qui ? */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Pour qui ?</h2>
          <p className="mt-4 text-muted-foreground">
            JOKTALY s'adresse à tous les professionnels qui veulent facturer simplement et professionnellement.
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
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tarifs</h2>
            <p className="mt-3 text-lg font-medium">Choisissez la formule adaptée à votre activité</p>
            <p className="mt-2 text-muted-foreground">
              Commencez gratuitement et évoluez selon vos besoins
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
          <div className="mx-auto mt-8 grid max-w-6xl gap-5 sm:mt-12 md:grid-cols-2 lg:grid-cols-4">
            {PUBLIC_PLANS.map((id) => {
              const plan = PRICING[id];
              const isFree = id === "gratuit";
              const highlight = id === "pro";
              const display = monthlyPrice(id, billing);
              return (
              <div
                key={plan.nom}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-lg ${highlight ? "border-2 border-primary" : ""}`}
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-md">
                    Populaire
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.nom}</h3>
                <div className="mt-3 flex h-10 items-end gap-1.5 sm:h-11">
                  <span className="text-[1.5rem] font-bold leading-none tracking-tight tabular-nums whitespace-nowrap sm:text-[1.65rem]">
                    {display.toLocaleString("fr-FR")}
                  </span>
                  <span className="mb-0.5 whitespace-nowrap text-sm text-muted-foreground">
                    FCFA / mois
                  </span>
                </div>
                {!isFree && billing === "yearly" && (
                  <p className="mt-1 text-xs font-medium text-accent">
                    Économisez 20% — facturé annuellement
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Pour toute demande d’arrêt : support@joktaly.com
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.ideal}</p>
                <ul className="mt-5 flex-1 space-y-2.5 sm:mt-6 sm:space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isFree ? "outline" : "default"}
                  asChild
                >
                  <Link to="/register" search={{ plan: id, cycle: billing === "yearly" ? "yearly" : undefined }}>
                    {isFree ? "Commencer gratuitement" : `Choisir ${plan.nom}`}
                  </Link>
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
              Des informations claires sur vos documents, vos échanges et notre assistance.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Lock, title: "Connexion HTTPS", desc: "Vos échanges sont chiffrés (HTTPS)." },
              { icon: Server, title: "Données enregistrées en ligne", desc: "Retrouvez vos documents avec votre compte et une connexion Internet." },
              { icon: ShieldCheck, title: "Informations de l’entreprise", desc: "NINEA, RC/RCCM, mentions légales et TVA à renseigner selon votre situation." },
              { icon: CreditCard, title: "Abonnement via Wave", desc: "Paiement par lien Wave, puis validation manuelle de la formule." },
              { icon: HeadphonesIcon, title: "Support par e-mail", desc: "Support par e-mail : support@joktaly.com" },
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
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-10">
          <h2 className="text-2xl font-bold md:text-3xl">Prêt à simplifier votre facturation ?</h2>
          <p className="mt-4 text-muted-foreground">
            Créez vos devis et suivez vos factures dans votre espace JOKTALY.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/register" search={{ plan: undefined, cycle: undefined }}>
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
              Tout ce que vous devez savoir pour bien démarrer avec JOKTALY.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-card px-6 shadow-[var(--shadow-card)]">
            <Accordion type="multiple" defaultValue={["faq-0"]} className="w-full">
              {[
                {
                  q: "Comment fonctionne l'envoi WhatsApp ?",
                  a: "Depuis un devis ou une facture enregistré, ouvrez le partage WhatsApp. Vérifiez le message pré-rempli, téléchargez le PDF et joignez-le vous-même dans WhatsApp. L’envoi reste à confirmer dans WhatsApp ; aucun lien public sécurisé n’est généré.",
                },
                {
                  q: "Puis-je mettre mon logo sur les devis PDF ?",
                  a: "Oui. Importez une image PNG ou JPEG dans les Paramètres entreprise. Le logo enregistré est repris sur vos devis et factures PDF ; vérifiez le rendu dans l’aperçu.",
                },
                {
                  q: "Que se passe-t-il si je dépasse ma limite mensuelle ?",
                  a: "La création est bloquée quand le quota est atteint. Vos documents existants restent accessibles. Le compteur mensuel repart au mois suivant ; une formule supérieure augmente le quota après son activation.",
                },
                {
                  q: "Mes données sont-elles sécurisées ?",
                  a: "Vos échanges avec le site sont chiffrés par HTTPS. L’accès à vos documents nécessite votre compte. Cela ne signifie pas un chiffrement de bout en bout et ne garantit pas une fréquence de sauvegarde.",
                },
                {
                  q: "Puis-je exporter mes données en Excel ?",
                  a: "L’export Excel / CSV n’est pas disponible actuellement. Vous pouvez télécharger vos devis et factures en PDF.",
                },
                {
                  q: "Comment annuler mon abonnement ?",
                  a: "Il n’y a pas de bouton d’annulation automatique dans le tableau de bord. Pour demander l’arrêt ou une modification de votre abonnement, écrivez à support@joktaly.com.",
                },
                {
                  q: "Comment puis-je payer mon abonnement ?",
                  a: "La page de paiement affiche le montant et ouvre un lien Wave. La validation du paiement et l’activation de la formule sont manuelles. Orange Money, Free Money et carte bancaire ne sont pas intégrés pour l’abonnement. Les paiements de vos clients sont enregistrés manuellement, sans encaissement en ligne par JOKTALY.",
                },
                {
                  q: "Est-ce que JOKTALY fonctionne sans connexion rapide ?",
                  a: "Une connexion Internet est nécessaire pour accéder à votre compte et enregistrer vos documents. Les performances dépendent de votre appareil et du réseau ; le fonctionnement hors ligne et les performances en 3G ne sont pas garantis.",
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="[&>div[data-state=closed]]:hidden">
                  <AccordionTrigger className="text-base font-semibold text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent forceMount className="text-sm text-foreground/80 leading-relaxed">
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
        <div className="container mx-auto px-4">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <img src="/joktaly-insigne.png" alt="Logo JOKTALY dans l'aperçu d'un devis" className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold">JOKTALY</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              L'outil de facturation pensé pour les entrepreneurs africains.
            </p>
            <div className="mt-4 flex flex-col gap-1 text-sm">
              <a
                href="mailto:contact@joktaly.com"
                className="font-medium text-primary hover:underline"
              >
                contact@joktaly.com
              </a>
              <a
                href="mailto:support@joktaly.com"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                support@joktaly.com
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-10 flex flex-col items-center justify-between gap-2 border-t px-4 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} JOKTALY. Tous droits réservés.</p>
          <p>
            Made with <span aria-label="amour">❤️</span> pour l'Afrique
          </p>
        </div>
      </footer>

      {/* Assistant IA en ligne */}
      <AiChatWidget />

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
                Inscrivez-vous gratuitement pour créer vos devis dans les limites de la formule Gratuit.
              </p>
              <Button
                className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                asChild
              >
                <Link to="/register" search={{ plan: undefined, cycle: undefined }}>Créer mon compte gratuit</Link>
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

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-lg">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl"
        aria-hidden="true"
      />
      <figure className="relative overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl ring-1 ring-white/10">
        <img
          src={heroImage}
          alt="Illustration d’une entrepreneure préparant un devis sur son téléphone"
          width={1280}
          height={1280}
          className="aspect-[16/11] w-full object-cover sm:aspect-square"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-left text-xs text-white/90">
          Exemple d’usage — atelier à Dakar
        </figcaption>
      </figure>

      {/* Carte devis flottante */}
      <div className="absolute -bottom-8 -left-2 w-[15rem] rounded-2xl border bg-card p-3.5 text-card-foreground shadow-2xl sm:-left-8 sm:w-[17rem] sm:p-4">
        <div className="flex items-center justify-between gap-2 border-b pb-2">
          <div className="flex items-center gap-2">
            <img src="/joktaly-insigne.png" alt="" className="h-6 w-6 object-contain" />
            <span className="text-sm font-bold">JOKTALY</span>
          </div>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {DEMO_DEVIS.numero}
          </span>
        </div>
        <p className="mt-2.5 truncate text-xs font-semibold">{DEMO_DEVIS.client}</p>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/10 px-2.5 py-2 text-primary">
          <span className="text-[10px] font-semibold uppercase tracking-wide">Total TTC</span>
          <span className="text-sm font-bold tabular-nums">{fmtFcfa(DEMO_DEVIS.total)}</span>
        </div>
        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
          <Send className="h-3 w-3" /> Exemple de devis
        </span>
      </div>
    </div>
  );
}

function UserStoriesSection() {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });

  const stories = [
    {
      image: coiffeuseImage,
      alt: "Fatou, coiffeuse à Dakar, facture une cliente depuis son ordinateur portable dans son salon moderne",
      legend: "Je prépare mes factures entre deux rendez-vous.",
      name: "Fatou N. — Salon Éclat, Dakar",
      role: "Coiffeuse & esthéticienne",
    },
    {
      image: menuisierImage,
      alt: "Ousmane, menuisier dans son atelier, envoie un devis depuis son téléphone entouré de bois et d'outils",
      legend: "J'envoie mes devis par WhatsApp directement depuis mon téléphone.",
      name: "Ousmane D. — Atelier Bois & Design, Abidjan",
      role: "Menuisier indépendant",
    },
  ];

  return (
    <section
      ref={ref}
      className="container mx-auto px-4 py-10 sm:py-20"
      aria-labelledby="user-stories-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Pensé pour vous
        </span>
        <h2
          id="user-stories-title"
          className="mt-3 text-2xl font-bold sm:text-3xl md:text-4xl"
        >
          Pensé pour ceux qui font tourner leur business au quotidien
        </h2>
        <p className="mt-3 text-muted-foreground">
          Des exemples d’usage pour les activités de tous les jours.
        </p>
      </div>

      <div
        className={`mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 ${
          inView ? "animate-fade-in-up" : "opacity-0"
        }`}
      >
        {stories.map((story) => (
          <figure
            key={story.name}
            className="group overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-[16/11] overflow-hidden sm:aspect-[4/3]">
              <img
                src={story.image}
                alt={story.alt}
                width={800}
                height={600}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
            <figcaption className="p-4 sm:p-6">
              <p className="mb-2 text-xs text-muted-foreground">Exemple d’usage</p>
              <blockquote>
                <p className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                  « {story.legend} »
                </p>
              </blockquote>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-foreground">
                  {story.name
                    .split(" ")
                    .filter((_, i) => i === 0 || i === 1)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{story.name}</p>
                  <p className="text-xs text-muted-foreground">{story.role}</p>
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

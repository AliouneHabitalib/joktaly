import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText, Receipt, Users, Package, Settings, BarChart3,
  MessageCircle, Mail, Search, BookOpen, LifeBuoy, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/aide")({
  head: () => ({
    meta: [
      { title: "Aide et support — TERA-DEVIS" },
      { name: "description", content: "Guides de démarrage, tutoriels et réponses aux questions fréquentes pour utiliser TERA-DEVIS : devis, factures, clients, produits et paiements." },
      { property: "og:title", content: "Aide et support — TERA-DEVIS" },
      { property: "og:description", content: "Guides de démarrage, tutoriels et FAQ pour tirer le meilleur de TERA-DEVIS." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AidePage,
});

const GUIDES = [
  {
    icon: Users,
    titre: "1. Ajouter vos clients",
    desc: "Enregistrez vos clients (particuliers ou entreprises) pour les retrouver en un clic dans vos devis.",
    to: "/clients" as const,
    cta: "Aller aux clients",
  },
  {
    icon: Package,
    titre: "2. Créer votre catalogue",
    desc: "Ajoutez vos produits et services avec leurs prix pour composer vos devis plus rapidement.",
    to: "/produits" as const,
    cta: "Aller aux produits",
  },
  {
    icon: FileText,
    titre: "3. Établir un devis",
    desc: "Ajoutez des lignes, appliquez une remise ou la TVA, puis téléchargez le PDF ou envoyez-le par WhatsApp.",
    to: "/devis" as const,
    cta: "Créer un devis",
  },
  {
    icon: Receipt,
    titre: "4. Facturer et encaisser",
    desc: "Convertissez un devis en facture, enregistrez les paiements (Wave, Orange Money, virement, espèces).",
    to: "/factures" as const,
    cta: "Voir les factures",
  },
  {
    icon: Settings,
    titre: "5. Personnaliser vos documents",
    desc: "Logo, couleur, NINEA, RC, conditions de paiement et préfixes de numérotation.",
    to: "/parametres/entreprise" as const,
    cta: "Ouvrir les paramètres",
  },
  {
    icon: BarChart3,
    titre: "6. Suivre votre activité",
    desc: "Chiffre d'affaires, encaissements, impayés et top clients dans vos statistiques.",
    to: "/statistiques" as const,
    cta: "Voir les statistiques",
  },
];

const FAQ = [
  {
    q: "Comment créer mon premier devis ?",
    a: "Rendez-vous dans « Devis » puis cliquez sur « Nouveau devis ». Choisissez un client, ajoutez vos lignes manuellement ou depuis votre catalogue de produits, ajustez la TVA et la remise si besoin, puis enregistrez. Le total est calculé automatiquement.",
  },
  {
    q: "Comment transformer un devis accepté en facture ?",
    a: "Depuis la liste des devis, utilisez l'action « Convertir en facture ». Toutes les lignes, montants et informations client sont repris automatiquement dans une nouvelle facture, que vous pouvez ensuite modifier.",
  },
  {
    q: "Comment envoyer un document à mon client ?",
    a: "Trois possibilités : télécharger le PDF et l'envoyer vous-même, utiliser le bouton WhatsApp qui prépare un message avec le récapitulatif, ou le bouton « Envoyer par email » depuis l'éditeur de facture qui ouvre votre messagerie avec un message pré-rempli.",
  },
  {
    q: "Comment enregistrer un paiement ?",
    a: "Ouvrez la facture concernée, section « Paiements », puis ajoutez le montant reçu avec le moyen utilisé (Wave, Orange Money, virement, espèces, chèque). Le statut de la facture passe automatiquement à « partiellement payée » ou « payée ».",
  },
  {
    q: "Comment ajouter mon logo et mes couleurs ?",
    a: "Dans Paramètres > Entreprise, importez votre logo et choisissez votre couleur principale. Un aperçu vous montre le rendu sur un devis. Vos PDF reprennent ensuite automatiquement votre identité visuelle.",
  },
  {
    q: "Que se passe-t-il quand j'atteins la limite de mon plan ?",
    a: "Chaque plan comporte un quota mensuel de devis et de factures. Une fois la limite atteinte, la création est bloquée jusqu'au premier jour du mois suivant, où les compteurs se réinitialisent automatiquement. Vous pouvez passer à un plan supérieur à tout moment pour continuer immédiatement.",
  },
  {
    q: "Quand mes compteurs mensuels se remettent-ils à zéro ?",
    a: "Le 1er de chaque mois à 00h00. Les documents déjà créés restent bien sûr accessibles ; seul le compteur du mois en cours repart de zéro.",
  },
  {
    q: "Puis-je gérer la TVA ?",
    a: "Oui. La TVA peut être activée ou désactivée document par document, et vous pouvez définir un taux par défaut dans les paramètres de votre entreprise. Chaque ligne peut aussi porter son propre taux.",
  },
  {
    q: "Mes données sont-elles sauvegardées ?",
    a: "Oui, vos devis, factures, clients et produits sont stockés de manière sécurisée sur nos serveurs et accessibles depuis n'importe quel appareil avec votre compte. Vos données ne sont visibles que par vous.",
  },
  {
    q: "Comment changer de plan ?",
    a: "Contactez-nous via WhatsApp ou par email : nous activons votre nouveau plan après confirmation du paiement (Wave, Orange Money ou carte bancaire).",
  },
];

const WHATSAPP = "https://wa.me/221771234567?text=" + encodeURIComponent("Bonjour, j'ai besoin d'aide avec TERA-DEVIS.");

function AidePage() {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const faq = term
    ? FAQ.filter((f) => (f.q + " " + f.a).toLowerCase().includes(term))
    : FAQ;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <Badge variant="secondary" className="gap-1">
          <LifeBuoy className="h-3.5 w-3.5" /> Centre d'aide
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Aide et support</h1>
        <p className="text-muted-foreground">
          Guides de démarrage, réponses aux questions fréquentes et contact direct avec notre équipe.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Démarrer en 6 étapes</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map(({ icon: Icon, titre, desc, to, cta }) => (
            <Card key={titre} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{titre}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={to}>{cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Questions fréquentes</h2>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une question…"
              className="pl-9"
              aria-label="Rechercher dans la FAQ"
            />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            {faq.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun résultat pour « {q} ». Contactez-nous ci-dessous, nous vous répondons rapidement.
              </p>
            ) : (
              <Accordion type="multiple" defaultValue={["faq-0"]} className="w-full">
                {faq.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-foreground/80">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-primary" /> Support WhatsApp
            </CardTitle>
            <CardDescription>
              Réponse rapide du lundi au samedi, de 9h à 19h (GMT).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                Discuter sur WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" /> Support par email
            </CardTitle>
            <CardDescription>
              Décrivez votre problème, nous revenons vers vous sous 24h ouvrées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:support@tera-devis.com?subject=Demande%20d%27assistance%20TERA-DEVIS">
                Écrire à l'équipe
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Besoin de plus de devis et factures ?</p>
              <p className="text-sm text-muted-foreground">
                Les plans supérieurs lèvent les limites mensuelles et débloquent les statistiques avancées.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Changer de plan</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
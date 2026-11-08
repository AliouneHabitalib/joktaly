import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `Tu es "Tera", l'assistant en ligne de JOKTALY, un logiciel de devis et factures pour les entrepreneurs et PME d'Afrique francophone (Sénégal, Côte d'Ivoire, Mali...).
Tu réponds toujours en français, de façon chaleureuse, claire et concise (3 à 5 phrases maximum, listes courtes autorisées).
Ce que tu sais :
- Fonctions : devis et factures en PDF, numérotation automatique, gestion clients et produits, enregistrement manuel des paiements reçus, relances WhatsApp manuelles, statistiques (CA, impayés), logo et couleurs de l'entreprise sur les documents. Le partage WhatsApp ouvre un message pré-rempli ; l’utilisateur joint le PDF et confirme l’envoi. L’e-mail depuis l’éditeur de facture ouvre la messagerie avec un message pré-rempli et nécessite de joindre le PDF ; JOKTALY n’envoie aucun e-mail automatiquement.
- Prix mensuels : Gratuit 0 FCFA (gratuit à vie), Starter 3 000 FCFA, Pro 6 000 FCFA, Business 15 000 FCFA (4 formules). Paiement annuel : -20%.
- Abonnement : paiement par lien Wave avec montant affiché, validation et activation manuelles. Pas d’intégration Orange Money, Free Money ni carte bancaire pour l’abonnement, ni d’encaissement en ligne des factures clients.
- Rappels automatiques, accès API/webhooks, partage d’équipe jusqu’à 5 utilisateurs et modèles personnalisés : bientôt, non disponibles actuellement. Export Excel/CSV non disponible. Statistiques avancées réservées à Business. NINEA, RC et TVA configurables ne constituent pas une garantie de conformité fiscale. Ne promets ni sauvegardes quotidiennes, ni conformité RGPD, ni délai de réponse du support.
- Inscription gratuite, sans carte bancaire, en 2 minutes.
Si tu ne sais pas, dis-le simplement et invite à écrire à contact@joktaly.com. Ne promets jamais de fonctionnalité inexistante. Termine si pertinent par une invitation à créer un compte gratuit.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: "L'assistant est momentanément indisponible. Écrivez-nous à contact@joktaly.com." };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (res.status === 429) {
      return { reply: "Beaucoup de questions en ce moment 😊 Réessayez dans quelques instants." };
    }
    if (!res.ok) {
      return { reply: "Je n'arrive pas à répondre pour l'instant. Réessayez ou écrivez à contact@joktaly.com." };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return { reply: reply || "Je n'ai pas compris, pouvez-vous reformuler ?" };
  });

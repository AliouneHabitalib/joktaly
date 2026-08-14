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

const SYSTEM_PROMPT = `Tu es "Tera", l'assistant en ligne de TERA-DEVIS, un logiciel de devis et factures pour les entrepreneurs et PME d'Afrique francophone (Sénégal, Côte d'Ivoire, Mali...).
Tu réponds toujours en français, de façon chaleureuse, claire et concise (3 à 5 phrases maximum, listes courtes autorisées).
Ce que tu sais :
- Fonctions : devis et factures professionnels en PDF, numérotation automatique, gestion clients et produits, suivi des paiements et relances, statistiques (CA, impayés), logo et couleurs de l'entreprise sur les documents.
- Prix mensuels : Gratuit 0 FCFA (gratuit à vie), Démarreur 3 000 FCFA, Essentiel 6 000 FCFA, Pro 9 500 FCFA, Entreprise 15 000 FCFA. Paiement annuel : -20%.
- Paiement par Wave, Orange Money, Free Money et carte bancaire.
- Inscription gratuite, sans carte bancaire, en 2 minutes.
Si tu ne sais pas, dis-le simplement et invite à écrire à contact@tera-devis.com. Ne promets jamais de fonctionnalité inexistante. Termine si pertinent par une invitation à créer un compte gratuit.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: "L'assistant est momentanément indisponible. Écrivez-nous à contact@tera-devis.com." };
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
      return { reply: "Je n'arrive pas à répondre pour l'instant. Réessayez ou écrivez à contact@tera-devis.com." };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return { reply: reply || "Je n'ai pas compris, pouvez-vous reformuler ?" };
  });

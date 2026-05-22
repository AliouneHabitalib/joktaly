import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/placeholder";
export const Route = createFileRoute("/_authenticated/devis")({
  component: () => <Placeholder title="Devis" desc="Module devis (formulaire 3 étapes, PDF, WhatsApp) — à générer au prochain tour." />,
});
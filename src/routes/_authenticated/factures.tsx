import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/placeholder";
export const Route = createFileRoute("/_authenticated/factures")({
  component: () => <Placeholder title="Factures" desc="Module factures + paiements — à générer au prochain tour." />,
});
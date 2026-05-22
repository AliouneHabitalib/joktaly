import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/placeholder";
export const Route = createFileRoute("/_authenticated/statistiques")({
  component: () => <Placeholder title="Statistiques" desc="Graphiques et rapports (plan Pro+) — à générer au prochain tour." />,
});
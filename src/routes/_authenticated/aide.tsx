import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/placeholder";
export const Route = createFileRoute("/_authenticated/aide")({
  component: () => <Placeholder title="Aide" desc="FAQ et tutoriels — à venir." />,
});
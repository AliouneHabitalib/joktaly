import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/placeholder";
export const Route = createFileRoute("/_authenticated/produits")({
  component: () => <Placeholder title="Produits & services" desc="Catalogue produits/services — à générer au prochain tour." />,
});
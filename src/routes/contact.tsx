import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LEGAL, publicHead } from "@/components/legal-page";

export const Route = createFileRoute("/contact")({
  head: publicHead("/contact", "Contact", "Écrivez à JOKTALY : contact@joktaly.com pour les questions générales, support@joktaly.com pour l'assistance."),
  component: () => (
    <LegalPage title="Contact">
      <ul>
        <li>Questions générales, offres : <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a></li>
        <li>Assistance, problème de compte ou de paiement : <a href={`mailto:${LEGAL.support}`}>{LEGAL.support}</a></li>
      </ul>
      <p>Basé à {LEGAL.siege}.</p>
    </LegalPage>
  ),
});

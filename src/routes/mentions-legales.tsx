import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LEGAL, publicHead } from "@/components/legal-page";

export const Route = createFileRoute("/mentions-legales")({
  head: publicHead("/mentions-legales", "Mentions légales", "Éditeur, immatriculation et hébergement du service JOKTALY."),
  component: () => (
    <LegalPage title="Mentions légales" updated="14/11/2026">
      <h2>Éditeur du service</h2>
      <ul>
        <li>Nom : {LEGAL.nom}</li>
        <li>Siège : {LEGAL.siege}</li>
        <li>NINEA : {LEGAL.ninea}</li>
        <li>RCCM : {LEGAL.rccm}</li>
        <li>Responsable de la publication : {LEGAL.responsable}</li>
        <li>Contact : <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a></li>
      </ul>
      <h2>Hébergement</h2>
      <p>Le site www.joktaly.com est hébergé par Vercel Inc. (États-Unis). Les données des comptes sont stockées sur l'infrastructure cloud utilisée par JOKTALY.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Le nom, le logo et le contenu de JOKTALY sont protégés. Toute reproduction sans autorisation écrite est interdite. Les documents (devis, factures) créés par les utilisateurs leur appartiennent.</p>
    </LegalPage>
  ),
});

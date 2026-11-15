import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LEGAL, publicHead } from "@/components/legal-page";

export const Route = createFileRoute("/cgu")({
  head: publicHead("/cgu", "Conditions générales d'utilisation", "Règles d'utilisation du service de devis et factures JOKTALY."),
  component: () => (
    <LegalPage title="Conditions générales d'utilisation" updated="14/11/2026">
      <h2>Objet</h2>
      <p>JOKTALY est un service en ligne pour créer des devis et factures, suivre les paiements, les dépenses, les stocks et les fournisseurs. Créer un compte vaut acceptation des présentes conditions.</p>
      <h2>Compte</h2>
      <p>Vous êtes responsable de la confidentialité de votre mot de passe et des informations saisies. Les informations doivent être exactes.</p>
      <h2>Responsabilité de l'utilisateur</h2>
      <p>Vous restez responsable du contenu de vos documents et de leur conformité aux règles fiscales et comptables applicables (TVA, mentions obligatoires, numérotation). JOKTALY fournit des outils, pas de conseil juridique ou fiscal.</p>
      <h2>Disponibilité</h2>
      <p>Nous faisons notre possible pour que le service reste disponible, sans garantie d'accès ininterrompu. Des maintenances peuvent avoir lieu.</p>
      <h2>Usages interdits</h2>
      <p>Il est interdit d'utiliser JOKTALY pour des activités illégales, des fraudes, ou de tenter d'accéder aux données d'autres utilisateurs.</p>
      <h2>Suspension</h2>
      <p>Un compte peut être suspendu en cas de non-respect de ces conditions.</p>
      <h2>Droit applicable</h2>
      <p>Ces conditions relèvent du droit sénégalais. Tout litige relève des tribunaux de Dakar, après une tentative de règlement amiable via <a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a>.</p>
    </LegalPage>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LEGAL, publicHead } from "@/components/legal-page";

export const Route = createFileRoute("/confidentialite")({
  head: publicHead("/confidentialite", "Politique de confidentialité", "Quelles données JOKTALY collecte, pourquoi, et comment exercer vos droits."),
  component: () => (
    <LegalPage title="Politique de confidentialité" updated="14/11/2026">
      <p>Cette politique explique comment {LEGAL.nom} ({LEGAL.siege}) traite vos données personnelles, dans le respect de la loi sénégalaise n° 2008-12 sur la protection des données à caractère personnel.</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Compte : adresse e-mail, nom, téléphone, mot de passe (enregistré chiffré).</li>
        <li>Entreprise : nom, coordonnées, NINEA, RC, logo, coordonnées bancaires que vous saisissez.</li>
        <li>Activité : clients, produits, devis, factures, paiements, dépenses, stocks, fournisseurs et justificatifs que vous enregistrez.</li>
        <li>Abonnement : formule choisie et référence du paiement Wave.</li>
        <li>Mesure d'audience anonyme des pages visitées.</li>
      </ul>
      <h2>Utilisation</h2>
      <p>Ces données servent uniquement à faire fonctionner le service, gérer votre abonnement et vous assister. Elles ne sont ni vendues ni louées.</p>
      <h2>Accès et sécurité</h2>
      <p>Les échanges passent en HTTPS. Chaque compte ne voit que les données de sa propre entreprise. Les justificatifs sont stockés dans un espace privé.</p>
      <h2>Durée de conservation</h2>
      <p>Les données sont conservées tant que le compte existe. À la suppression du compte, elles sont effacées, sauf obligation légale contraire.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l'accès, la correction ou la suppression de vos données en écrivant à <a href={`mailto:${LEGAL.support}`}>{LEGAL.support}</a>. Vous pouvez aussi saisir la Commission de protection des données personnelles (CDP) du Sénégal.</p>
    </LegalPage>
  ),
});

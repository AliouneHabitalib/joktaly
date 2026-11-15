import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LEGAL, publicHead } from "@/components/legal-page";

export const Route = createFileRoute("/a-propos")({
  head: publicHead("/a-propos", "À propos", "JOKTALY, l'outil de devis, factures et suivi de trésorerie conçu à Dakar pour les entrepreneurs africains."),
  component: () => (
    <LegalPage title="À propos de JOKTALY">
      <p>JOKTALY est un outil en ligne conçu à {LEGAL.siege} pour les commerçants, artisans, prestataires et petites entreprises. Il permet de faire des devis et factures en FCFA, de suivre ce que les clients doivent, d'enregistrer les dépenses, les stocks et les fournisseurs, et de voir sa trésorerie.</p>
      <p>Il fonctionne sur téléphone comme sur ordinateur, et une formule Gratuit permet de commencer sans payer.</p>
      <p><Link to="/register" search={{ plan: undefined, cycle: undefined }}>Créer un compte</Link> · <Link to="/contact">Nous contacter</Link></p>
    </LegalPage>
  ),
});

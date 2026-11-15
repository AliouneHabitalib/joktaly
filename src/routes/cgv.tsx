import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LEGAL, publicHead } from "@/components/legal-page";
import { PUBLIC_PLANS, PLANS } from "@/lib/plans";
import { formatMontant } from "@/lib/format";

export const Route = createFileRoute("/cgv")({
  head: publicHead("/cgv", "Conditions générales de vente et résiliation", "Prix, paiement, durée, renouvellement et résiliation des abonnements JOKTALY."),
  component: () => (
    <LegalPage title="Conditions générales de vente et résiliation" updated="14/11/2026">
      <h2>Vendeur</h2>
      <p>{LEGAL.nom}, {LEGAL.siege} — NINEA {LEGAL.ninea}, RCCM {LEGAL.rccm}.</p>
      <h2>Formules et prix</h2>
      <ul>
        {PUBLIC_PLANS.map((k) => (
          <li key={k}>{PLANS[k].nom} : {formatMontant(PLANS[k].prix_fcfa, "FCFA")} par mois</li>
        ))}
      </ul>
      <p>Les prix sont indiqués en francs CFA. Le paiement annuel bénéficie de la réduction indiquée sur la page des tarifs.</p>
      <h2>Paiement et activation</h2>
      <p>Le paiement se fait par Wave. La formule est activée après vérification du paiement par JOKTALY, à partir de la référence de transaction. L'activation n'est pas instantanée.</p>
      <h2>Durée et renouvellement</h2>
      <p>L'abonnement court pour la période payée (mois ou année). Il n'y a pas de prélèvement automatique : pour continuer, il faut payer la période suivante. Un renouvellement payé avant la fin s'ajoute à la date de fin en cours. À l'échéance sans renouvellement, le compte repasse aux limites de la formule Gratuit ; vos données sont conservées.</p>
      <h2>Résiliation</h2>
      <p>Comme il n'y a pas de renouvellement automatique, il suffit de ne pas renouveler. Pour demander la fermeture de votre compte et la suppression de vos données, écrivez à <a href={`mailto:${LEGAL.support}`}>{LEGAL.support}</a>.</p>
      <h2>Remboursement</h2>
      <p>Une période commencée n'est pas remboursée, sauf erreur de paiement ou service non fourni. Toute demande est à adresser à <a href={`mailto:${LEGAL.support}`}>{LEGAL.support}</a>.</p>
    </LegalPage>
  ),
});

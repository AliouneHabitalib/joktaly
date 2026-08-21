# TERA-DEVIS — Montée en gamme SaaS (par étapes)

Beaucoup de ce que vous décrivez existe déjà et fonctionne : dashboard, devis, factures, clients, produits, statistiques, PDF, paramètres entreprise, quotas, abonnements PayDunya, aide/FAQ, landing. Le travail utile est donc **compléter et polir**, pas reconstruire. Je propose 3 lots livrés l'un après l'autre, sans casser l'existant.

## Lot 1 — Cœur métier (je commence par celui-ci)

1. **WhatsApp partout** : bouton « Envoyer sur WhatsApp » sur devis et factures (liste + éditeur), message pré-rempli « Bonjour [Nom], veuillez trouver votre [devis/facture] N°XXX d'un montant de XXX FCFA », plus un bouton « Copier le message ». Utilise le numéro WhatsApp du client.
2. **Convertir un devis en facture** : bouton dans l'éditeur et la liste du devis, reprise automatique du client, des lignes, TVA, remise et conditions ; lien conservé vers le devis d'origine.
3. **Fiche client détaillée** : page par client avec devis, factures, paiements, total facturé et reste dû, plus recherche et filtres sur la liste.
4. **Dashboard enrichi** : KPI chiffre d'affaires, facturé, encaissé, reste à encaisser, nb devis / factures ; graphique mensuel payé/impayé ; « Activité récente » ; pastilles de statut (payée, en attente, en retard, brouillon).
5. **États vides et skeletons** élégants sur toutes les listes, confirmation avant suppression.

## Lot 2 — Documents et paramètres

6. **3 modèles PDF** (Moderne, Élégant, Minimaliste) sélectionnables dans les paramètres, avec logo, NINEA, RCCM, conditions, coordonnées bancaires et Mobile Money.
7. **Profil entreprise complet** avec aperçu en direct du rendu sur les documents (Mobile Money, RCCM, nom légal, devise).
8. **Paramètres en onglets** : Compte, Entreprise, Facturation (numérotation, format de date), Notifications, Sécurité (changement de mot de passe), Préférences, Abonnement.
9. **Devises** : XOF par défaut, plus XAF, EUR, USD, architecture ouverte à d'autres devises africaines.

## Lot 3 — Croissance et confort

10. **Onboarding 4 étapes** après inscription avec barre de progression (entreprise → client → premier devis).
11. **Recherche globale** (clients, devis, factures, numéros, montants) avec filtres date / client / statut / type.
12. **Centre de notifications** avec compteur non lus (facture créée, payée, en retard, devis accepté, nouveau client, abonnement).
13. **Rapports** : CA, ventes mensuelles, payées/impayées, meilleurs clients, prestations les plus vendues, export CSV et PDF.
14. **Landing repositionnée** : titre et sous-titre demandés, deux CTA, section « Tout ce qu'il vous faut pour gérer votre facturation », page À propos, FAQ complétée, SEO/Open Graph.
15. **Multilingue** : français par défaut, sélecteur de langue (FR/EN) sur l'app et la landing.

## Notes techniques

- Aucune suppression de table ni de données : uniquement des ajouts de colonnes (mobile money, RCCM, devise, modèle PDF, langue) et de nouvelles tables pour notifications, avec RLS et GRANT par entreprise.
- La séparation stricte des données reste assurée par les politiques RLS existantes basées sur `user_owns_entreprise`.
- Chaque lot est vérifié (build, typecheck, rendu mobile/tablette/desktop) avant de passer au suivant.

Je démarre par le Lot 1 dès votre accord.

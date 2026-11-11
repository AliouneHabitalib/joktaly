# Audit JOKTALY — diagnostic et plan d'action

## Diagnostic (étape A)

**Fonctionnent** : inscription, connexion, déconnexion, mot de passe oublié, clients, catalogue produits, devis/factures (remises, TVA, statuts, PDF, devis/facture vierges), saisie des paiements reçus.

**Partiels** : tableau de bord (pas de dépenses ni de bénéfice ; factures annulées comptées dans les statistiques), conversion devis → facture (peut s'arrêter à moitié en cas d'erreur), numérotation (deux documents créés en même temps peuvent viser le même numéro), partage WhatsApp/e-mail (PDF à joindre soi-même), rapports (6/12 mois, pas d'export), mentions légales des PDF (gardées sur l'appareil seulement).

**Ne fonctionnent pas** : abonnements payants — activation à la main, aucune expiration, aucun renouvellement, aucun historique des transactions.

**Absents** : dépenses, stocks, fournisseurs, rapports jour/semaine, export PDF/Excel des rapports, pages À propos / Contact / Mentions légales / Confidentialité / CGU / CGV / Résiliation.

**Sécurité** : chaque table est protégée et chaque entreprise ne voit que ses données (scan récent : aucun problème). Points à fermer ci-dessous.

## Plan par lots (étape B/C)

### Lot 1 — Critique (sécurité, abonnements)
1. Bloquer la création d'un profil avec une formule payante choisie par l'utilisateur lui-même.
2. Empêcher de lier un devis/facture au client d'une autre entreprise.
3. Protéger la tâche automatique de contrôle des quotas par une vraie clé secrète.
4. Corriger la lecture des abonnements (aujourd'hui bloquée) et la colonne « formule choisie » manquante dans l'historique.
5. Expiration : une formule payante dépassée repasse aux limites Gratuit.
6. Page admin « Activer un abonnement » (plan, durée, référence Wave) avec historique. Aucun paiement simulé ; validation par l'administrateur.

### Lot 2 — Haute (fiabilité des documents)
7. Numérotation sûre (sans doublon, même à deux en même temps).
8. Conversion devis → facture et enregistrement d'un document d'un seul bloc (tout ou rien).
9. Mentions légales et réglages documents enregistrés dans le compte (plus seulement sur l'appareil).
10. Statistiques : factures annulées exclues, une seule définition du chiffre d'affaires.

### Lot 3 — Nouveaux modules (avec vraies données)
11. Dépenses : ajout, catégorie, date, description, justificatif (photo/PDF), liste.
12. Stocks : quantité, prix d'achat, seuil d'alerte, entrées/sorties, valeur du stock.
13. Fournisseurs : fiche, achats, dettes, historique.
14. Tableau de bord : dépenses et bénéfice estimé.
15. Rapports jour/semaine/mois/année avec export PDF et Excel.

### Lot 4 — Vitrine et SEO
16. Pages publiques : À propos, Fonctionnalités, Tarifs, Contact, Aide publique, Mentions légales, Confidentialité, CGU, CGV, Résiliation (modèles à faire relire par un juriste). Liens dans le pied de page, sitemap à jour.

### Lot 5 — Marché africain
17. Pays de l'entreprise, numéros internationaux pour WhatsApp, TVA configurable sans supposer les règles d'un pays.

## Vérification après chaque lot
Vérification du code, tests automatiques (règles de formules, numérotation, expiration), essai des parcours avec le compte de test sur ordinateur et téléphone 375 px, contrôle que l'autre entreprise ne voit rien.

## Interventions manuelles
- Informations légales réelles de JOKTALY (raison sociale, adresse, NINEA, RCCM, responsable) pour les pages juridiques.
- Paiement automatique Wave / Orange Money : nécessite un compte marchand avec accès développeur (clés + notifications signées). Sans cela, l'activation reste manuelle.
- Déploiement Vercel après chaque lot.

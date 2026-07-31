# DevisPro Afrique

═══════════════════════════════════════════════════

  PROMPT MAÎTRE — DEVISPRO (APPLICATION COMPLÈTE)

═══════════════════════════════════════════════════

# RÔLE ET MISSION

Tu es un développeur full-stack senior expert en création de SaaS.

Tu vas construire DevisPro de A à Z : une application web de facturation

et gestion commerciale pour les petites entreprises d'Afrique francophone.

L'application doit être production-ready, mobile-first, en français,

et parfaitement adaptée au marché sénégalais et ouest-africain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. STACK TECHNIQUE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend  : React.js 18 + Vite + Tailwind CSS + shadcn/ui

Backend   : Node.js + Express.js (API REST)

Base de données : PostgreSQL + Prisma ORM

Auth      : Supabase Auth (email/password + Google OAuth)

PDF       : Puppeteer (rendu HTML vers PDF)

Storage   : Supabase Storage (logos, pièces jointes)

Email     : Resend API (emails transactionnels)

Paiement  : Wave CI/SN + Orange Money (intégration API)

Hébergement : Vercel (frontend) + Railway (backend + PostgreSQL)

État global : Zustand

Formulaires : React Hook Form + Zod (validation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. SCHÉMA DE BASE DE DONNÉES (PostgreSQL / Prisma)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Créer les tables suivantes avec toutes les relations :

TABLE users

  - id (UUID, PK)

  - email, nom, telephone, role (admin|user)

  - plan (starter|pro|business)

  - plan_expires_at

  - created_at

TABLE entreprises

  - id, user_id (FK)

  - nom, slogan, logo_url

  - adresse, ville, pays

  - telephone, email, site_web

  - ninea, rc (numéro registre commerce)

  - devise (FCFA par défaut), tva_taux (18% défaut)

  - couleur_primaire (hex, pour personnalisation PDF)

TABLE clients

  - id, entreprise_id (FK)

  - nom, prenom, entreprise_nom

  - email, telephone, whatsapp

  - adresse, ville, pays

  - notes, created_at

TABLE produits_services

  - id, entreprise_id (FK)

  - nom, description, type (produit|service)

  - prix_unitaire, unite (heure|jour|forfait|unité|m²)

  - tva_applicable (bool)

TABLE devis

  - id, entreprise_id (FK), client_id (FK)

  - numero (ex: DEV-2025-001, auto-incrémenté)

  - titre, objet

  - date_emission, date_validite

  - statut (brouillon|envoyé|accepté|refusé|expiré)

  - tva_taux, remise_pourcent, remise_montant

  - sous_total, montant_tva, total_ttc

  - notes, conditions_paiement

  - created_at, updated_at

TABLE devis_lignes

  - id, devis_id (FK)

  - description, quantite, unite

  - prix_unitaire, tva_taux

  - total_ht, total_ttc

  - ordre (int, pour réorganiser les lignes)

TABLE factures

  - id, entreprise_id (FK), client_id (FK)

  - devis_id (FK, nullable — facture directe possible)

  - numero (ex: FAC-2025-001)

  - titre, date_emission, date_echeance

  - statut (non_payée|partiellement_payée|payée|annulée)

  - montant_paye, total_ttc

  - mode_paiement (virement|wave|orange_money|espèces|chèque)

  - notes, created_at

TABLE factures_lignes (même structure que devis_lignes)

TABLE paiements

  - id, facture_id (FK)

  - montant, date_paiement

  - mode (wave|orange_money|virement|espèces|chèque)

  - reference, notes

TABLE documents_modeles

  - type (devis|facture|recu|bon_commande|contrat|attestation)

  - contenu_html (template Handlebars)

  - entreprise_id (FK, null = modèle global)

TABLE rappels

  - id, facture_id (FK)

  - type (email|whatsapp), envoye_at

  - statut (envoyé|echoué)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. ARCHITECTURE DES PAGES ET ROUTES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUTH

  /login            → Connexion email/password

  /register         → Inscription + création entreprise

  /forgot-password  → Réinitialisation mot de passe

APP (protégées, sidebar fixe)

  /dashboard              → Tableau de bord KPIs

  /devis                  → Liste des devis

  /devis/nouveau          → Créer un devis

  /devis/:id              → Voir/modifier un devis

  /factures               → Liste des factures

  /factures/nouvelle      → Créer une facture directe

  /factures/:id           → Voir/modifier une facture

  /clients                → Liste clients

  /clients/:id            → Fiche client + historique

  /produits               → Catalogue produits/services

  /documents              → Modèles (reçu, contrat, bon commande)

  /statistiques           → Graphiques et rapports (plan Pro+)

  /parametres/entreprise  → Infos + logo entreprise

  /parametres/compte      → Profil utilisateur

  /parametres/abonnement  → Plans et facturation

  /aide                   → FAQ + tutoriels

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. TABLEAU DE BORD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Afficher les KPIs suivants (période : ce mois / ce trimestre / cette année) :

  ✦ Chiffre d'affaires total (factures payées)

  ✦ Factures impayées (montant + nombre)

  ✦ Devis en attente de réponse

  ✦ Taux de conversion devis → facture (%)

  ✦ Clients actifs ce mois

  ✦ Graphique : revenus par mois (barres, 12 derniers mois)

  ✦ Liste : 5 dernières activités (devis créé, facture payée, etc.)

  ✦ Liste : factures en retard de paiement avec bouton relance

  ✦ Raccourcis rapides : Nouveau devis | Nouvelle facture | Ajouter client

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. MODULE DEVIS — FONCTIONNEMENT DÉTAILLÉ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Formulaire de création en 3 étapes :

ÉTAPE 1 — Informations générales

  - Sélection client (recherche + création rapide en modal)

  - Objet du devis (texte libre)

  - Date d'émission (auto = aujourd'hui)

  - Date de validité (auto = +30 jours)

ÉTAPE 2 — Lignes de prestation

  - Tableau avec colonnes : Description | Qté | Unité | Prix HT | TVA | Total TTC

  - Bouton "Ajouter une ligne"

  - Sélection depuis catalogue produits/services (optionnel)

  - Possibilité de réorganiser les lignes (drag & drop)

  - Remise globale (% ou montant fixe)

  - Toggle TVA (activé/désactivé par ligne ou global)

  - Totaux auto : Sous-total HT | TVA | Total TTC

  - Champ notes / conditions de paiement

ÉTAPE 3 — Aperçu et envoi

  - Aperçu PDF en temps réel (iframe)

  - Boutons :

    ✦ Télécharger PDF

    ✦ Envoyer par email (modal avec message pré-rédigé)

    ✦ Envoyer sur WhatsApp (lien wa.me/?text=... avec PDF joint)

    ✦ Marquer comme envoyé

    ✦ Convertir en facture (si statut = accepté)

Numérotation automatique : DEV-YYYY-NNN (ex: DEV-2025-047)

Statuts avec couleurs : brouillon (gris) | envoyé (bleu) |

  accepté (vert) | refusé (rouge) | expiré (orange)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. MODULE FACTURES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Conversion devis → facture en 1 clic (toutes les lignes copiées)

  - Numérotation auto : FAC-YYYY-NNN

  - Date d'échéance paramétrable (30j, 60j, 90j, personnalisé)

  - Enregistrement de paiements partiels ou totaux

  - Statuts : non payée | partiellement payée | payée | annulée

  - Envoi email/WhatsApp avec message de relance pré-rédigé

  - Avoir (annulation facture avec génération d'avoir)

  - Rappels automatiques : J+7, J+15, J+30 après échéance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. GÉNÉRATION PDF — SPÉCIFICATIONS TECHNIQUES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Utiliser Puppeteer côté serveur. Template HTML avec Handlebars.

Structure du PDF :

  EN-TÊTE

    → Logo entreprise (aligné gauche) | Nom entreprise + coordonnées (droite)

    → NINEA | RC | Téléphone | Email | Site web

  

  BLOC DESTINATAIRE

    → "Devis / Facture adressé(e) à :"

    → Nom client, entreprise, adresse, téléphone

  

  INFORMATIONS DOCUMENT

    → Numéro | Date d'émission | Date validité/échéance | Statut

  

  TABLEAU DES PRESTATIONS

    → Colonnes : N° | Description | Qté | Unité | Prix HT | TVA | Total TTC

    → Alternance de couleur de ligne (blanc / gris très clair)

  

  TOTAUX

    → Sous-total HT | Remise | TVA | TOTAL TTC (en gras, grande taille)

    → Mention : "TVA non applicable" si TVA désactivée

  

  BAS DE PAGE

    → Notes / Conditions de paiement

    → Coordonnées bancaires (si renseignées)

    → Mention légale + numéro de page

  

  PERSONNALISATION

    → Couleur d'accent = couleur primaire de l'entreprise

    → Police configurable (3 choix : classique, moderne, minimaliste)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8. ENVOI WHATSAPP — LOGIQUE COMPLÈTE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bouton "Envoyer sur WhatsApp" → ouvre wa.me/ avec message pré-rempli.

Message devis (pré-rédigé, modifiable) :

"Bonjour [Prénom Client], veuillez trouver ci-joint le devis n°[DEV-2025-001]

d'un montant de [150 000 FCFA] pour [objet]. Ce devis est valable jusqu'au

[date]. Pour toute question, je reste disponible. Cordialement, [Nom]"

Message relance facture :

"Bonjour [Prénom], je me permets de vous rappeler que la facture n°[FAC-2025-001]

d'un montant de [200 000 FCFA] est arrivée à échéance le [date].

Merci de bien vouloir procéder au règlement. [Nom]"

→ Le PDF est hébergé sur Supabase Storage → lien public inclus dans le message

→ Numéro WhatsApp pré-rempli depuis la fiche client

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9. GESTION DES CLIENTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Page liste : tableau avec recherche, tri, filtre par statut

Fiche client : 

  - Informations de contact (modifiables inline)

  - Onglets : Devis | Factures | Paiements | Notes

  - KPIs client : CA total | Factures impayées | Dernier contact

  - Historique chronologique de toutes les interactions

  - Bouton : Nouveau devis pour ce client (pré-remplit le client)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10. MODÈLES DE DOCUMENTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Créer les modèles PDF suivants (formulaires de remplissage + génération PDF) :

  ✦ REÇU DE PAIEMENT

    Champs : client, montant, mode paiement, date, objet, signature

  ✦ BON DE COMMANDE

    Champs : fournisseur, articles, quantités, prix, livraison, signature

  ✦ CONTRAT DE PRESTATION SIMPLE

    Champs : parties, objet, durée, montant, modalités, clauses, signatures

  ✦ ATTESTATION DE SERVICE RENDU

    Champs : bénéficiaire, service, période, validé par, cachet

  ✦ DEVIS (modèle de base)

  ✦ FACTURE (modèle de base)

Chaque modèle : aperçu miniature → clic → formulaire de remplissage → PDF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11. PLANS ET LIMITES (middleware à implémenter)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STARTER (3 000 FCFA/mois ou 5 $/mois)

  → Max 10 devis/mois | 5 factures/mois

  → 1 utilisateur | logo personnalisé | export PDF

  → Pas de statistiques avancées | pas de rappels auto

PRO (6 000 FCFA/mois ou 10 $/mois)

  → Devis illimités | factures illimitées

  → Gestion clients illimitée | catalogue produits

  → Rappels automatiques | modèles personnalisés

  → Statistiques basiques

BUSINESS (15 000 FCFA/mois ou 25 $/mois)

  → Tout Pro + multi-utilisateurs (jusqu'à 5)

  → Statistiques avancées + export Excel/CSV

  → Support prioritaire | domaine personnalisé PDF

  → API d'accès (webhooks)

Implémenter un middleware checkPlanLimit() appelé à chaque création

de devis/facture, retournant une erreur 403 avec message d'upgrade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12. UI/UX — DESIGN SYSTEM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Palette de couleurs :

  Primaire  : #1D9E75 (vert émeraude africain)

  Secondaire: #085041 (vert foncé)

  Accent    : #F5A623 (or sénégalais)

  Danger    : #E53935

  Neutre    : #F8F9FA | #6B7280 | #1F2937

Typographie : DM Sans (interface) + DM Mono (numéros/montants)

Icônes      : Lucide React

Composants  : shadcn/ui (button, dialog, table, form, tabs, toast)

Navigation : Sidebar fixe (desktop) + bottom nav (mobile)

Sidebar items (avec icônes) :

  Tableau de bord | Devis | Factures | Clients |

  Documents | Statistiques | Paramètres | Aide

Responsive : mobile-first (cible : smartphones Android en Afrique)

Mode sombre : optionnel (toggle dans les paramètres)

Langue : français uniquement (i18n non requis pour v1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

13. LOCALISATION MARCHÉ AFRICAIN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → Devise par défaut : FCFA (format : 150 000 FCFA)

  → TVA par défaut : 18 % (Sénégal) — paramétrable par pays

  → Pays disponibles : Sénégal, Côte d'Ivoire, Mali, Burkina Faso,

     Cameroun, Guinée, Togo, Bénin

  → Champ NINEA (numéro fiscal sénégalais) dans profil entreprise

  → Paiements mobiles : Wave, Orange Money (en priorité sur Stripe)

  → Format date : JJ/MM/AAAA

  → Format numérique : espace comme séparateur de milliers (150 000)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

14. SÉCURITÉ ET PERFORMANCES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → JWT tokens (access 15min + refresh 7j)

  → Row Level Security (RLS) Supabase : chaque user ne voit

    que les données de son entreprise

  → Rate limiting : 100 req/min par IP (express-rate-limit)

  → Validation entrées : Zod côté client + côté serveur

  → CORS configuré pour domaine de production uniquement

  → Variables d'environnement : jamais de secrets en dur

  → Logs d'activité sensibles (connexions, exports PDF)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

15. ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — Fondations (Semaine 1-2)

  □ Init projet React + Vite + Tailwind

  □ Schéma Prisma + migrations PostgreSQL

  □ Auth Supabase (inscription, connexion, logout)

  □ Layout sidebar + routing React Router v6

  □ Middleware auth + vérification plan

PHASE 2 — Cœur métier (Semaine 3-5)

  □ Module clients (CRUD complet)

  □ Catalogue produits/services

  □ Création devis (formulaire 3 étapes)

  □ Génération PDF (Puppeteer backend)

  □ Conversion devis → facture

  □ Module paiements + statuts

PHASE 3 — Communication (Semaine 6)

  □ Envoi email (Resend API)

  □ Intégration WhatsApp (wa.me links)

  □ Rappels automatiques (cron job)

  □ Upload logo (Supabase Storage)

PHASE 4 — Analytics & finitions (Semaine 7-8)

  □ Tableau de bord KPIs (graphiques Recharts)

  □ Module statistiques (plan Pro/Business)

  □ Modèles documents (reçu, contrat, bon commande)

  □ Paramètres entreprise + personnalisation PDF

  □ Gestion abonnements + middleware limites

PHASE 5 — Production (Semaine 9)

  □ Tests unitaires (Vitest) + tests e2e (Playwright)

  □ Déploiement Vercel + Railway

  □ Monitoring (Sentry)

  □ Onboarding utilisateur (guide de démarrage in-app)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONSIGNE FINALE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commence par la Phase 1. Pour chaque étape :

  1. Génère le code complet et fonctionnel (pas de pseudo-code)

  2. Explique brièvement les choix techniques importants

  3. Indique ce qu'il faut configurer dans les variables d'environnement

  4. Signale les prérequis à installer (npm install ...)

  5. Propose la commande de test pour vérifier que ça fonctionne

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tera-devis.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/52cbfd93-0c90-42a5-b569-a3102e510689).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

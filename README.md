# InfraRed Optic-Store

Site vitrine premium pour un opticien (3 boutiques à Tunis), construit avec
Next.js (App Router), TypeScript, Tailwind CSS et PostgreSQL/Prisma.

## Démarrage rapide

```bash
npm install
cp .env.example .env      # puis renseignez DATABASE_URL, AUTH_SECRET, Supabase…
npx prisma migrate deploy # applique les migrations sur votre base
npm run db:seed           # crée catégories/marques/produits/boutiques de démo + comptes
npm run dev
```

Avant chaque livraison locale :

```bash
npm test
npm run lint
npm run build
npm run local:check
```

`local:check` vérifie la base locale, la présence des photos produits et leur
véritable transparence alpha. Les prix à confirmer et les services externes
encore non configurés sont signalés comme avertissements sans bloquer le travail local.

Le site est accessible sur http://localhost:3000. `npm run db:seed` affiche
dans la console un mot de passe temporaire pour chaque compte si
`SEED_ADMIN_PASSWORD` / `SEED_COMMERCIAL_PASSWORD` / `SEED_DEVELOPER_PASSWORD`
ne sont pas définis dans `.env` — changez-les depuis `/admin/utilisateurs`
après la première connexion.

Avec Docker :

```bash
docker compose up -d   # PostgreSQL local
npm run db:migrate
npm run db:seed
```

## Stack

- **Frontend** — Next.js (App Router), React 19, TypeScript, Tailwind CSS v4
- **Base de données** — PostgreSQL via Prisma ORM
- **Stockage images** — Supabase Storage (upload direct depuis l'admin/commercial,
  via l'API REST Supabase — voir `src/lib/supabase-storage.ts`)
- **Authentification** — session JWT (cookie httpOnly) + rôles `ADMIN` /
  `DEVELOPER` / `COMMERCIAL`, vérifiés côté serveur sur chaque action
  (`src/lib/authz.ts`)

## Source unique de vérité

Toutes les données métier (produits, marques, catégories, promotions,
boutiques, paramètres du site) viennent de PostgreSQL via Prisma — il n'y a
plus de données statiques utilisées par les pages publiques ou l'admin.
`src/lib/data.ts` ne contient plus que le contenu de démonstration utilisé
par `prisma/seed.ts` pour peupler une base vide.

- `src/lib/catalogue-db.ts` — produits, marques, catégories
- `src/lib/site-data.ts` — paramètres du site (StoreSettings) et boutiques

## Structure

```
src/
  app/
    page.tsx                    Accueil
    catalogue/                  Catalogue — recherche, filtres, tri
    produit/[slug]/              Fiche produit + JSON-LD Product/Breadcrumb
    marques/, promotions/, nouveautes/
    boutique/                    Adresses, horaires, cartes Google Maps
    contact/                     Formulaire (Server Action + DB) + contacts directs
    mentions-legales/, confidentialite/
    admin/                       Back-office complet (ADMIN/DEVELOPER, +COMMERCIAL
                                  pour Boutiques/Paramètres/Messages)
    commercial/                  Espace commercial (prix, dispo, photos)
    api/uploads/                 Upload image → Supabase Storage (auth + rôle requis)
    sitemap.ts, robots.ts        SEO
  components/
  lib/
    authz.ts                     Vérification de rôle centralisée (requireRole…)
    supabase-storage.ts          Upload/suppression Supabase Storage (fetch natif)
    catalogue-db.ts, site-data.ts  Accès DB (source unique de vérité)
    data.ts                      Contenu de démonstration — seed uniquement
  types/
prisma/
  schema.prisma
  seed.ts
```

## Comptes créés par le seed

| Rôle | Email | Accès |
| --- | --- | --- |
| ADMIN | admin@infrared.tn | Back-office complet |
| DEVELOPER | dev@infrared.tn | Back-office complet (même périmètre qu'ADMIN) |
| COMMERCIAL | marketing@infrared.tn | `/commercial` + Boutiques/Paramètres/Messages dans `/admin` |

## Design

- Rouge InfraRed `#E0122C` — utilisé comme accent (CTA, badges), jamais en fond permanent
- Neutres : encre `#14110F`, brume `#F6F3F1`, ligne `#E7E2DE`
- Typographie : Fraunces (display, éditorial) + Inter (texte, UI)

## Production / configuration externe restante

Voir le rapport de livraison fourni séparément pour le détail, mais en
résumé, avant mise en production :

1. Créer le bucket Supabase Storage (public, lecture seule) et renseigner
   `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET`.
2. Renseigner `DATABASE_URL`, `AUTH_SECRET` (valeur longue et aléatoire),
   `NEXT_PUBLIC_SITE_URL` (votre domaine `.tn` définitif) dans `.env`.
3. Définir `SEED_ADMIN_PASSWORD` / `SEED_COMMERCIAL_PASSWORD` /
   `SEED_DEVELOPER_PASSWORD` avant de lancer le seed en production.
4. Renseigner les coordonnées réelles (téléphone, WhatsApp, réseaux sociaux,
   horaires) depuis `/admin/parametres`, et les boutiques depuis
   `/admin/boutiques` — la page d'accueil et le footer les affichent
   automatiquement dès qu'ils existent en base.

## E-mail « mot de passe oublié »
La configuration SMTP se fait depuis **Admin → Paramètres → Envoi d'e-mails**.
Choisissez Gmail / Google Workspace ou Microsoft 365 / Outlook professionnel : le serveur, le port et le mode STARTTLS sont remplis automatiquement. Pour un hébergeur de domaine classique, choisissez **Autre hébergeur** et renseignez son serveur, port et mode SSL/TLS.

Le mot de passe SMTP est chiffré en base. Après configuration, utilisez **Envoyer un e-mail de test** avant de déployer.

En production, `AUTH_SECRET` et `NEXT_PUBLIC_SITE_URL` doivent être renseignés.


## Étape 6 — performances
- Pagination serveur et index PostgreSQL dédiés au catalogue.
- Recherche API protégée et annulation des requêtes obsolètes côté client.
- Détection de doublons perceptuels accélérée par bucketing.

## Boutiques — version actuelle

Les horaires sont configurés manuellement, boutique par boutique, dans `/admin/boutiques`.
Le statut public est uniquement `Ouverte` ou `Fermée`. La carte Google Maps reste disponible pour l'itinéraire, mais aucune clé Google Places n'est nécessaire pour les horaires.

## Catalogue enrichi (pré-publication)

Le seed comprend maintenant 17 produits, 10 marques et au moins 3 vues par produit. Pour appliquer les ajouts sur une base existante sans écraser les prix ni les galeries complètes déjà saisies dans l'admin :

```bash
npx prisma generate
npm run db:seed
```

Les modèles ajoutés dont le prix tunisien n'est pas encore validé utilisent `0` et s'affichent comme **Prix en boutique**. Le dashboard accepte également `0` pour ce cas.

Les photos produits mises en cache sont stockées sous
`public/images/catalogue-real/`. Les deux vues contenant une personne sont
explicitement exclues du script `catalogue:transparent`.

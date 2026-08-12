# InfraRed Optic-Store

Site vitrine premium pour un opticien, construit avec Next.js (App Router),
TypeScript et Tailwind CSS. Inspiré fonctionnellement de l'experience
GrandOptical (catalogue, filtres, fiches produit, marques, promotions) mais
avec une identite graphique 100% originale : rouge InfraRed + blanc.

## Demarrage rapide (Windows)

Double-cliquez sur `START.bat`, ou en ligne de commande :

```bash
npm install
npm run dev
```

Le site est accessible sur http://localhost:3000

Le site peut fonctionner sans base de donnees pour la vitrine : les pages
publiques lisent des donnees de demonstration dans `src/lib/data.ts`
(produits, marques, categories). C'est un vrai site fonctionnel, pas une
maquette statique — recherche, filtres, tri, fiches produit, WhatsApp,
Google Maps, etc. fonctionnent reellement.

## A propos du logo

Le logo InfraRed fourni dans une conversation precedente n'etait pas
accessible dans cette session. `src/components/Logo.tsx` contient une
marque provisoire (rouge/blanc, motif "verres") utilisee partout : header,
footer, favicon, dashboards. Remplacez ce composant par votre logo reel
(SVG de preference) — un seul fichier a modifier pour que le logo change
partout dans le site.

## Stack

- Frontend — Next.js 15 (App Router), React, TypeScript, Tailwind CSS v4
- Base de donnees (prete, non branchee) — PostgreSQL via Prisma ORM,
  schema compatible Supabase (`prisma/schema.prisma`)
- Stockage images (prevu) — Supabase Storage
- Deploiement (prepare) — Netlify

## Structure

```
src/
  app/
    page.tsx                 Accueil (hero, categories, incontournables)
    catalogue/                /catalogue — recherche, filtres, tri
    produit/[slug]/            /produit/[slug] — fiche produit
    marques/                   /marques
    promotions/                /promotions
    nouveautes/                 /nouveautes
    boutique/                   /boutique — adresse, horaires, carte
    contact/                    /contact — formulaire + contacts directs
    admin/                       /admin — scaffold dashboard (lecture seule)
    commercial/                  /commercial — scaffold dashboard (lecture seule)
    sitemap.ts, robots.ts        SEO
  components/                 Header, Footer, Logo, ProductCard, filtres…
  lib/data.ts                 Donnees de demonstration + fonctions de requete
  types/                       Types partages (Product, Brand, Category…)
prisma/
  schema.prisma                Modeles User, Product, ProductImage, Category, Brand…
  seed.ts                      Peuple la base avec les memes donnees de demo
```

## Design

- Rouge InfraRed `#E0122C` — CTA, badges, accents
- Blanc `#FFFFFF` — couleur dominante de l'interface
- Neutres : encre `#14110F`, brume `#F6F3F1`, ligne `#E7E2DE`
- Typographie : Fraunces (display, editorial) + Inter (texte, UI)
- Signature visuelle : motif "verres" (deux cercles relies), repris dans le
  logo et en accent autour du visuel du hero (`.lens-ring`)

## Ce qui est fonctionnel des maintenant

- **Vrai logo InfraRed** intégré (détouré, fond transparent) dans le header,
  le footer, le favicon et les dashboards — un seul composant
  `src/components/Logo.tsx` à modifier si besoin, fichiers sources dans
  `public/logo.png` et `public/logo-mark.png`
- **Plus aucune image Picsum.** Produits, catégories et boutiques sans
  vraie photo affichent un placeholder honnête (`PlaceholderMedia`), jamais
  une fausse photo presentee comme reelle. Le hero utilise un visuel
  graphique original anime (`HeroVisual`), pas une photo volee.
- Navigation complete, recherche, menu mobile anime, header qui se
  compacte au scroll
- Homepage restructuree dans l'esprit GrandOptical (sans le copier) :
  Hero -> Categories -> Selection du moment -> Nouveautes -> Promotions ->
  Marques -> Presentation InfraRed -> Nos boutiques -> Contact/WhatsApp/Instagram
- Catalogue avec filtres (categorie, marque, genre, nouveaute, promotion),
  tri, et **filtres mobiles en bottom sheet** anime (glisse depuis le bas)
- Fiches produit avec galerie, **zoom au clic (lightbox)**, prix barre,
  reduction, section "Vous pourriez aussi aimer"
- Pages Marques (cartes premium), Promotions, Nouveautes, Boutiques (3
  vraies adresses, cartes Google Maps, boutons Itineraire/WhatsApp)
- **Dashboards admin/commercial pre-structures** (sidebar de navigation,
  bandeau clair indiquant qu'ils ne sont pas encore fonctionnels) — voir
  ci-dessous
- SEO : metadata par page, Open Graph, sitemap.xml, robots.txt
- Schema Prisma **conserve tel quel** (User/Role, Product, ProductImage,
  Category, Brand, StoreSettings), pret pour PostgreSQL/Supabase

## A propos des marques et des photos

- **Marques** : la liste actuelle (Carrera, Ray-Ban, Vogue, Polaroid, Emporio
  Armani) reste une liste de demonstration — Facebook bloque le scraping
  automatise et Instagram necessite une connexion, donc je n'ai pas pu
  recuperer votre vraie liste de marques depuis ces pages. Donnez-moi la
  liste et je mets a jour `brands` dans `src/lib/data.ts`.
- **Photos** : idem, impossible d'extraire vos vraies photos produits ou de
  boutique depuis les reseaux sociaux (acces bloque + droits d'auteur). Le
  systeme de placeholders (`PlaceholderMedia`, flag `isPlaceholder`) est
  concu pour qu'il suffise de renseigner une vraie URL par photo (Supabase
  Storage) pour qu'elle s'affiche automatiquement partout, sans toucher au
  design.

## Dashboards admin / commercial — etat reel

Ces ecrans **ne sont pas fonctionnels**, et le disent explicitement a
l'ecran (bandeau + sidebar avec sections desactivees) :

- `/admin` : structure prevue = Produits (affiche, lecture seule) / Marques /
  Categories / Promotions / Utilisateurs / Parametres (ces 5 dernieres
  sections sont visibles dans la sidebar mais desactivees)
- `/commercial` : structure prevue = Produits (affiche) / Photos / Prix /
  Disponibilite (desactivees)
- Aucune vraie authentification, aucune vraie mutation de donnees pour
  l'instant — ce sera l'etape suivante (voir "Prochaines etapes").

## Prochaines etapes (non incluses dans cette premiere livraison)

Le cahier des charges complet couvre une plateforme e-commerce avec
back-office multi-roles — c'est un projet a part entiere. Cette premiere
livraison pose des bases solides et reellement fonctionnelles cote vitrine.
Restent a brancher, dans l'ordre conseille :

1. Connexion Prisma/PostgreSQL — creer `.env` a partir de
   `.env.example`, lancer `npx prisma migrate dev`, puis `npx prisma db seed`.
   Remplacer les fonctions de `src/lib/data.ts` par de vraies requetes
   Prisma (les signatures de fonctions sont deja pensees pour ca).
2. Authentification + RBAC — routes `/admin` et `/commercial`
   actuellement en lecture seule et sans protection ; a securiser (ex.
   Auth.js/NextAuth avec le modele `User` deja prevu, roles `ADMIN` /
   `COMMERCIAL`).
3. CRUD produits/marques/categories/promotions — API routes Next.js
   (`src/app/api/...`) branchees sur Prisma, formulaires d'admin.
4. Upload et gestion des images — Supabase Storage, compression,
   reordonnancement, photo principale, suppression en cascade.
5. Suppression definitive vs archivage — logique decrite dans le
   cahier des charges (confirmation, purge Storage, verification des
   orphelins).
6. Deploiement Netlify — le projet est pret (Next.js standard, pas de
   dependance serveur exotique), a connecter au depot GitHub prive une
   fois pret.

## Qualite

`npm run build` et `npx tsc --noEmit` ont ete executes sans erreur avant
la livraison. Toutes les routes publiques listees ci-dessus sont testees
manuellement en local.

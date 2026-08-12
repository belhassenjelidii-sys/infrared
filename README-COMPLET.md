# InfraRed Optic-Store — package complet

Cette archive contient le projet Next.js **et** les fichiers d'environnement/Docker
nécessaires au développement local.

## 1. PostgreSQL existant

Le conteneur attendu est:

- Nom: `infrared-postgres`
- Image: `postgres:16-alpine`
- Port PC: `5432`
- Utilisateur: `infrared`
- Base: `infrared`

Le `.env` inclus correspond à ces paramètres.

## 2. Vérifier PostgreSQL

```powershell
docker ps
docker inspect infrared-postgres --format "{{range .Config.Env}}{{println .}}{{end}}"
docker exec -it infrared-postgres psql -U infrared -d infrared
```

Dans psql:

```sql
\dt
\q
```

## 3. Installer et lancer le site

```powershell
npm install
npx prisma generate
npm run dev
```

Site:
`http://localhost:3000`

Ou double-cliquez sur `START.bat`.

## 4. Prisma Studio

```powershell
npx prisma studio
```

## 5. Seed de démonstration

Si la base est vide et que vous voulez injecter les catégories/marques/produits de démonstration:

```powershell
npx prisma db seed
```

Avant de faire cela, vérifiez vos tables avec `\dt`. Ne faites pas `prisma migrate reset` si vous voulez conserver des données existantes.

## 6. Docker

`docker-compose.yml` est fourni pour recréer PostgreSQL avec les mêmes paramètres.

Si votre conteneur `infrared-postgres` fonctionne déjà, **ne faites pas `docker compose down -v`**.

Pour démarrer uniquement PostgreSQL quand il n'existe pas:

```powershell
docker compose up -d postgres
```

Pour vérifier:

```powershell
docker ps
```

## 7. Images

Les pages publiques ont des images locales dans:

`public/images/products`
`public/images/categories`
`public/images/stores`

Le logo est dans `public/`.

## 8. Important

La vitrine actuelle possède encore une couche de données de démonstration dans
`src/lib/data.ts`. Prisma est préparé et le seed existe, mais toutes les pages
ne sont pas encore entièrement converties en requêtes PostgreSQL. L'étape
suivante est de brancher catalogue, produits, marques, catégories et boutiques
directement sur Prisma, puis de construire l'authentification Admin/Commercial.


## Corrections intégrées — version 2

- Upload image par URL ou fichier, avec Ctrl+V libre, drag & drop et preview.
- Découpage automatique du fond via `@imgly/background-removal-node`, sortie PNG transparente dans `public/uploads`.
- CRUD produits, marques, catégories et promotions.
- Hero et titres de catégories éditables depuis Paramètres.
- Toggle global pour afficher/cacher les prix publics.
- Mega-menu desktop en grille 4 colonnes + accordéon mobile.
- Filtre par forme (`forme=Ronde`, etc.).
- Marque ajoutée au dashboard visible automatiquement dans le slider de la home.
- Bouton retour en haut fixe.

### Important avant production
`@imgly/background-removal-node` est distribué sous licence AGPL. Vérifie la compatibilité de cette licence avec l'exploitation commerciale du site avant la mise en production. Pour une version commerciale finale, on pourra remplacer le moteur par une solution sous licence adaptée ou un service de traitement d'images.

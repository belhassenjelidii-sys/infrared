# Base de données PostgreSQL dans Docker

## 1. Vérifier le conteneur

PowerShell :

```powershell
docker ps
```

Si le conteneur s'appelle `infrared-optic-storelogo` :

```powershell
docker inspect infrared-optic-storelogo
```

## 2. Ouvrir PostgreSQL directement

Essayez :

```powershell
docker exec -it infrared-optic-storelogo psql -U postgres
```

Puis dans `psql` :

```sql
\l
\c postgres
\dt
\q
```

Si votre utilisateur ou votre base porte un autre nom, regardez les variables du conteneur :

```powershell
docker inspect infrared-optic-storelogo --format '{{range .Config.Env}}{{println .}}{{end}}'
```

Cherchez `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`.

## 3. Ouvrir la base avec Prisma Studio

Depuis le dossier du projet :

```powershell
cd "C:\Users\root\Documents\site web optique\infrared-optic-store"
```

Créez/complétez `.env` avec :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public"
```

Puis :

```powershell
npx prisma generate
npx prisma studio
```

Prisma Studio s'ouvrira dans le navigateur.

## 4. Si PostgreSQL n'est pas exposé sur le port 5432

Vérifiez :

```powershell
docker port infrared-optic-storelogo
```

Si vous voyez par exemple `0.0.0.0:5433 -> 5432`, utilisez `localhost:5433` dans `DATABASE_URL`.

## 5. Vérifier rapidement les tables

```powershell
docker exec -it infrared-optic-storelogo psql -U postgres -d postgres -c "\dt"
```

Pour voir les produits, si la base s'appelle `infrared_optic_store` :

```powershell
docker exec -it infrared-optic-storelogo psql -U postgres -d infrared_optic_store -c "SELECT id,name,price FROM products LIMIT 20;"
```

> Important : le nom exact de la base et l'utilisateur doivent venir de votre conteneur Docker. Ne les inventez pas ; utilisez `docker inspect` si la commande `psql` refuse la connexion.

# Déploiement Docker OVH

Les uploads ne sont jamais inclus dans Git ni dans l'image Docker. En
production, `UPLOAD_STORAGE="local"` écrit uniquement dans
`/app/public/uploads`, qui est un bind mount du VPS.

## Préparation unique du VPS

Le conteneur Next.js s'exécute avec l'utilisateur `infrared` (UID/GID `1001`).
Créez le répertoire persistant avec les droits correspondants :

```bash
sudo install -d -o 1001 -g 1001 -m 0750 /var/www/infrared/uploads
sudo test -w /var/www/infrared/uploads
```

Copiez ensuite le modèle d'environnement et renseignez les mots de passe et
secrets réels. Le mot de passe PostgreSQL doit être identique dans
`POSTGRES_PASSWORD` et `DATABASE_URL`.

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

## Démarrage et mises à jour

```bash
INFRARED_ENV_FILE=.env.production docker compose --env-file .env.production up -d --build
```

Le service web écoute dans le conteneur sur `0.0.0.0:3000` et l'hôte publie
uniquement `127.0.0.1:3000`. Nginx pourra donc être ajouté plus tard comme
reverse proxy sans exposer directement Next.js.

Le volume PostgreSQL existant reste `infrared_postgres_data`. Les deux commandes
suivantes conservent ce volume et le bind mount des images :

```bash
INFRARED_ENV_FILE=.env.production docker compose --env-file .env.production down
INFRARED_ENV_FILE=.env.production docker compose --env-file .env.production up -d --build
```

N'utilisez jamais `docker compose down -v` : cette variante supprime le volume
PostgreSQL. Sauvegardez régulièrement le volume PostgreSQL et
`/var/www/infrared/uploads`.

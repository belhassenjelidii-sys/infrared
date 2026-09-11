<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# InfraRed - Règles Git obligatoires

## Sauvegarde automatique GitHub

Après CHAQUE étape de développement terminée :

1. Vérifier les fichiers modifiés avec :
   git status

2. Vérifier que le projet fonctionne avant toute sauvegarde.
   Exécuter au minimum :
   npm run build

3. Si le build échoue :
   - ne pas faire de commit
   - ne pas faire de push
   - corriger les erreurs
   - relancer le build

4. Quand l'étape fonctionne :
   git add .

5. Créer un commit séparé pour cette étape avec un message clair :
   git commit -m "description claire de la modification"

6. Envoyer immédiatement le commit vers GitHub :
   git push origin main

7. Vérifier que le push a réussi avant de commencer l'étape suivante.

## Historique

Chaque étape importante doit avoir son propre commit.

Ne jamais regrouper plusieurs grosses fonctionnalités différentes dans le même commit.

Le but est de pouvoir revenir facilement à une ancienne version du site.

## Sécurité

Ne jamais ajouter ou envoyer vers GitHub :

- .env
- .env.local
- .env.production
- mots de passe
- clés API
- tokens
- secrets
- bases de données locales

Avant chaque commit, vérifier qu'aucun secret n'est inclus.

## Git interdit

Ne jamais utiliser sans demande explicite :

- git push --force
- git reset --hard
- git clean -fd

Ne jamais réécrire l'historique de main.

## Avant une nouvelle tâche

Exécuter :

git status
git branch --show-current

Vérifier que la branche active est main.

## Après chaque tâche

Afficher :

- résultat du build
- hash du commit
- message du commit
- confirmation du push GitHub

Ne pas considérer l'étape comme terminée tant que le commit et le push n'ont pas réussi.

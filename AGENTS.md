<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# EXCEPTION TEMPORAIRE (priorité absolue)

Ne JAMAIS exécuter git add, git commit, git push, npm test ni npm run build, sauf demande explicite dans le message. Je fais moi-même les tests, le commit et le push.
Une tâche est terminée quand les fichiers sont modifiés. Ne signale pas d'erreur si aucun commit ni push n'a été fait.

# InfraRed - Règles

## Git (quand l'exception ci-dessus est supprimée)

Après chaque étape : git status, npm run build, puis si le build passe : git add ., un commit clair par étape, git push origin main. Si le build échoue, ne pas commit ni push : corriger d'abord. Pas de commit vide. Si le push échoue, signaler l'erreur.
Afficher à la fin : résultat du build, hash et message du commit, confirmation du push.

## Interdit sans demande explicite

- git push --force, git reset --hard, git clean -fd, git add -f
- Réécrire l'historique de main

## Sécurité

Ne jamais commit ni push : .env, .env.local, .env.production, mots de passe, clés API, tokens, secrets, bases de données locales. Vérifier avant chaque commit.

## Avant une tâche

git status et git branch --show-current : la branche active doit être main.

## Économie de tokens

Patchs ciblés uniquement, ne pas réécrire de fichiers entiers, ne lire que les fichiers nécessaires. Réponses finales courtes : fichiers modifiés + ce qu'il faut tester.
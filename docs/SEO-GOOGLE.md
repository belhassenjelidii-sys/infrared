# Mise en ligne SEO locale — InfraRed Optic-Store

Le site prépare trois pages locales distinctes :

- `/boutique/kram` — Opticien au Kram
- `/boutique/tunisia-mall` — Opticien à Tunisia Mall / Lac 2
- `/boutique/el-aouina` — Opticien à El Aouina

## Avant la publication

1. Définir `NEXT_PUBLIC_SITE_URL` avec le domaine HTTPS définitif.
2. Créer la propriété du domaine dans Google Search Console.
3. Copier le code de validation dans `GOOGLE_SITE_VERIFICATION`.
4. Exécuter `npm run production:check`.
5. Après déploiement, envoyer `https://votre-domaine.tn/sitemap.xml` dans Search Console.
6. Tester les pages boutique avec le test Google des résultats enrichis.

## Google Business Profile — indispensable pour les résultats locaux

Créer ou revendiquer une fiche distincte et vérifiée pour chaque boutique. Pour chaque fiche :

- utiliser exactement le même nom, téléphone, adresse et horaires que sur le site ;
- choisir la catégorie principale réellement proposée par Google qui correspond au métier d'opticien ;
- lier la fiche directement à sa page locale, et non systématiquement à l'accueil ;
- ajouter des photos réelles de la façade et de l'intérieur ;
- tenir les horaires à jour ;
- demander honnêtement des avis aux clients et répondre aux avis reçus ;
- ne jamais acheter de faux avis et ne pas ajouter de mots-clés artificiels au nom de l'entreprise.

Liens officiels :

- https://support.google.com/business/answer/7091
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://search.google.com/search-console/about
- https://search.google.com/test/rich-results

## Suivi mensuel

Dans Search Console, suivre les impressions, clics, positions et pages indexées pour les recherches locales. Dans Google Business Profile, contrôler les appels, demandes d'itinéraire et clics vers chaque page boutique.

Le référencement local dépend aussi de la distance de l'utilisateur, de la pertinence de la fiche, de la notoriété, des liens reçus et des avis. Une première position ne peut donc pas être garantie par le code seul.

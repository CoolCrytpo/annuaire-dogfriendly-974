# Technical Brief — Annuaire Dog Friendly 974

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- PostGIS
- MapLibre
- Playwright

## Architecture
Monolithe modulaire avec quatre zones principales :
- front public
- front admin
- API / route handlers
- jobs d'import et de revalidation

## Deployment expectations
- déploiement simple
- environnement preview + production
- base PostgreSQL avec PostGIS activé
- stockage de médias séparé
- logs accessibles

## Core modules
1. catalog
2. search
3. map
4. submissions
5. moderation
6. sources
7. confidence
8. duplicates
9. rechecks
10. audit

## Public pages
- `/`
- `/annuaire`
- `/carte`
- `/lieux/[slug]`
- `/communes/[slug]`
- `/categories/[slug]`
- `/methodologie`
- `/contact`

## Admin pages
- `/admin`
- `/admin/places`
- `/admin/places/[id]`
- `/admin/submissions`
- `/admin/sources`
- `/admin/duplicates`
- `/admin/rechecks`
- `/admin/settings`

## API design rules
- validation stricte des entrées
- réponses d'erreur homogènes
- logs sur les actions critiques
- jamais de publication directe depuis une source externe
- endpoints admin protégés
- audit trail sur modifications critiques

## Public UX rules
- mobile-first
- lisibilité maximale
- filtres simples
- composant carte synchronisé avec la liste
- aucune surcharge décorative

## Admin UX rules
- densité utile
- productivité > esthétique
- bulk actions si pertinent
- vues de comparaison côte à côte pour sources et doublons

## Data ingestion rules
- importer sous forme de brouillons ou de candidats
- normaliser avant comparaison
- scorer avant review
- conserver la source brute
- ne jamais écraser silencieusement une donnée validée

## Test strategy
- tests unitaires sur logique critique
- tests d'intégration sur API
- tests E2E Playwright sur parcours majeurs
- tests responsive au minimum sur mobile et desktop

## Definition of done
Une feature est finie si :
- elle remplit le brief
- elle gère les erreurs
- elle est testée
- elle est documentée
- elle respecte les contraintes éditoriales et data

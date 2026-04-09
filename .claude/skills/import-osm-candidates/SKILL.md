---
name: import-osm-candidates
description: Transforme des objets OpenStreetMap pertinents en candidats propres pour l'annuaire, sans surinterpréter les tags.
disable-model-invocation: true
user-invocable: true
---

Objectif : tirer parti d'OSM pour découvrir des lieux et espaces potentiellement pertinents.

## Tags à surveiller
- `pets_allowed`
- `dog`
- `leisure=dog_park`
- autres tags explicites liés aux animaux

## Sortie attendue
- objet candidat normalisé
- catégorie candidate
- statut chien candidat
- tags originaux utiles
- besoin ou non de review

## Règles
- rester prudent sur la couverture et l'hétérogénéité OSM
- si le tag n'est pas explicite, rester sur `unknown`
- ne jamais publier automatiquement

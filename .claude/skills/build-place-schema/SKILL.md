---
name: build-place-schema
description: Génère les données structurées adaptées à une fiche lieu en fonction du type d'établissement et des données vérifiées disponibles.
user-invocable: true
---

Objectif : produire un schéma structuré cohérent et propre pour les fiches.

## Étapes
1. identifier le type de lieu
2. choisir le type schema pertinent
3. mapper les champs disponibles
4. intégrer les informations dog-friendly seulement si elles sont explicites et justifiées
5. produire un JSON-LD propre

## Règles
- ne pas ajouter de champ non supporté par les données réelles
- ne pas surexposer des données non vérifiées
- si l'information liée aux animaux n'est pas explicite, ne pas l'inventer

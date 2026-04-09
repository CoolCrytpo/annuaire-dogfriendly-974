---
name: dedupe-places
description: Compare deux fiches ou plus pour estimer s'il s'agit du même lieu et proposer une fusion ou un maintien séparé.
user-invocable: true
---

Objectif : éviter les doublons sans fusionner à tort.

## Critères à comparer
- nom et variantes orthographiques
- distance géographique
- site web
- téléphone
- catégorie
- adresse
- source commune
- cohérence des descriptions

## Sortie attendue
- `same_place`: true/false/uncertain
- `similarity_score`: 0-100
- `recommended_action`
- `merge_risks`
- `canonical_candidate`
- `notes`

## Règles
- un nom proche seul ne suffit pas
- une proximité géographique seule ne suffit pas
- si l'incertitude est réelle, retourner `uncertain`
- en cas de fusion recommandée, préciser quelle fiche doit devenir la canonique

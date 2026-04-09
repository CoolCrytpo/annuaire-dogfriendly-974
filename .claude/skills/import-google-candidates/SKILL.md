---
name: import-google-candidates
description: Transforme des résultats Google Places en candidats propres pour l'annuaire, avec normalisation, déduplication initiale et niveau de review.
disable-model-invocation: true
user-invocable: true
---

Objectif : convertir un lot Google Places en entrées admin exploitables.

## Pour chaque entrée
- normaliser le nom
- mapper la catégorie interne
- conserver la localisation
- identifier les attributs utiles
- vérifier la présence ou non d'un signal relatif aux chiens
- préparer un objet candidat

## Sortie attendue
Pour chaque candidat :
- `candidate_name`
- `normalized_name`
- `mapped_category`
- `location`
- `source_payload_summary`
- `candidate_dog_policy`
- `needs_human_review`
- `possible_duplicate_keys`

## Règles
- `allowsDogs` ou équivalent = indice, pas vérité absolue
- ne jamais publier depuis cet import
- séparer clairement faits bruts et interprétation minimale

---
name: triage-submission
description: Trie une proposition publique de nouveau lieu ou de correction, identifie ce qui doit être créé ou mis à jour et prépare la revue admin.
user-invocable: true
---

Objectif : transformer une soumission brute en action claire pour l'admin.

## Étapes
1. Identifier le type : nouveau lieu ou correction.
2. Extraire les champs utiles.
3. Chercher un doublon plausible.
4. Vérifier si la politique chien est explicite.
5. Proposer l'action suivante.

## Sortie attendue
- résumé court
- type de soumission
- action recommandée
- champs à créer ou mettre à jour
- niveau de confiance proposé
- besoin de review complémentaire
- doublon probable ou non

## Actions recommandées possibles
- `create_draft`
- `attach_to_existing_place`
- `request_review`
- `reject_insufficient_evidence`
- `merge_with_submission`

## Règles
- ne jamais publier
- ne jamais survaloriser une soumission déclarative
- être conservateur si la preuve est faible
- prioriser le rattachement à une fiche existante si un doublon est probable

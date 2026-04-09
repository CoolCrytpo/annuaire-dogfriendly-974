---
name: qa-annuaire-feature
description: Réalise une revue QA complète d'une feature de l'annuaire avant merge, en couvrant parcours, erreurs, responsive et cohérence métier.
user-invocable: true
---

Objectif : vérifier qu'une feature est réellement intégrable.

## Checklist
- la feature respecte le périmètre
- les cas nominaux fonctionnent
- les états vides / loading / erreur existent
- le responsive est correct
- la cohérence public/admin est respectée
- la logique data et éditoriale n'est pas cassée
- les logs utiles existent si ingestion ou modération
- les tests nécessaires existent

## Sortie attendue
- `status`: pass / pass_with_notes / fail
- problèmes détectés
- sévérité
- recommandations concrètes

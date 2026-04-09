---
name: compute-confidence-review
description: Calcule ou révise le score de confiance d'une fiche à partir de ses sources, de sa fraîcheur et de ses contradictions.
user-invocable: true
---

Objectif : aider l'admin à attribuer un niveau de confiance cohérent.

## Entrées à considérer
- type de source
- fraîcheur
- cohérence multi-sources
- preuve directe ou non
- conflit éventuel
- type de vérification récente

## Sortie attendue
- `confidence_score`
- `confidence_level`
- `positive_signals`
- `negative_signals`
- `recommended_next_review_at`
- `admin_notes`

## Règles
- expliquer les raisons du score
- ne pas surévaluer une information partielle
- malus important si conflit non résolu
- si les données sont faibles, garder une confiance faible

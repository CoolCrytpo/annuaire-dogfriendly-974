---
name: verify-dog-policy
description: Vérifie la politique d'accueil des chiens à partir de sources explicites. Utiliser lors de l'analyse d'une fiche, d'une page d'établissement, d'une contribution ou d'un import externe.
user-invocable: true
---

Objectif : déterminer une **politique chien candidate** strictement à partir de faits explicites.

## Sortie attendue
Retourner un JSON ou une synthèse structurée contenant au minimum :
- `candidate_dog_policy`: `allowed` | `conditional` | `disallowed` | `unknown`
- `candidate_conditions`
- `evidence_quote`
- `source_type`
- `reasoning_summary`
- `needs_human_review`

## Règles impératives
- N'infère jamais à partir des photos, du ton marketing ou du type de lieu.
- Si la source n'est pas explicite, retourner `unknown`.
- Si la source évoque des conditions, préférer `conditional`.
- Si les sources se contredisent, signaler le conflit et demander une review humaine.
- Citer textuellement le passage utile si possible.
- Résumer sans romancer.

## Signal mapping indicatif
- "chiens acceptés", "pets welcome", "animaux admis" -> `allowed`
- "chiens acceptés en terrasse", "sur demande", "avec supplément", "en laisse" -> `conditional`
- "animaux interdits", "chiens non admis" -> `disallowed`
- rien d'explicite -> `unknown`

## Format de réponse recommandé
```json
{
  "candidate_dog_policy": "conditional",
  "candidate_conditions": [
    "laisse obligatoire",
    "terrasse uniquement"
  ],
  "evidence_quote": "Les chiens sont acceptés uniquement en terrasse et doivent être tenus en laisse.",
  "source_type": "official_website",
  "reasoning_summary": "La source est explicite et récente, mais impose des conditions.",
  "needs_human_review": false
}
```

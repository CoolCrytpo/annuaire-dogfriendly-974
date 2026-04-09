# Scoring Model — Annuaire Dog Friendly 974

## Goal
Produire un score interne de confiance de 0 à 100, puis l'exposer publiquement sous forme de niveau simple.

## Public levels
- `high` = 75 à 100
- `medium` = 45 à 74
- `low` = 0 à 44

## Proposed scoring rules

### Positive signals
- +35 : source officielle explicite
- +25 : confirmation humaine récente avec preuve
- +20 : vérification terrain ou appel confirmé récent
- +15 : source structurée crédible cohérente
- +10 : plusieurs sources cohérentes
- +5 : fiche revue récemment

### Negative signals
- -30 : contradiction majeure entre sources
- -25 : donnée purement déclarative sans preuve
- -20 : source trop ancienne
- -15 : conditions vagues ou non confirmées
- -10 : source secondaire seule
- -10 : doublon non résolu ou ambiguïté sur l'identité du lieu

## Freshness multiplier
La fraîcheur doit peser :
- < 90 jours : aucun malus
- 90 à 180 jours : léger malus
- 180 à 365 jours : malus moyen
- > 365 jours : malus fort

## Public display
Le public voit :
- niveau de confiance
- date de vérification
- éventuelle mention "info déclarative" ou "à confirmer"

Le public ne voit pas le détail mathématique complet.

## Admin display
L'admin voit :
- score brut
- raisons du score
- signaux positifs et négatifs
- date de dernière revue
- conflits

## Mandatory fallback
Si les données sont insuffisantes :
- score modeste
- niveau public faible
- statut chien peut rester `unknown`

## Prohibited behavior
- ne jamais gonfler artificiellement le score
- ne jamais déduire la confiance d'une note marketing ou du prestige du lieu

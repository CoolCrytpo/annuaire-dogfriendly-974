# Architecture Rules

- Utiliser un monolithe modulaire.
- Garder une séparation nette entre public, admin, API et jobs.
- Favoriser la simplicité de lecture et de maintenance.
- Éviter les patterns abstraits inutiles au MVP.
- Centraliser les types et enums métier.
- Valider toutes les entrées côté serveur.
- Conserver un audit trail pour les changements critiques.
- Prévoir les jobs d'import et de revalidation comme modules explicites.
- Ne pas enterrer la logique métier dans les composants UI.

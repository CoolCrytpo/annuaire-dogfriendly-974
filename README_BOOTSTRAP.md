# Bootstrap package — Annuaire Dog Friendly 974

Ce dossier contient un pack de configuration Claude Code prêt à copier dans le repo avant le lancement du développement.

## Contenu
- `CLAUDE.md` : noyau d'instructions projet
- `.claude/rules/` : règles modulaires
- `.claude/skills/` : playbooks opérationnels
- `.claude/agents/` : subagents spécialisés
- `docs/` : mémoire projet détaillée
- `MEMORY_SEED.md` : base optionnelle à copier dans la mémoire auto si souhaité
- `.claude/settings.json` : activation explicite de l'auto memory

## Ordre conseillé
1. copier ces fichiers dans le repo
2. relire `CLAUDE.md` et les docs
3. lancer Claude Code dans le repo
4. vérifier les instructions chargées avec `/memory`
5. éventuellement copier `MEMORY_SEED.md` dans la mémoire projet via `/memory`
6. lancer le prompt de `docs/LAUNCH_PROMPT.md`

## Note
Le `MEMORY_SEED.md` n'est pas la mémoire auto elle-même. La mémoire auto de Claude Code vit hors repo. Ce fichier sert de base si tu veux amorcer cette mémoire proprement.

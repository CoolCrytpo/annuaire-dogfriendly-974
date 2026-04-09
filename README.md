# 🐾 Annuaire Dog Friendly 974

Annuaire éditorial des lieux dog-friendly à La Réunion.

**Principe :** on construit un annuaire éditorial augmenté par la data, pas un robot qui devine.
Aucune donnée externe n'est publiée sans validation humaine.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **PostgreSQL + PostGIS** (géolocalisation, recherche spatiale)
- **MapLibre GL JS** (carte interactive)
- **Playwright** (tests E2E)

---

## Installation

### Prérequis

- Node.js v20+
- PostgreSQL v15+ avec PostGIS

### 1. Cloner et installer

```bash
git clone <repo-url> dogfriendly974
cd dogfriendly974
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Renseigner au minimum :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dogfriendly974
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Base de données

Créer la base et activer PostGIS :

```sql
CREATE DATABASE dogfriendly974;
\c dogfriendly974
CREATE EXTENSION postgis;
```

Appliquer les migrations :

```bash
node scripts/migrate.js
```

Avec données de démo (dev) :

```bash
node scripts/migrate.js --demo
```

### 4. Créer un utilisateur admin

```bash
npm run admin:create-user admin@monsite.re MotDePasseSecret
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Accès :
- Site public : http://localhost:3000
- Admin : http://localhost:3000/admin

---

## Structure du projet

```
app/
  page.tsx              # Page d'accueil
  annuaire/             # Liste des lieux avec filtres
  carte/                # Carte interactive
  lieux/[slug]/         # Fiche lieu
  communes/[slug]/      # Lieux par commune
  categories/[slug]/    # Lieux par catégorie
  proposer/             # Formulaire de proposition
  methodologie/         # Page méthodologie
  contact/
  admin/                # Back-office admin (protégé)
  api/                  # API REST

components/
  public/               # Composants du front public
  admin/                # Composants admin
  ui/                   # Composants partagés (badges, etc.)

lib/
  db/                   # Client PostgreSQL + requêtes
  types/                # Types TypeScript centraux
  scoring/              # Module de confiance
  validation/           # Schémas Zod
  auth/                 # Sessions admin

jobs/
  detect-duplicates.ts  # Détection de doublons
  revalidation-check.ts # Revalidation périodique
  import-osm.ts         # Import depuis OpenStreetMap
  create-admin-user.ts  # Création d'un admin

migrations/
  001_initial.sql       # Schéma complet
  002_seed.sql          # Catégories + communes de La Réunion
  003_demo.sql          # Données de démo (dev uniquement)

tests/e2e/              # Tests Playwright
```

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run test:e2e` | Tests Playwright E2E |
| `npm run job:duplicates` | Détecter les doublons |
| `npm run job:revalidation` | Revalider les fiches anciennes |
| `npm run job:import-osm` | Importer depuis OpenStreetMap |
| `npm run admin:create-user` | Créer un utilisateur admin |

---

## Workflows métier

### 1. Créer une fiche manuellement

1. `/admin/places/new` → remplir nom, catégorie, commune, politique chien
2. Rattacher une source principale (site officiel, appel, terrain)
3. Cliquer "Publier" (vérifie les conditions minimales)

### 2. Traiter une contribution publique

1. `/admin/submissions` → examiner les contributions `received`
2. Accepter / Rejeter / Créer fiche depuis la contribution
3. Si création : compléter la fiche et ajouter une source

### 3. Résoudre un doublon

1. `/admin/duplicates` → examiner les paires suspectes
2. Comparer côte à côte → Fusionner (garder A ou B) ou Ignorer

### 4. File de revalidation

1. `/admin/rechecks` → fiches dont `next_review_at` est dépassé
2. Vérifier la politique chien (appel, site web)
3. Mettre à jour + republier → score recalculé

---

## Politique chien

| Statut | Signification |
|---|---|
| `allowed` | Chiens acceptés explicitement |
| `conditional` | Acceptés avec conditions |
| `disallowed` | Interdits explicitement |
| `unknown` | Non renseigné — ne pas deviner |

---

## Scoring de confiance

Score interne 0-100, exposé publiquement en 3 niveaux :

| Niveau | Score |
|---|---|
| Fiable (high) | 75-100 |
| Indicatif (medium) | 45-74 |
| A confirmer (low) | 0-44 |

Signaux positifs : source officielle (+35), confirmation humaine (+25), terrain (+20)
Signaux négatifs : contradiction (-30), données déclaratives (-25), ancienneté (-20)
Un multiplicateur de fraîcheur s'applique selon la date de vérification.

---

## Déploiement

### Variables de production requises

```env
DATABASE_URL=postgresql://...
DATABASE_SSL=true
NEXT_PUBLIC_BASE_URL=https://dogfriendly974.re
NODE_ENV=production
```

### Vercel (recommandé)

1. Connecter le repo GitHub à Vercel
2. Ajouter les variables d'environnement
3. Configurer une base PostgreSQL + PostGIS (Supabase, Neon, ou Render)
4. Déployer

### Cron jobs recommandés

```
# Revalidation quotidienne
0 3 * * *  DATABASE_URL=... npx tsx jobs/revalidation-check.ts

# Détection de doublons hebdomadaire
0 2 * * 1  DATABASE_URL=... npx tsx jobs/detect-duplicates.ts
```

---

## Règles éditoriales non-négociables

- Jamais inventer ou déduire une politique chien
- Toujours sourcer, toujours dater
- L'incertitude doit être visible (statut `unknown`)
- Toute source externe sert à découvrir/enrichir, jamais à publier seule
- Une fiche n'est publique qu'après validation humaine

---

*Annuaire éditorial augmenté par la data - La Réunion - 2024*

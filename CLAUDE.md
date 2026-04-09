# Annuaire Dog Friendly 974

## Mission
Construire un annuaire web mobile-first des lieux, établissements, espaces et services dog-friendly à La Réunion.

## Principe fondateur
On construit un annuaire éditorial augmenté par la data, pas un robot qui devine.

## Non-négociables
- Aucune donnée externe n'est publiée automatiquement.
- Toute fiche publique doit afficher :
  - un statut chiens
  - des conditions éventuelles
  - une source principale
  - une date de vérification
  - un niveau de confiance
- Si une source n'est pas explicite, le statut = `unknown`.
- L'admin est un outil métier prioritaire.
- La qualité éditoriale prime sur le volume brut.
- L'incertitude doit être visible, pas masquée.

## Périmètre MVP
- site web responsive
- moteur de recherche
- filtres
- carte interactive
- fiches lieux
- formulaire d'ajout
- formulaire de correction
- back-office admin
- import semi-automatique
- détection de doublons
- file de revalidation

## Hors périmètre MVP
- app mobile native
- réseau social
- marketplace
- réservation
- gamification
- publication communautaire directe
- agent IA qui publie seul

## Stack imposée
- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- PostGIS
- MapLibre
- Playwright

## Ordre de priorité
1. modèle de données
2. parcours public
3. back-office admin
4. pipeline d'import et d'enrichissement
5. scoring et rechecks
6. SEO et qualité

## Règles d'architecture
- monolithe modulaire
- séparation claire public/admin/api/jobs
- schémas de validation stricts
- audit trail sur les changements critiques
- composants réutilisables
- conventions nommées simplement
- éviter toute suringénierie

## Règles produit
- une fiche n'est publique qu'après validation humaine
- les données externes servent à découvrir, préremplir, scorer et prioriser
- la vue publique doit rester sobre, lisible et locale
- le back-office doit être rapide, dense et administrable par une petite équipe

## Règles éditoriales
- jamais inventer
- toujours sourcer
- toujours dater
- afficher l'incertitude si elle existe
- préférer utile et clair à marketing et flou
- ne pas surcharger les fiches avec des champs gadgets

## Règles data
- `allowed`, `conditional`, `disallowed`, `unknown` sont les seules valeurs de politique chien
- toute contradiction de sources doit remonter en review
- toute source doit être conservée, datée et typée
- toute fusion de doublons doit préserver l'historique

## Définition du done
- feature testée
- responsive
- cas d'erreur gérés
- cohérence public/admin
- logs utiles pour ingestion/modération
- documentation mise à jour si structure affectée

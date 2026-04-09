# Source Policy — Annuaire Dog Friendly 974

## Purpose
Définir ce que le projet fait avec les sources externes, et ce qu'il refuse de faire.

## Core rule
Une source externe peut suggérer, enrichir, contredire ou prioriser.
Elle ne publie jamais seule.

## Accepted source classes
- saisie éditoriale manuelle
- formulaire public
- site officiel d'un établissement
- Google Places
- OpenStreetMap
- page publique d'information quand elle est exploitable légalement et éditorialement
- appel téléphonique ou vérification terrain
- partenaire validé

## Source hierarchy
Ordre de crédibilité indicative :
1. règlement ou site officiel explicite
2. confirmation directe récente
3. vérification terrain récente
4. source structurée crédible
5. contribution publique avec preuve
6. source sociale ou annuaire tiers

## Mandatory source fields
Toute source doit idéalement conserver :
- type
- URL ou origine
- date de collecte
- extrait utile
- claim de politique chien
- claim de conditions
- éventuel drapeau conflit

## Rules for public publishing
- jamais de publication automatique
- jamais d'inférence à partir de photos ou de marketing
- si la source n'est pas explicite, statut = `unknown`
- en cas de conflit fort, review obligatoire
- conserver le texte source utile, même synthétisé

## Google Places usage
- utiliser pour découverte, enrichissement et priorisation
- ne pas traiter `allowsDogs` comme vérité absolue
- stocker la date et le payload utile
- limiter la consommation API aux champs nécessaires

## OSM usage
- utiliser pour découverte et cartographie
- exploiter les tags dédiés aux animaux/chiens
- rester prudent sur l'hétérogénéité de couverture
- review humaine avant publication

## Facebook / social sources
- jamais comme fondation unique
- uniquement comme source complémentaire
- ne pas scraper de manière agressive ou détournée
- privilégier les sites officiels quand ils existent

## Contribution publique
- utile pour découvrir et corriger
- jamais publiée brute
- doit rester modérée

## Conflict resolution
Quand deux sources se contredisent :
- préférer la source la plus récente et la plus officielle
- sinon laisser `unknown`
- journaliser la décision
- programmer un recheck rapproché

## Legal and editorial posture
- respecter les règles d'accès des sites
- respecter les limites d'usage
- rester transparent sur le niveau de certitude
- afficher une date de vérification

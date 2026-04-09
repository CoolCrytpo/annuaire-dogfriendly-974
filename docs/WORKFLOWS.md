# Workflows — Annuaire Dog Friendly 974

## 1. Création manuelle d'une fiche
1. admin crée un brouillon
2. remplit les champs essentiels
3. rattache au moins une source
4. attribue un statut chien
5. fixe une date de vérification
6. publie

## 2. Proposition publique d'un nouveau lieu
1. utilisateur soumet le formulaire
2. entrée créée dans `submissions`
3. triage admin
4. recherche de doublon
5. création de brouillon ou fusion
6. vérification
7. publication ou rejet argumenté

## 3. Correction publique d'une fiche existante
1. utilisateur soumet une correction
2. correction reliée à la fiche existante
3. admin compare avec les sources
4. met à jour la fiche si nécessaire
5. journalise la modification
6. ferme la contribution

## 4. Import Google Places
1. lancer une requête ciblée par zone/catégorie
2. stocker les résultats bruts
3. normaliser
4. rechercher doublons
5. extraire indices utiles
6. créer candidats ou attacher à des fiches existantes
7. envoyer en review

## 5. Import OSM
1. récupérer des objets pertinents
2. mapper les tags utiles
3. normaliser
4. rechercher doublons
5. proposer un statut candidat
6. envoyer en review

## 6. Gestion d'un conflit de sources
1. une contradiction est détectée
2. fiche passe en `conflict` ou `needs_recheck`
3. l'admin compare les sources
4. choisit la donnée la plus crédible ou laisse `unknown`
5. journalise l'arbitrage
6. programme la prochaine vérification

## 7. Revalidation périodique
1. job quotidien liste les fiches proches de `next_review_at`
2. file admin "à revérifier"
3. recontact / revue source / contrôle manuel
4. mise à jour des champs
5. nouveau `last_verified_at`
6. nouveau `next_review_at`

## 8. Fusion de doublons
1. système propose une paire
2. admin compare les deux fiches
3. choisit la fiche canonique
4. fusionne les sources et médias
5. redirige ou archive la doublonne
6. trace la fusion dans l'audit log

## 9. Publication d'une fiche
Conditions minimales :
- nom
- catégorie
- localisation
- `dog_policy`
- source principale
- date de vérification
- niveau de confiance

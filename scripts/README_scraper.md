# Zanimo Scraper — Guide d'utilisation

## Prérequis
```bash
pip install requests beautifulsoup4 lxml
```

## Usage

```bash
# Toutes les sources
python zanimo_scraper.py --source all --out zanimo_import.csv

# reunion.fr uniquement (recommandé en premier, ~1000 fiches via API)
python zanimo_scraper.py --source reunion --out reunion.csv

# Plusieurs sources
python zanimo_scraper.py --source reunion,musees,ouest --out batch1.csv

# Avec enrichissement Google Places (adresses manquantes)
python zanimo_scraper.py --source all --enrich-google --out complet.csv

# Limiter l'enrichissement Google (quota)
python zanimo_scraper.py --source all --enrich-google --enrich-limit 200 --out complet.csv
```

## Sources supportées

| Source | Méthode | Qualité | Fiches estimées |
|--------|---------|---------|-----------------|
| `reunion` | API Tourinsoft (directe) | ⭐⭐⭐⭐ | ~1000+ |
| `musees` | WordPress REST API | ⭐⭐⭐⭐ | ~10 |
| `ouest` | HTML scraping | ⭐⭐⭐ | ~200 |
| `lebeaupays` | HTML scraping | ⭐⭐ | ~100 |
| `sudreuniontourisme` | HTML scraping | ⭐⭐ | ~150 |
| `reunionest` | HTML scraping | ⭐⭐ | ~100 |

## Cas non couverts (légalement)

| Source | Raison | Alternative |
|--------|--------|-------------|
| TripAdvisor | CGU anti-scraping | Content API sur demande |
| Airbnb | CGU + anti-bot | Import manuel XLS |
| Booking.com | CGU | Affiliate API |
| randopitons.re | Certificat TLS invalide | Import manuel |

## Import dans Zanimo

**Option A — CSV (recommandé) :**
Admin > Import > "Importer un CSV" > sélectionner le fichier généré

**Option B — API directe :**
```bash
curl -X POST https://zanimo.re/api/admin/import/batch \
  -H "Content-Type: application/json" \
  -d @zanimo_import.json
```

**Option C — XLS :**
Ouvrir le CSV dans Excel → Enregistrer sous .xlsx → Admin > Import > XLSX

## Format de sortie

Le CSV suit exactement `CSV_COLUMNS` défini dans `lib/ingestion/types.ts`.
Chaque fiche arrive en staging avec :
- `status: to_review` (validation humaine requise)
- `dog_policy: unknown` (à compléter manuellement ou via vérification)
- `confidence_score: 15-30` selon la source

## Notes

- La déduplication locale est activée par défaut (basée sur nom+commune)
- Les fiches en doublon avec la DB sont détectées à l'import staging
- Les credentials Tourinsoft viennent de la page publique reunion.fr (JS non protégé)
- Le Google Maps API key visible dans reunion.fr est une clé publique restreinte au domaine reunion.fr

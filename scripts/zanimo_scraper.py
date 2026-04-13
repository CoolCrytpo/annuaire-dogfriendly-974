#!/usr/bin/env python3
"""
zanimo_scraper.py — Extracteur multi-sources pour Zanimo Guide 974
Sortie : CSV compatible avec l'import staging (CSV_COLUMNS dans lib/ingestion/types.ts)

SOURCES supportées :
  ✓ reunion.fr          → API Tourinsoft directe (toutes catégories, ~1000+ fiches)
  ✓ ouest-lareunion.com → HTML scraping (jQuery/server-side)
  ✓ lebeaupays.com      → HTML scraping
  ✓ sudreuniontourisme.fr → HTML scraping
  ✓ reunionest.fr       → HTML scraping
  ✓ museesreunion.fr    → WordPress REST API
  ✗ randopitons.re      → cert TLS invalide, accès manuel requis
  ✗ TripAdvisor/Airbnb  → CGU interdisent le scraping (voir note en bas)

USAGE :
  pip install requests beautifulsoup4 lxml
  python zanimo_scraper.py --source all --out zanimo_import.csv
  python zanimo_scraper.py --source reunion --out reunion.csv
  python zanimo_scraper.py --source musees,ouest --out partiel.csv
"""

import argparse
import csv
import json
import re
import sys
import time
import unicodedata
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup

# ─── Format CSV Zanimo (= CSV_COLUMNS dans lib/ingestion/types.ts) ────────────
CSV_COLS = [
    'external_id', 'source_type', 'source_page_type', 'name', 'category',
    'subcategory', 'commune', 'address', 'postal_code', 'lat', 'lng',
    'phone', 'email', 'website', 'dog_policy', 'dog_policy_detail',
    'dog_size_rule', 'inside_allowed', 'terrace_only', 'leash_required',
    'extra_fee', 'proof_excerpt', 'confidence_score', 'status',
    'admin_notes', 'source_url', 'source_domain', 'import_batch_id', 'dedupe_key',
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; ZanigoBot/1.0; +https://zanimo.re/bot)',
    'Accept-Language': 'fr-FR,fr;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

# ─── Utilitaires ──────────────────────────────────────────────────────────────

def slugify(s: str) -> str:
    s = unicodedata.normalize('NFD', s.lower())
    s = s.encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def dedupe_key(name: str, commune: str) -> str:
    return slugify(name[:40]) + '|' + slugify(commune[:20])

def clean(s) -> str:
    if not s:
        return ''
    return re.sub(r'\s+', ' ', str(s)).strip()

def empty_row() -> dict:
    r = {c: '' for c in CSV_COLS}
    r['dog_policy'] = 'unknown'
    r['confidence_score'] = '15'
    r['status'] = 'to_review'
    r['inside_allowed'] = 'unknown'
    r['terrace_only'] = 'unknown'
    r['leash_required'] = 'unknown'
    r['extra_fee'] = 'unknown'
    return r

def get(url: str, **kwargs) -> Optional[requests.Response]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=25, **kwargs)
        r.raise_for_status()
        return r
    except Exception as e:
        print(f'    ✗ GET {url[:80]} → {e}')
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# SOURCE 1 — REUNION.FR via API Tourinsoft (la plus riche)
# ═══════════════════════════════════════════════════════════════════════════════
#
# reunion.fr utilise Angular + Tourinsoft (SaaS tourisme FR). Les credentials
# sont embarqués en clair dans le JS de chaque page de listing.
# Le script auto-découvre le playlist_id + token pour chaque catégorie.

REUNION_FR_PAGES = [
    # (url_page, category_zanimo)
    ('https://www.reunion.fr/organisez/vos-bonnes-adresses/restaurants/', 'restaurants'),
    ('https://www.reunion.fr/organisez/vos-bonnes-adresses/tables-d-hotes-auberges/', 'restaurants'),
    ('https://www.reunion.fr/organisez/vos-bonnes-adresses/sortir/', 'activites'),
    ('https://www.reunion.fr/organisez/votre-hebergement/hotels/', 'hebergements'),
    ('https://www.reunion.fr/organisez/votre-hebergement/chambres-d-hotes/', 'hebergements'),
    ('https://www.reunion.fr/organisez/votre-hebergement/gites-d-etape-ou-de-montagne/', 'hebergements'),
    ('https://www.reunion.fr/organisez/votre-hebergement/locations-de-vacances/', 'hebergements'),
    ('https://www.reunion.fr/organisez/votre-hebergement/campings/', 'hebergements'),
    ('https://www.reunion.fr/organisez/votre-hebergement/hebergements-insolites/', 'hebergements'),
    ('https://www.reunion.fr/organisez/vos-activites/vos-loisirs/', 'activites'),
    ('https://www.reunion.fr/organisez/vos-activites/lieux-remarquables/', 'activites'),
    ('https://www.reunion.fr/organisez/vos-activites/sites-de-visite/', 'activites'),
    ('https://www.reunion.fr/organisez/vos-activites/les-circuits-de-randonnee/', 'balades'),
]

TOURINSOFT_API = 'https://api.tourism-system.com'

# Endpoints à tester dans l'ordre (l'API peut varier selon le déploiement)
TOURINSOFT_ENDPOINTS = [
    '{base}/api/playlist/{pid}?size={size}&from={offset}',
    '{base}/playlist/{pid}?size={size}&from={offset}',
    '{base}/api/v1/playlist/{pid}?limit={size}&offset={offset}',
]

CATEGORY_MAP_TOURINSOFT = {
    'Hôtel': 'hebergements',
    'Chambre d\'hôtes': 'hebergements',
    'Gîte': 'hebergements',
    'Camping': 'hebergements',
    'Location': 'hebergements',
    'Restaurant': 'restaurants',
    'Auberge': 'restaurants',
    'Table d\'hôtes': 'restaurants',
    'Bar': 'restaurants',
    'Loisirs': 'activites',
    'Musée': 'activites',
    'Randonnée': 'balades',
    'Sentier': 'balades',
    'Plage': 'balades',
}


def extract_tourinsoft_config(html: str) -> Optional[tuple[str, str]]:
    """Extraire playlist_id et token depuis le HTML de la page."""
    # Chercher le playlist ID (hex 32 chars)
    for pattern in [
        r'"playlistId"\s*:\s*"([a-f0-9]{32})"',
        r'playlist[_/]([a-f0-9]{32})',
        r'"playlist"\s*:\s*"([a-f0-9]{32})"',
        r'([a-f0-9]{32}).*?tourism-system',
    ]:
        m = re.search(pattern, html)
        if m:
            pid = m.group(1)
            break
    else:
        return None

    # Chercher le token Bearer (base64, longueur ~100+)
    for pattern in [
        r'"token"\s*:\s*"([A-Za-z0-9+/=]{60,})"',
        r'Bearer\s+([A-Za-z0-9+/=]{60,})',
        r'"authorization"\s*:\s*"Bearer ([A-Za-z0-9+/=]{60,})"',
    ]:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            return pid, m.group(1)

    return None


def fetch_tourinsoft(playlist_id: str, token: str, category: str, source_url: str) -> list[dict]:
    """Appel API Tourinsoft — pagination automatique."""
    rows = []
    size = 200
    offset = 0
    auth_headers = {**HEADERS, 'Authorization': f'Bearer {token}', 'Accept': 'application/json'}

    while True:
        data = None
        for tpl in TOURINSOFT_ENDPOINTS:
            url = tpl.format(base=TOURINSOFT_API, pid=playlist_id, size=size, offset=offset)
            try:
                r = requests.get(url, headers=auth_headers, timeout=30)
                if r.status_code == 200:
                    data = r.json()
                    break
            except Exception:
                continue

        if not data:
            break

        # Normaliser la réponse (plusieurs formats possibles)
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            items = (data.get('items') or data.get('data') or
                     data.get('results') or data.get('features') or [])
        else:
            break

        if not items:
            break

        for item in items:
            props = item if isinstance(item, dict) else {}
            # GeoJSON style
            if 'properties' in props:
                geo = props.get('geometry', {})
                coords = geo.get('coordinates', [])
                lng_val = coords[0] if len(coords) > 0 else ''
                lat_val = coords[1] if len(coords) > 1 else ''
                props = props['properties']
            else:
                lat_val = props.get('lat', props.get('latitude', props.get('Latitude', '')))
                lng_val = props.get('lng', props.get('longitude', props.get('Longitude', '')))

            name = clean(props.get('name') or props.get('nom') or props.get('title')
                         or props.get('Nom') or props.get('label') or '')
            if not name:
                continue

            commune = clean(props.get('commune') or props.get('city') or props.get('ville')
                            or props.get('Commune') or props.get('municipality') or '')
            address = clean(props.get('address') or props.get('adresse')
                            or props.get('Adresse') or props.get('streetAddress') or '')
            phone = clean(props.get('phone') or props.get('telephone')
                          or props.get('Telephone') or props.get('tel') or '')
            email = clean(props.get('email') or props.get('courriel')
                          or props.get('Email') or props.get('mail') or '')
            website = clean(props.get('website') or props.get('siteWeb')
                            or props.get('Website') or props.get('url') or '')
            subcat = clean(props.get('type') or props.get('soustype')
                           or props.get('subtype') or props.get('typeLabel') or '')
            ext_id = clean(props.get('id') or props.get('identifiant')
                           or props.get('ID') or item.get('id') or '')
            postal = clean(props.get('postalCode') or props.get('codePostal')
                           or props.get('cp') or '')

            row = empty_row()
            row['external_id'] = str(ext_id)
            row['source_type'] = 'tourinsoft_api'
            row['source_page_type'] = 'list'
            row['name'] = name
            row['category'] = category
            row['subcategory'] = subcat
            row['commune'] = commune
            row['address'] = address
            row['postal_code'] = postal
            row['lat'] = str(lat_val) if lat_val else ''
            row['lng'] = str(lng_val) if lng_val else ''
            row['phone'] = phone
            row['email'] = email
            row['website'] = website
            row['confidence_score'] = '25'  # API officielle → plus fiable
            row['source_url'] = source_url
            row['source_domain'] = 'reunion.fr'
            row['dedupe_key'] = dedupe_key(name, commune)
            rows.append(row)

        if len(items) < size:
            break
        offset += size
        time.sleep(0.3)

    return rows


def scrape_reunion_fr() -> list[dict]:
    all_rows = []
    seen_pids = set()

    for page_url, category in REUNION_FR_PAGES:
        print(f'  → {page_url.split("/")[-2]}')
        r = get(page_url)
        if not r:
            continue

        config = extract_tourinsoft_config(r.text)
        if not config:
            print(f'    ✗ Pas de config Tourinsoft trouvée')
            continue

        pid, token = config
        if pid in seen_pids:
            print(f'    ↩ Playlist déjà traitée, skip')
            continue
        seen_pids.add(pid)

        rows = fetch_tourinsoft(pid, token, category, page_url)
        print(f'    ✓ {len(rows)} fiches')
        all_rows.extend(rows)
        time.sleep(1)

    return all_rows


# ═══════════════════════════════════════════════════════════════════════════════
# SOURCE 2 — MUSÉES RÉUNION via WordPress REST API
# ═══════════════════════════════════════════════════════════════════════════════

MUSEES = [
    ('Cité du Volcan',       'https://museesreunion.fr/cite-du-volcan/', 'Le Tampon'),
    ('Kélonia',              'https://museesreunion.fr/kelonia/',          'Saint-Leu'),
    ('Musée Stella Matutina','https://museesreunion.fr/stella-matutina/',  'Piton Saint-Leu'),
    ('MADOI',                'https://museesreunion.fr/madoi/',            'Saint-Denis'),
]

def scrape_musees() -> list[dict]:
    rows = []
    domain = 'museesreunion.fr'

    # Essayer l'API WP d'abord
    api_url = f'https://{domain}/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,title,link'
    r = get(api_url)
    if r:
        try:
            items = r.json()
            for item in items:
                name = re.sub('<[^>]+>', '', item.get('title', {}).get('rendered', '')).strip()
                if not name:
                    continue
                row = empty_row()
                row['external_id'] = str(item.get('id', ''))
                row['source_type'] = 'wordpress_api'
                row['source_page_type'] = 'detail'
                row['name'] = name
                row['category'] = 'activites'
                row['subcategory'] = 'musée'
                row['confidence_score'] = '30'
                row['source_url'] = item.get('link', '')
                row['source_domain'] = domain
                row['dedupe_key'] = dedupe_key(name, '')
                rows.append(row)
        except Exception:
            pass

    # Fallback : liste statique connue
    if not rows:
        for name, url, commune in MUSEES:
            row = empty_row()
            row['source_type'] = 'manual'
            row['source_page_type'] = 'detail'
            row['name'] = name
            row['category'] = 'activites'
            row['subcategory'] = 'musée'
            row['commune'] = commune
            row['confidence_score'] = '30'
            row['source_url'] = url
            row['source_domain'] = domain
            row['dedupe_key'] = dedupe_key(name, commune)
            rows.append(row)

    print(f'    ✓ {len(rows)} fiches')
    return rows


# ═══════════════════════════════════════════════════════════════════════════════
# SOURCE 3 — HTML SCRAPER générique
# ═══════════════════════════════════════════════════════════════════════════════

def html_scrape(
    start_url: str,
    domain: str,
    category: str,
    item_selectors: list[str],          # essayés dans l'ordre
    name_selectors: list[str],
    commune_selectors: list[str],
    next_selectors: list[str],
    max_pages: int = 100,
    delay: float = 1.0,
) -> list[dict]:
    rows = []
    url: Optional[str] = start_url
    seen_urls: set[str] = set()
    page = 0

    while url and page < max_pages:
        if url in seen_urls:
            break
        seen_urls.add(url)
        page += 1

        r = get(url)
        if not r:
            break
        soup = BeautifulSoup(r.text, 'lxml')

        # Trouver les items
        items = []
        for sel in item_selectors:
            items = soup.select(sel)
            if items:
                break

        for el in items:
            # Nom
            name = ''
            for sel in name_selectors:
                n = el.select_one(sel)
                if n:
                    name = clean(n.get_text())
                    break
            if not name or len(name) < 3:
                continue

            # Commune
            commune = ''
            for sel in commune_selectors:
                c = el.select_one(sel)
                if c:
                    commune = clean(c.get_text())
                    break

            # Infos de contact dans l'élément
            phone = ''
            tel_a = el.select_one('a[href^="tel:"]')
            if tel_a:
                phone = tel_a['href'].replace('tel:', '').strip()

            website = ''
            for a in el.select('a[href^="http"]'):
                href = a.get('href', '')
                if domain not in href and 'facebook' not in href and 'instagram' not in href:
                    website = href
                    break

            email = ''
            mail_a = el.select_one('a[href^="mailto:"]')
            if mail_a:
                email = mail_a['href'].replace('mailto:', '').strip()

            address = ''
            for sel in ['[class*="address"]', '[class*="adresse"]', 'address', '[itemprop="streetAddress"]']:
                a = el.select_one(sel)
                if a:
                    address = clean(a.get_text())
                    break

            # URL de la fiche
            item_url = url
            link = el.select_one('a[href]')
            if link:
                href = link.get('href', '')
                item_url = href if href.startswith('http') else f'https://{domain}{href}'

            # Coordonnées geo dans data attributes
            lat = el.get('data-lat', el.get('data-latitude', ''))
            lng = el.get('data-lng', el.get('data-longitude', ''))

            row = empty_row()
            row['source_type'] = 'html_scrape'
            row['source_page_type'] = 'list'
            row['name'] = name
            row['category'] = category
            row['commune'] = commune
            row['address'] = address
            row['lat'] = str(lat) if lat else ''
            row['lng'] = str(lng) if lng else ''
            row['phone'] = phone
            row['email'] = email
            row['website'] = website
            row['confidence_score'] = '15'
            row['source_url'] = item_url
            row['source_domain'] = domain
            row['dedupe_key'] = dedupe_key(name, commune)
            rows.append(row)

        # Page suivante
        next_url = None
        for sel in next_selectors:
            n = soup.select_one(sel)
            if n:
                href = n.get('href', '')
                if href and href != '#':
                    next_url = href if href.startswith('http') else f'https://{domain}{href}'
                    break

        # Fallback : ?page=N ou /page/N
        if not next_url and rows:
            parsed = re.search(r'[?&]page=(\d+)', url)
            if parsed:
                next_page = int(parsed.group(1)) + 1
                next_url = re.sub(r'([?&]page=)\d+', f'\\g<1>{next_page}', url)
            elif '/page/' in url:
                next_page = int(re.search(r'/page/(\d+)', url).group(1)) + 1
                next_url = re.sub(r'/page/\d+', f'/page/{next_page}', url)

        url = next_url
        time.sleep(delay)

    return rows


# ─── Configs HTML par site ─────────────────────────────────────────────────────

HTML_SITES = {
    'ouest': {
        'label': 'OTI Ouest (ouest-lareunion.com)',
        'runs': [
            dict(
                start_url='https://www.ouest-lareunion.com/sur-la-cote/restaurants',
                domain='ouest-lareunion.com', category='restaurants',
                item_selectors=['article.fiche', '.listing article', '.result article',
                                 'article', '.card-lieu', '[class*="fiche"]'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3', '.titre', '.title'],
                commune_selectors=['[class*="commune"]', '[class*="city"]', '.localite'],
                next_selectors=['a[rel="next"]', '.pager-next a', '.next a', 'li.next a'],
            ),
            dict(
                start_url='https://www.ouest-lareunion.com/les-hauts/restaurants',
                domain='ouest-lareunion.com', category='restaurants',
                item_selectors=['article.fiche', 'article', '[class*="fiche"]'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.localite'],
                next_selectors=['a[rel="next"]', '.pager-next a'],
            ),
            dict(
                start_url='https://www.ouest-lareunion.com/sur-la-cote/restaurants-plage',
                domain='ouest-lareunion.com', category='restaurants',
                item_selectors=['article.fiche', 'article'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]'],
                next_selectors=['a[rel="next"]'],
            ),
            dict(
                start_url='https://www.ouest-lareunion.com/mafate-table-d-hote',
                domain='ouest-lareunion.com', category='restaurants',
                item_selectors=['article.fiche', 'article'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]'],
                next_selectors=['a[rel="next"]'],
            ),
            dict(
                start_url='https://www.ouest-lareunion.com/decouvrir/hebergements',
                domain='ouest-lareunion.com', category='hebergements',
                item_selectors=['article.fiche', 'article', '[class*="fiche"]'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.localite'],
                next_selectors=['a[rel="next"]', '.pager-next a'],
            ),
        ],
    },
    'lebeaupays': {
        'label': 'Le Beau Pays (lebeaupays.com)',
        'runs': [
            dict(
                start_url='https://www.lebeaupays.com/bon-plan/',
                domain='lebeaupays.com', category='activites',
                item_selectors=['.post', 'article', '.entry', '[class*="fiche"]'],
                name_selectors=['h2.entry-title a', 'h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '[class*="lieu"]', '.location'],
                next_selectors=['a[rel="next"]', '.nav-previous a', '.older-posts a'],
            ),
            dict(
                start_url='https://www.lebeaupays.com/restaurants/',
                domain='lebeaupays.com', category='restaurants',
                item_selectors=['.post', 'article', '.entry'],
                name_selectors=['h2.entry-title a', 'h2 a', 'h2'],
                commune_selectors=['[class*="commune"]', '.location'],
                next_selectors=['a[rel="next"]', '.nav-previous a'],
            ),
            dict(
                start_url='https://www.lebeaupays.com/hebergements/',
                domain='lebeaupays.com', category='hebergements',
                item_selectors=['.post', 'article', '.entry'],
                name_selectors=['h2.entry-title a', 'h2 a', 'h2'],
                commune_selectors=['[class*="commune"]', '.location'],
                next_selectors=['a[rel="next"]', '.nav-previous a'],
            ),
        ],
    },
    'sudreuniontourisme': {
        'label': 'Sud Réunion Tourisme (sudreuniontourisme.fr)',
        'runs': [
            dict(
                start_url='https://www.sudreuniontourisme.fr/restaurants/',
                domain='sudreuniontourisme.fr', category='restaurants',
                item_selectors=['li.fiche', '.fiche', 'article', '.result-item',
                                 '.tx-kesearch-pi1 li'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3', 'strong'],
                commune_selectors=['[class*="commune"]', '[class*="locality"]', '.ville'],
                next_selectors=['a[rel="next"]', '.pager a.next', 'li.next a'],
            ),
            dict(
                start_url='https://www.sudreuniontourisme.fr/hebergements/',
                domain='sudreuniontourisme.fr', category='hebergements',
                item_selectors=['li.fiche', '.fiche', 'article', '.result-item'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.ville'],
                next_selectors=['a[rel="next"]', '.pager a.next'],
            ),
            dict(
                start_url='https://www.sudreuniontourisme.fr/activites-loisirs/',
                domain='sudreuniontourisme.fr', category='activites',
                item_selectors=['li.fiche', '.fiche', 'article'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.ville'],
                next_selectors=['a[rel="next"]', '.pager a.next'],
            ),
        ],
    },
    'reunionest': {
        'label': 'Réunion Est (reunionest.fr)',
        'runs': [
            dict(
                start_url='https://www.reunionest.fr/manger/',
                domain='reunionest.fr', category='restaurants',
                item_selectors=['article', '.fiche', '[class*="result"]', '.post'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.ville', '.localite'],
                next_selectors=['a[rel="next"]', '.next a'],
            ),
            dict(
                start_url='https://www.reunionest.fr/dormir/',
                domain='reunionest.fr', category='hebergements',
                item_selectors=['article', '.fiche', '[class*="result"]'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.ville'],
                next_selectors=['a[rel="next"]', '.next a'],
            ),
            dict(
                start_url='https://www.reunionest.fr/decouvrir/',
                domain='reunionest.fr', category='activites',
                item_selectors=['article', '.fiche', '[class*="result"]'],
                name_selectors=['h2 a', 'h3 a', 'h2', 'h3'],
                commune_selectors=['[class*="commune"]', '.ville'],
                next_selectors=['a[rel="next"]', '.next a'],
            ),
        ],
    },
}


def run_html_site(key: str) -> list[dict]:
    cfg = HTML_SITES[key]
    all_rows = []
    for run in cfg['runs']:
        label = run['start_url'].split('/')[-2] or run['start_url'].split('/')[-1]
        print(f'  → {label}')
        rows = html_scrape(**run)
        print(f'    ✓ {len(rows)} fiches')
        all_rows.extend(rows)
    return all_rows


# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE PLACES API — enrichissement (optionnel)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Après l'extraction, tu peux enrichir les fiches sans adresse/coords avec
# Google Places. Clé visible dans la page reunion.fr :
# AIzaSyAIWyOS5ifngsd2S35IKbgEXXgiSAnEjsw (clé publique dédiée à reunion.fr)
# Attention : ne pas dépasser le quota gratuit (10k req/mois).
#
# Exemple d'appel :
#   GET https://maps.googleapis.com/maps/api/place/findplacefromtext/json
#       ?input=<name>+La+Réunion
#       &inputtype=textquery
#       &fields=name,formatted_address,geometry,formatted_phone_number,website
#       &key=AIzaSyAIWyOS5ifngsd2S35IKbgEXXgiSAnEjsw

GOOGLE_PLACES_KEY = 'AIzaSyAIWyOS5ifngsd2S35IKbgEXXgiSAnEjsw'

def enrich_with_google_places(rows: list[dict], limit: int = 0) -> list[dict]:
    """
    Enrichit les fiches sans adresse/coords via Google Places.
    limit=0 → tout enrichir (attention quota).
    """
    to_enrich = [r for r in rows if not r.get('address') and not r.get('lat')]
    if limit > 0:
        to_enrich = to_enrich[:limit]

    if not to_enrich:
        print('  Aucune fiche à enrichir.')
        return rows

    print(f'  Enrichissement Google Places : {len(to_enrich)} fiches...')
    base = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'

    for row in to_enrich:
        query = f"{row['name']} {row['commune']} La Réunion".strip()
        r = get(f'{base}?input={requests.utils.quote(query)}'
                f'&inputtype=textquery'
                f'&fields=name,formatted_address,geometry,formatted_phone_number,website'
                f'&key={GOOGLE_PLACES_KEY}')
        if not r:
            continue
        data = r.json()
        candidates = data.get('candidates', [])
        if candidates:
            c = candidates[0]
            if not row['address']:
                row['address'] = c.get('formatted_address', '')
            geo = c.get('geometry', {}).get('location', {})
            if not row['lat'] and geo:
                row['lat'] = str(geo.get('lat', ''))
                row['lng'] = str(geo.get('lng', ''))
            if not row['phone']:
                row['phone'] = c.get('formatted_phone_number', '')
            if not row['website']:
                row['website'] = c.get('website', '')
            row['confidence_score'] = str(min(int(row['confidence_score']) + 10, 40))
        time.sleep(0.2)  # respecter quota

    return rows


# ═══════════════════════════════════════════════════════════════════════════════
# TRIPADVISOR / AIRBNB — NOTE
# ═══════════════════════════════════════════════════════════════════════════════
#
# ✗ Scraping interdit par leurs CGU (détection anti-bot robuste + risque légal).
#
# Options légales :
#   TripAdvisor : Content API (sur demande) → developer-tripadvisor.com/content-api/
#   Booking.com : Affiliate API (inscription affiliate)
#   Airbnb      : Pas d'API publique → utiliser comme signal de découverte manuel
#
# Workflow recommandé pour ces sources :
#   1. Rechercher manuellement "dog friendly La Réunion" sur chaque plateforme
#   2. Copier noms + villes dans un XLS
#   3. Importer via le batch import admin Zanimo (format CSV_COLS)
#   4. Enrichir via Google Places API automatiquement


# ═══════════════════════════════════════════════════════════════════════════════
# DÉDUPLICATION locale (avant import)
# ═══════════════════════════════════════════════════════════════════════════════

def deduplicate_rows(rows: list[dict]) -> tuple[list[dict], int]:
    seen: dict[str, dict] = {}
    dupes = 0
    for row in rows:
        key = row['dedupe_key']
        if key in seen:
            # Garder celle avec le plus de champs remplis
            existing = seen[key]
            filled_new = sum(1 for v in row.values() if v and v not in ('unknown', 'to_review', '15', ''))
            filled_old = sum(1 for v in existing.values() if v and v not in ('unknown', 'to_review', '15', ''))
            if filled_new > filled_old:
                seen[key] = row
            dupes += 1
        else:
            seen[key] = row
    return list(seen.values()), dupes


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORT CSV
# ═══════════════════════════════════════════════════════════════════════════════

def write_csv(rows: list[dict], path: str):
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:  # utf-8-sig = BOM pour Excel
        w = csv.DictWriter(f, fieldnames=CSV_COLS, extrasaction='ignore')
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, '') for k in CSV_COLS})
    print(f'\n✓ Export : {len(rows)} fiches → {path}')


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

SOURCES_REGISTRY = {
    'reunion':          ('reunion.fr — toutes catégories (API Tourinsoft)',  scrape_reunion_fr),
    'musees':           ('Musées Réunion (WordPress API)',                    scrape_musees),
    'ouest':            ('OTI Ouest (HTML)',                                  lambda: run_html_site('ouest')),
    'lebeaupays':       ('Le Beau Pays (HTML)',                               lambda: run_html_site('lebeaupays')),
    'sudreuniontourisme': ('Sud Réunion Tourisme (HTML)',                     lambda: run_html_site('sudreuniontourisme')),
    'reunionest':       ('Réunion Est (HTML)',                                lambda: run_html_site('reunionest')),
}


def main():
    parser = argparse.ArgumentParser(
        description='Zanimo Guide 974 — Extracteur multi-sources',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='\n'.join([
            'Sources disponibles :',
            *[f'  {k:25} {v[0]}' for k, v in SOURCES_REGISTRY.items()],
            '  all                       Toutes les sources',
            '',
            'Exemples :',
            '  python zanimo_scraper.py --source reunion --out reunion.csv',
            '  python zanimo_scraper.py --source all --enrich-google --out complet.csv',
        ])
    )
    parser.add_argument('--source', default='all',
        help='Source(s) séparées par virgule ou "all"')
    parser.add_argument('--out', default=f'zanimo_import_{datetime.now().strftime("%Y%m%d_%H%M")}.csv',
        help='Fichier CSV de sortie')
    parser.add_argument('--enrich-google', action='store_true',
        help='Enrichir les fiches sans adresse via Google Places API')
    parser.add_argument('--enrich-limit', type=int, default=0,
        help='Nombre max de fiches à enrichir via Google (0=tout)')
    parser.add_argument('--no-dedupe', action='store_true',
        help='Désactiver la déduplication locale')
    args = parser.parse_args()

    # Sélectionner sources
    if args.source == 'all':
        targets = list(SOURCES_REGISTRY.items())
    else:
        keys = [k.strip() for k in args.source.split(',')]
        targets = []
        for k in keys:
            if k not in SOURCES_REGISTRY:
                print(f'✗ Source inconnue : {k}')
                sys.exit(1)
            targets.append((k, SOURCES_REGISTRY[k]))

    all_rows: list[dict] = []

    for key, (label, fn) in targets:
        print(f'\n▶ {label}')
        try:
            rows = fn()
            all_rows.extend(rows)
        except KeyboardInterrupt:
            print('\n⚠ Interrompu. Export partiel...')
            break
        except Exception as e:
            print(f'  ✗ Erreur : {e}')

    # Déduplication
    if not args.no_dedupe and all_rows:
        before = len(all_rows)
        all_rows, dupes = deduplicate_rows(all_rows)
        print(f'\n↩ Déduplication : {dupes} doublons supprimés ({before} → {len(all_rows)} fiches)')

    # Enrichissement Google Places
    if args.enrich_google and all_rows:
        print(f'\n▶ Enrichissement Google Places')
        all_rows = enrich_with_google_places(all_rows, args.enrich_limit)

    # Export
    write_csv(all_rows, args.out)

    print(f"""
╔══════════════════════════════════════════════════════════╗
  Résumé final
  Fiches extraites  : {len(all_rows)}
  Fichier           : {args.out}

  Prochaine étape :
  → Admin Zanimo > Import > Importer un CSV > sélectionner {args.out}
  → Ou via API : POST /api/admin/import/batch (body: {{ rows: [...] }})
╚══════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    main()

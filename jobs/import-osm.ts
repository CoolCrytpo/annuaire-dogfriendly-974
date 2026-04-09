/**
 * Job : Import de candidats depuis OpenStreetMap (Overpass API)
 * Stratégie : requête par tags pertinents sur l'île de La Réunion
 * Résultat : candidats en brouillon pour review admin
 *
 * Usage : npx tsx jobs/import-osm.ts [--category restaurant]
 */

import pool from '../lib/db/client'
import { toSlug, toNormalizedName } from '../lib/utils/slug'

const REUNION_BBOX = '-21.39,55.22,-20.86,55.84'  // south,west,north,east

const OSM_QUERIES: Record<string, string> = {
  restaurant: `[out:json][timeout:30];
    (node["amenity"="restaurant"](${REUNION_BBOX});
     way["amenity"="restaurant"](${REUNION_BBOX}););
    out center;`,
  cafe: `[out:json][timeout:30];
    (node["amenity"~"cafe|bar"](${REUNION_BBOX}););
    out center;`,
  hotel: `[out:json][timeout:30];
    (node["tourism"~"hotel|guest_house|hostel"](${REUNION_BBOX});
     way["tourism"~"hotel|guest_house|hostel"](${REUNION_BBOX}););
    out center;`,
}

interface OsmElement {
  id: number
  type: string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

async function importOsm(category: string = 'restaurant') {
  const query = OSM_QUERIES[category]
  if (!query) {
    console.error(`Catégorie inconnue : ${category}. Disponibles : ${Object.keys(OSM_QUERIES).join(', ')}`)
    process.exit(1)
  }

  console.log(`[import-osm] Requête Overpass pour : ${category}`)
  const url = 'https://overpass-api.de/api/interpreter'

  const res = await fetch(url, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status}`)
  }

  const data = await res.json() as { elements: OsmElement[] }
  const elements = data.elements ?? []
  console.log(`[import-osm] ${elements.length} éléments récupérés`)

  // Récupérer la catégorie DB
  const catResult = await pool.query('SELECT id FROM place_categories WHERE slug = $1', [category])
  const catId = catResult.rows[0]?.id as number | null

  let inserted = 0, skipped = 0

  for (const el of elements) {
    const name = el.tags.name
    if (!name || name.length < 2) { skipped++; continue }

    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    const slug = toSlug(`${name}-osm-${el.id}`)
    const normalized = toNormalizedName(name)

    // Vérifier si un lieu similaire existe déjà (par nom normalisé)
    const existing = await pool.query(
      `SELECT id FROM places WHERE normalized_name ILIKE $1 LIMIT 1`,
      [`%${normalized}%`]
    )

    if (existing.rows.length > 0) {
      // Attacher la source OSM à la fiche existante
      const placeId = (existing.rows[0] as { id: string }).id
      await pool.query(
        `INSERT INTO place_sources (place_id, source_type, source_url, source_label, structured_payload_json, claim_dog_policy)
         VALUES ($1, 'osm', $2, $3, $4, 'unknown')
         ON CONFLICT DO NOTHING`,
        [
          placeId,
          `https://www.openstreetmap.org/${el.type}/${el.id}`,
          `OSM ${el.type} ${el.id}`,
          JSON.stringify(el.tags),
        ]
      )
      skipped++
      continue
    }

    // Créer un candidat brouillon
    try {
      const placeResult = await pool.query(
        `INSERT INTO places (
           slug, name, normalized_name, category_id,
           dog_policy, verification_status,
           lat, lng, website_url, phone,
           geom
         ) VALUES ($1,$2,$3,$4,'unknown','draft',$5,$6,$7,$8,
           CASE WHEN $5 IS NOT NULL AND $6 IS NOT NULL
                THEN ST_SetSRID(ST_MakePoint($6,$5),4326)
                ELSE NULL END)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
          slug, name, normalized, catId,
          lat ?? null, lng ?? null,
          el.tags.website ?? el.tags['contact:website'] ?? null,
          el.tags.phone ?? el.tags['contact:phone'] ?? null,
        ]
      )

      if (placeResult.rows.length > 0) {
        const placeId = (placeResult.rows[0] as { id: string }).id
        await pool.query(
          `INSERT INTO place_sources (place_id, source_type, source_url, source_label, structured_payload_json, claim_dog_policy)
           VALUES ($1, 'osm', $2, $3, $4, 'unknown')`,
          [
            placeId,
            `https://www.openstreetmap.org/${el.type}/${el.id}`,
            `OSM ${el.type} ${el.id}`,
            JSON.stringify(el.tags),
          ]
        )
        inserted++
      }
    } catch (err) {
      console.error(`[import-osm] Erreur pour ${name}:`, err)
    }
  }

  console.log(`[import-osm] Terminé — ${inserted} candidat(s) créé(s), ${skipped} ignoré(s)`)
  await pool.end()
}

const category = process.argv.find((a, i) => process.argv[i - 1] === '--category') ?? 'restaurant'
importOsm(category).catch((err) => {
  console.error('[import-osm] Erreur fatale :', err)
  process.exit(1)
})

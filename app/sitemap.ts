import type { MetadataRoute } from 'next'
import pool from '@/lib/db/client'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dogfriendly974.re'

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/lieux`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE}/spots`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE}/balades`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/carte`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/proposer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE}/methodologie`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let placeEntries: MetadataRoute.Sitemap = []

  try {
    const result = await pool.query<{ slug: string; updated_at: string }, []>(
      `SELECT slug, updated_at FROM places WHERE verification_status = 'published' ORDER BY updated_at DESC LIMIT 5000`
    )
    placeEntries = result.rows.map((row) => ({
      url: `${BASE}/lieux/${row.slug}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB not configured yet — return only static pages
  }

  return [...STATIC_PAGES, ...placeEntries]
}

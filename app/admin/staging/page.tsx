import pool from '@/lib/db/client'
import Link from 'next/link'
import { StagingTable } from '@/components/admin/StagingTable'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous statuts' },
  { value: 'raw_import', label: 'Import brut' },
  { value: 'to_review', label: 'À revoir' },
  { value: 'accepted', label: 'Acceptés' },
  { value: 'rejected', label: 'Rejetés' },
  { value: 'duplicate', label: 'Doublons' },
]

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>
}

interface StagingItem {
  id: string
  name: string
  category: string | null
  commune: string | null
  dog_policy: string
  confidence_score: number
  status: string
  source_domain: string | null
  source_url: string | null
  admin_notes: string | null
  dedupe_key: string | null
}

async function getStagingData(params: { q?: string; status?: string; category?: string; page: number }) {
  const conditions: string[] = []
  const values: unknown[] = []

  if (params.q) {
    values.push(`%${params.q}%`)
    conditions.push(`(name ILIKE $${values.length} OR commune ILIKE $${values.length})`)
  }
  if (params.status) {
    values.push(params.status)
    conditions.push(`status = $${values.length}`)
  }
  if (params.category) {
    values.push(params.category)
    conditions.push(`category = $${values.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const per_page = 50
  const offset = (params.page - 1) * per_page

  const countRes = await pool.query(`SELECT COUNT(*) FROM staging_listings ${where}`, values)
  const total = parseInt(countRes.rows[0].count)

  const dataRes = await pool.query(
    `SELECT id, name, category, commune, dog_policy, confidence_score, status, source_domain, source_url, admin_notes, dedupe_key
     FROM staging_listings ${where}
     ORDER BY created_at DESC
     LIMIT ${per_page} OFFSET ${offset}`,
    values
  )

  // Distinct categories for filter
  const catRes = await pool.query(`SELECT DISTINCT category FROM staging_listings WHERE category IS NOT NULL ORDER BY category`)

  return { items: dataRes.rows as StagingItem[], total, per_page, categories: catRes.rows.map((r: { category: string }) => r.category) }
}

export default async function AdminStagingPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  let items: StagingItem[] = []
  let total = 0
  let per_page = 50
  let categories: string[] = []

  try {
    const result = await getStagingData({ q: sp.q, status: sp.status, category: sp.category, page })
    items = result.items
    total = result.total
    per_page = result.per_page
    categories = result.categories
  } catch { /* DB non configurée */ }

  const totalPages = Math.ceil(total / per_page)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          Zone de staging <span className="text-sm font-normal text-gray-500">({total})</span>
        </h1>
        <Link href="/admin/import" className="text-sm text-gray-500 hover:text-gray-800">
          ← Import
        </Link>
      </div>

      <form method="GET" className="flex gap-2 mb-5 flex-wrap">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Rechercher…"
          className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {categories.length > 0 && (
          <select
            name="category"
            defaultValue={sp.category ?? ''}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button type="submit" className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700">
          Filtrer
        </button>
      </form>

      <StagingTable items={items} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams()
            if (sp.q) params.set('q', sp.q)
            if (sp.status) params.set('status', sp.status)
            if (sp.category) params.set('category', sp.category)
            params.set('page', String(p))
            return (
              <a
                key={p}
                href={`/admin/staging?${params.toString()}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  p === page ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

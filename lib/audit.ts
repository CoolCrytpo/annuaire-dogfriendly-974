import pool from '@/lib/db/client'

export async function logAudit(params: {
  user_id?: string
  entity_type: string
  entity_id: string
  action: string
  before?: unknown
  after?: unknown
}): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, before_json, after_json)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.user_id ?? null,
      params.entity_type,
      params.entity_id,
      params.action,
      params.before ? JSON.stringify(params.before) : null,
      params.after ? JSON.stringify(params.after) : null,
    ]
  )
}

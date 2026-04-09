import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  // En build statique, DATABASE_URL peut être absent — le pool n'est utilisé qu'au runtime
  return new Pool({
    connectionString: connectionString ?? 'postgresql://localhost/dogfriendly974',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

// En développement, réutiliser le pool pour éviter les connexions multiples lors du HMR
const pool: Pool = global._pgPool ?? createPool()
if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool
}

export { pool }
export default pool

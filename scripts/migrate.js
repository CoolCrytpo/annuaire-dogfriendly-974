/**
 * Script de migration — applique les fichiers migrations/*.sql dans l'ordre
 * Usage :
 *   node scripts/migrate.js          -- migrations 001 et 002 (schema + seed)
 *   node scripts/migrate.js --demo   -- ajoute aussi la migration 003 (données démo)
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const withDemo = process.argv.includes('--demo')
  const migrationsDir = path.join(__dirname, '..', 'migrations')

  let files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (!withDemo) {
    files = files.filter((f) => !f.startsWith('003'))
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    console.log(`→ Applying ${file}…`)
    try {
      await pool.query(sql)
      console.log(`  ✓ ${file} OK`)
    } catch (err) {
      console.error(`  ✗ ${file} FAILED:`, err.message)
      throw err
    }
  }

  await pool.end()
  console.log('Migrations terminées.')
}

migrate().catch((err) => {
  console.error('Erreur migration :', err.message)
  process.exit(1)
})

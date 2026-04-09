/**
 * Script : Créer un utilisateur admin initial
 * Usage : npx tsx jobs/create-admin-user.ts admin@example.com MonMotDePasse123
 */

import pool from '../lib/db/client'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function createAdminUser() {
  const [, , email, password, name] = process.argv

  if (!email || !password) {
    console.error('Usage: npx tsx jobs/create-admin-user.ts <email> <password> [name]')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Le mot de passe doit faire au moins 8 caractères')
    process.exit(1)
  }

  const hash = hashPassword(password)
  const displayName = name ?? email.split('@')[0]

  const result = await pool.query(
    `INSERT INTO users (email, name, role, password_hash)
     VALUES ($1, $2, 'admin', $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = 'admin'
     RETURNING id, email, role`,
    [email, displayName, hash]
  )

  console.log('Utilisateur admin créé/mis à jour :')
  console.log(result.rows[0])
  await pool.end()
}

createAdminUser().catch((err) => {
  console.error('Erreur :', err)
  process.exit(1)
})

// server/db/client.ts
import { Pool } from 'pg'

let pool: Pool | null = null

export const getPgPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || 'mydb',
      max: 10, // Maximale Anzahl gleichzeitiger Verbindungen im Pool
    })

    console.log('PostgreSQL pool initialized')
  }

  return pool
}
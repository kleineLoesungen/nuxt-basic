// server/db/init.ts
import { getPgPool } from './client'

const appId = process.env.APP_ID
if (!appId) {
  throw new Error('APP_ID ist nicht definiert')
}

const tableName = `app_${appId}`

export const ensureAppTableExists = async () => {
  const pool = getPgPool()

  const tableExistsQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `

  const existsResult = await pool.query(tableExistsQuery, [tableName])
  const exists = existsResult.rows[0].exists

  if (!exists) {
    console.log(`Tabelle ${tableName} wird erstellt...`)

    const createTableQuery = `
      CREATE TABLE ${tableName} (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL
      );
    `
    await pool.query(createTableQuery)

    console.log(`Tabelle ${tableName} wurde erstellt`)
  } else {
    console.log(`Tabelle ${tableName} existiert bereits`)
  }
}

export const getAppTableName = () => tableName

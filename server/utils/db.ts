// server/utils/db.ts
import { getPgPool } from '../db/client'
import { getAppTableName } from '../db/init'

export const db = {
    async getItem<T>(key: string): Promise<T | null> {
        const pool = getPgPool()
        const table = getAppTableName()

        const res = await pool.query(
            `SELECT data FROM ${table} WHERE key = $1`,
            [key]
        )

        if (res.rows.length === 0) return null
        return res.rows[0].data as T
    },

    async setItem<T>(key: string, data: T): Promise<void> {
        const pool = getPgPool()
        const table = getAppTableName()

        await pool.query(
            `
  INSERT INTO ${table} (key, data)
  VALUES ($1, $2)
  ON CONFLICT (key) DO UPDATE
  SET data = EXCLUDED.data
  `,
            [key, JSON.stringify(data)]  // <-- Hier stringify einfügen!
        )

    }
}

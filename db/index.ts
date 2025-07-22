import type { DatabaseDriver } from '../types/db.ts'
import { drivers } from './drivers'

export async function getDriver(): Promise<DatabaseDriver> {
  const dbUrl = process.env.DB_URL || 'sqlite://./data.db'
  const scheme = dbUrl.split(':')[0]

  const driver = drivers[scheme as keyof typeof drivers]
  if (!driver) throw new Error(`No driver found for scheme: ${scheme}`)

  return driver
}
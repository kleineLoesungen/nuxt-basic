import type { DatabaseDriver } from '../types/db.ts'

export async function getDriver(): Promise<DatabaseDriver> {
  const dbUrl = process.env.DB_URL || 'sqlite://./data.db'
  console.log('>> Lade Driver für:', dbUrl)
  const scheme = dbUrl.split(':')[0]
  try {
    const driverModule = await import(`./drivers/${scheme}.ts`)
    return driverModule.default as DatabaseDriver
  } catch (e) {
    throw new Error(`No driver found for scheme: ${scheme}`)
  }
}
import Database from 'better-sqlite3'
import type { DatabaseDriver, ColumnInfo } from '@/types/db'

const dbUrl = process.env.DB_URL || 'sqlite://./data.db'
const match = dbUrl.match(/^sqlite:\/\/(.+)$/)
if (!match) throw new Error('Invalid DB_URL for sqlite: ' + dbUrl)
const dbPath = match[1]

let db: Database.Database | null = null

async function connect(): Promise<Database.Database> {
  if (!db) {
    db = new Database(dbPath)
  }
  return db
}

async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const database = await connect()
  const stmt = database.prepare(sql)
  return params ? stmt.all(...params) : stmt.all()
}

async function exec(sql: string): Promise<void> {
  const database = await connect()
  database.exec(sql)
}

async function close(): Promise<void> {
  if (db) {
    db.close()
    db = null
  }
}

async function getTableNames(): Promise<string[]> {
  const rows = await query<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
  )
  return rows.map(r => r.name)
}

async function getTableColumns(table: string): Promise<ColumnInfo[]> {
  return await query<ColumnInfo>(`PRAGMA table_info(${table})`)
}

async function countRows(table: string): Promise<number> {
  const rows = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`)
  return rows[0]?.count || 0
}

const sqliteDriver: DatabaseDriver = {
  connect,
  query,
  exec,
  close,
  getTableNames,
  getTableColumns,
  countRows
}

export default sqliteDriver

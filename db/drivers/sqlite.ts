import Database from 'better-sqlite3'

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

async function query<T>(sql: string, params?: any[]): Promise<T[]> {
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

const sqliteDriver = {
  connect,
  query,
  exec,
  close
}

export default sqliteDriver 
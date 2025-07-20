import fs from 'fs'
import path from 'path'
import { getDriver } from '@/db/index'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const schemaPath = path.resolve('db/schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))

function columnSql(name: string, def: any) {
  let sql = `${name} `
  switch (def.type) {
    case 'integer': sql += 'INTEGER'; break
    case 'string': sql += 'VARCHAR(255)'; break
    case 'text': sql += 'TEXT'; break
    case 'boolean': sql += 'BOOLEAN'; break
    case 'datetime': sql += 'DATETIME'; break
    default: throw new Error('Unknown type: ' + def.type)
  }
  if (def.primary) sql += ' PRIMARY KEY'
  if (def.autoIncrement) sql += ' AUTOINCREMENT'
  if (def.unique) sql += ' UNIQUE'
  if (def.nullable === false) sql += ' NOT NULL'
  if (def.default !== undefined) sql += ` DEFAULT ${typeof def.default === 'string' ? `'${def.default}'` : def.default}`
  if (def.references) sql += ` REFERENCES ${def.references.table}(${def.references.column})`
  return sql
}

async function migrate({ force = false } = {}) {
  const driver = await getDriver()
  for (const [table, tdef] of Object.entries<any>(schema.tables)) {
    // Check if table exists
    const res = await driver.query(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table])
    if (res.length === 0) {
      // Create table
      const cols = Object.entries(tdef.columns).map(([name, def]) => columnSql(name, def)).join(', ')
      const sql = `CREATE TABLE ${table} (${cols})`
      console.log(`Creating table: ${table}`)
      await driver.exec(sql)
      continue
    }
    // TODO: Check columns, warn if different, and alter if force
    // For now, just warn
    console.warn(`Table ${table} already exists. (Column diff check not implemented)`)
  }
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  const force = process.argv.includes('--force')
  console.log('start migration')

  try {
    await migrate({ force })
    console.log('migration finished')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}
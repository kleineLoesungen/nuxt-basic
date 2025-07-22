import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getDriver } from '@/db/index'
import { fileURLToPath } from 'url'

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
  if (def.default !== undefined) {
    sql += ` DEFAULT ${typeof def.default === 'string' ? `'${def.default}'` : def.default}`
  }
  if (def.references) sql += ` REFERENCES ${def.references.table}(${def.references.column})`
  return sql
}

function normalizeType(type: string): string {
  return type.toUpperCase().replace(/\(\d+\)/, '') // z.B. VARCHAR(255) -> VARCHAR
}

function compareColumn(def: any, actual: any): string[] {
  const expectedType = normalizeType(columnSql('x', def).split(' ')[1])
  const actualType = normalizeType(actual.type)

  const mismatches: string[] = []

  if (expectedType !== actualType) mismatches.push(`Type mismatch: ${expectedType} ≠ ${actualType}`)
  if ((def.nullable === false) !== (actual.notnull === 1)) mismatches.push(`NULL constraint mismatch`)
  if ((def.default ?? null) !== (actual.dflt_value ?? null)) mismatches.push(`Default mismatch`)
  if ((def.primary ?? false) !== (actual.pk === 1)) mismatches.push(`Primary key mismatch`)

  return mismatches
}

async function migrate({ force = false } = {}) {
  const driver = await getDriver()

  for (const [table, tdef] of Object.entries<any>(schema.tables)) {
    const existingTables = await driver.getTableNames()
    const tableExists = existingTables.includes(table)

    if (!tableExists) {
      const cols = Object.entries(tdef.columns).map(([name, def]) => columnSql(name, def)).join(', ')
      const sql = `CREATE TABLE ${table} (${cols})`
      console.log(`🆕 Creating table: ${table}`)
      await driver.exec(sql)
      continue
    }

    console.log(`🔍 Checking table: ${table}`)
    const info = await driver.getTableColumns(table)

    const colMap = Object.fromEntries(info.map((col: any) => [col.name, col]))

    for (const [colName, def] of Object.entries<any>(tdef.columns)) {
      const actual = colMap[colName]
      if (!actual) {
        console.warn(`⚠️ Column ${colName} missing in table ${table}`)
        if (force) {
          const sql = `ALTER TABLE ${table} ADD COLUMN ${columnSql(colName, def)}`
          console.log(`➕ Adding column: ${colName}`)
          await driver.exec(sql)
        }
        continue
      }

      const issues = compareColumn(def, actual)
      if (issues.length > 0) {
        console.warn(`⚠️ Column ${colName} in table ${table} differs:`)
        for (const issue of issues) console.warn(`   - ${issue}`)

        if (force) {
          console.warn(`❗ ALTER COLUMN is not supported in SQLite – skipping.`)
          // Bei anderen DBs könnte man hier Umbauen
        }
      }
    }
  }
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  const force = process.argv.includes('--force')
  console.log('🔧 Starting migration...')
  try {
    await migrate({ force })
    console.log('✅ Migration finished.')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

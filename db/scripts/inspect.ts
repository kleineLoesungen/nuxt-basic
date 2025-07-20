import { fileURLToPath } from 'url'
import path from 'path'
import { getDriver } from '@/db/index'

async function inspect() {
  const driver = await getDriver()

  const tables = await driver.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  )

  if (tables.length === 0) {
    console.log('⚠️ Keine Tabellen gefunden.')
    return
  }

  for (const { name } of tables) {
    console.log(`🧱 Tabelle: ${name}`)

    const columns = await driver.query(`PRAGMA table_info(${name})`)
    for (const col of columns) {
      const attributes = []
      if (col.pk) attributes.push('PRIMARY KEY')
      if (col.notnull) attributes.push('NOT NULL')
      if (col.dflt_value !== null && col.dflt_value !== undefined)
        attributes.push(`DEFAULT ${col.dflt_value}`)

      console.log(`  - ${col.name}: ${col.type}${attributes.length ? ' | ' + attributes.join(', ') : ''}`)
    }

    const result = await driver.query(`SELECT COUNT(*) as count FROM ${name}`)
    console.log(`  🔢 Einträge: ${result[0].count}\n`)
  }

}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  inspect()
    .then(() => console.log('📊 Inspektion abgeschlossen.'))
    .catch((err) => {
      console.error('❌ Fehler:', err)
      process.exit(1)
    })
}
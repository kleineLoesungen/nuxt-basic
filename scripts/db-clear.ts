// scripts/db-clear.ts
import 'dotenv/config'
import { getPgPool } from '../server/db/client'
import { getAppTableName } from '../server/db/init'
import { dataSchemas } from '../server/utils/data-schema'

async function main() {
    const pool = getPgPool()
    const table = getAppTableName()

    console.log(`Clearing table ${table}...`)
    await pool.query(`TRUNCATE ${table}`)

    console.log('Inserting initial keys from dataSchemas...')
    for (const key of Object.keys(dataSchemas)) {
        const schema = dataSchemas[key as keyof typeof dataSchemas]
        let value: any

        try {
            value = schema.parse(undefined)
        } catch {
            // smarter fallback
            try {
                value = schema.parse({})
            } catch {
                try {
                    value = schema.parse([])
                } catch {
                    // letzter Ausweg: leeres Objekt
                    value = {}
                }
            }
        }

        await pool.query(
            `INSERT INTO ${table} (key, data) VALUES ($1, $2)`,
            [key, JSON.stringify(value)]
        )
        console.log(`→ ${key} initialisiert mit:`, value)
    }

    await pool.end()
    console.log('Done.')
}

main().catch((err) => {
    console.error('Error clearing DB:', err)
    process.exit(1)
})

// server/api/_db.ts
import { getDriver } from '@/db/index'

export default defineEventHandler(async () => {
    console.log('>> Lädt _db API handler')
    const driver = await getDriver()
    await driver.connect()

    const tables = await driver.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    )

    const result = []

    for (const { name } of tables) {
        const columns = await driver.query(`PRAGMA table_info(${name})`)
        const countResult = await driver.query(`SELECT COUNT(*) as count FROM ${name}`)
        const count = countResult[0].count

        result.push({
            name,
            count,
            columns: columns.map((col: any) => ({
                name: col.name,
                type: col.type,
                primaryKey: !!col.pk,
                notNull: !!col.notnull,
                default: col.dflt_value
            }))
        })
    }

    await driver.close()
    return result
})

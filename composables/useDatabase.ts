// Placeholder for the generic driver loader
import { getDriver } from '~/db'

interface Where {
  [key: string]: any
}

export async function useDatabase() {
  // Dynamically import the driver loader
  const { getDriver } = await import('../db')
  const driver = await getDriver()

  function toWhereClause(where?: Where): { clause: string, values: any[] } {
    if (!where || Object.keys(where).length === 0) return { clause: '', values: [] }
    const keys = Object.keys(where)
    const clause = 'WHERE ' + keys.map(k => `${k} = ?`).join(' AND ')
    const values = keys.map(k => where[k])
    return { clause, values }
  }

  return {
    async find(table: string, where?: Where) {
      const { clause, values } = toWhereClause(where)
      const sql = `SELECT * FROM ${table} ${clause}`
      return driver.query(sql, values)
    },
    async insert(table: string, data: Record<string, any>) {
      const keys = Object.keys(data)
      const placeholders = keys.map(() => '?').join(', ')
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
      driver.exec(sql, keys.map(k => data[k]))
    },
    async update(table: string, data: Record<string, any>, where: Where) {
      const setKeys = Object.keys(data)
      const setClause = setKeys.map(k => `${k} = ?`).join(', ')
      const { clause, values: whereValues } = toWhereClause(where)
      const sql = `UPDATE ${table} SET ${setClause} ${clause}`
      driver.exec(sql, [...setKeys.map(k => data[k]), ...whereValues])
    },
    async delete(table: string, where: Where) {
      const { clause, values } = toWhereClause(where)
      const sql = `DELETE FROM ${table} ${clause}`
      driver.exec(sql, values)
    },
    driver // expose for advanced use
  }
} 
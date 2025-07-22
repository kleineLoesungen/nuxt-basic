// types/db.ts
export interface ColumnInfo {
  name: string
  type: string
  notnull?: number | boolean
  dflt_value?: string | null
  pk?: number | boolean
}

export interface DatabaseDriver {
  connect(): Promise<any>
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  exec(sql: string): Promise<void>
  close(): Promise<void>

  getTableNames(): Promise<string[]>
  getTableColumns(table: string): Promise<ColumnInfo[]>
  countRows(table: string): Promise<number>
}

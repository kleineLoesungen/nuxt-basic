export interface DatabaseDriver {
  connect(): Promise<any>
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  exec(sql: string): Promise<void>
  close(): Promise<void>
}
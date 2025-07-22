import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemaPath = path.resolve(__dirname, '../schema.json')
const outputPath = path.resolve(__dirname, '../../types/db-types.ts')

type ColumnDefinition = {
  type: string
  primary?: boolean
  autoIncrement?: boolean
  unique?: boolean
  nullable?: boolean
  default?: any
  references?: {
    table: string
    column: string
  }
}

type TableDefinition = {
  columns: {
    [columnName: string]: ColumnDefinition
  }
}

type Schema = {
  tables: {
    [tableName: string]: TableDefinition
  }
}

function mapColumnType(type: string): string {
  switch (type) {
    case 'integer':
      return 'number'
    case 'string':
    case 'datetime':
    case 'text':
      return 'string'
    case 'boolean':
      return 'boolean'
    default:
      return 'any'
  }
}

function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (m) => m.replace('_', '').toUpperCase())
}

function singularize(str: string): string {
  return str.endsWith('s') ? str.slice(0, -1) : str
}

function generateInterfaces(schema: Schema): string {
  const header = `// ⚠️ Diese Datei wurde automatisch generiert von db/scripts/ts-types.ts. Nicht manuell bearbeiten!\n`
  const interfaces: string[] = []

  for (const [tableName, table] of Object.entries(schema.tables)) {
    const interfaceName = toPascalCase(singularize(tableName))
    const fields: string[] = []

    for (const [colName, colDef] of Object.entries(table.columns)) {
      const tsType = mapColumnType(colDef.type)
      const isOptional = colDef.nullable || colDef.default !== undefined
      const typeWithNull = colDef.nullable ? `${tsType} | null` : tsType
      const optionalToken = isOptional ? '?' : ''
      fields.push(`  ${colName}${optionalToken}: ${typeWithNull};`)
    }

    interfaces.push(`export interface ${interfaceName} {\n${fields.join('\n')}\n}`)
  }

  return header + '\n' + interfaces.join('\n\n') + '\n'
}

function main() {
  const schemaRaw = fs.readFileSync(schemaPath, 'utf-8')
  const schema: Schema = JSON.parse(schemaRaw)
  const output = generateInterfaces(schema)

  fs.writeFileSync(outputPath, output, 'utf-8')
  console.log(`✅ Types generated at: ${outputPath}`)
}

main()

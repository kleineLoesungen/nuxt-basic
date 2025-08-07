// server/api/data/keys.get.ts
import { dataSchemas } from '~/server/utils/data-schema'

export default defineEventHandler(() => {
  // keys aus dataSchemas als Array zurückgeben
  return Object.keys(dataSchemas)
})

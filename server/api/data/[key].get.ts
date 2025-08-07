// server/api/data/[key].get.ts
import { dataSchemas, DataStoreTypes } from '~/server/utils/data-schema'

export default defineEventHandler(async (event) => {
  const key = event.context.params?.key

  // Prüfung, ob key ein gültiger Schlüssel in dataSchemas ist
  if (!key || !(key in dataSchemas)) {
    throw createError({ statusCode: 400, message: 'Ungültiger Key' })
  }

  // key ist string | undefined, casten für Typsicherheit
  const typedKey = key as keyof typeof dataSchemas

  // Daten aus DB holen, Typen über DataStoreTypes gesichert
  const data = await db.getItem<DataStoreTypes[typeof typedKey]>(key)

  if (data === null) {
    throw createError({ statusCode: 404, message: 'Nicht gefunden' })
  }

  return data
})

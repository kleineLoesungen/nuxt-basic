// server/plugins/init-db.ts
import { ensureAppTableExists } from '~/server/db/init'

export default defineNitroPlugin(async () => {
  await ensureAppTableExists()
})
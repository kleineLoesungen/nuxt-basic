// server/api/protected.get.ts
import { defineEventHandler } from 'h3'
import { requireAuth } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  return { ok: true, secret: `hello user ${userId}` }
})

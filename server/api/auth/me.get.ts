// server/api/auth/me.get.ts
import { defineEventHandler } from 'h3'
import { getUserSession } from '~/server/utils/session'
import { findUserById } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const s = await getUserSession(event)
    if (!s) return { ok: true, user: null }
    const u = await findUserById(s.userId)
    return { ok: true, user: u ? { id: u.id, name: u.name } : null }
})

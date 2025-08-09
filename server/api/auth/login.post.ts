// server/api/auth/login.post.ts
import { defineEventHandler, readBody } from 'h3'
import { verifyPassword } from '~/server/utils/auth'
import { createSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
    const body = await readBody<{ name?: string; password?: string }>(event)
    if (!body?.name || !body?.password) {
        event.node.res.statusCode = 400
        return { ok: false, error: 'name and password required' }
    }
    const user = await verifyPassword(body.name, body.password)
    if (!user) {
        event.node.res.statusCode = 401
        return { ok: false, error: 'invalid credentials' }
    }
    await createSession(event, user.id)
    return { ok: true, user: { id: user.id, name: user.name } }
})

import { defineEventHandler, readBody } from 'h3'
import { createUser } from '~/server/utils/auth'
import { db } from '~/server/utils/db'
import { dataSchemas } from '~/server/utils/data-schema'

export default defineEventHandler(async (event) => {
    const body = await readBody<{ name?: string; password?: string; email?: string }>(event)

    if (!body?.name || !body?.password) {
        event.node.res.statusCode = 400
        return { ok: false, error: 'name and password required' }
    }

    // alle aktuellen User laden
    const users = (await db.getItem<typeof dataSchemas.users._type>('users')) || []

    // Role bestimmen: erster User → admin, sonst user
    const role = users.length === 0 ? 'admin' : 'user'

    // einfache ID – für echte DB lieber sequence/uuid
    const id = Math.floor(Math.random() * 1_000_000)

    try {
        const user = await createUser({
            id,
            name: body.name,
            password: body.password,
            email: body.email,
            role
        })
        return { ok: true, user }
    } catch (e: any) {
        event.node.res.statusCode = 409
        return { ok: false, error: e.message ?? 'conflict' }
    }
})

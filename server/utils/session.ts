// server/utils/session.ts
import { H3Event, getCookie, setCookie, deleteCookie } from 'h3'
import crypto from 'node:crypto'
import { db } from '~/server/utils/db'

type Session = { userId: number; createdAt: string; expiresAt: string }
type SessionStore = Record<string, Session>

const SESSIONS_KEY = 'sessions'
const COOKIE_NAME = 'sid'
const TTL_HOURS = 24 * 7 // 7 Tage

function nowIso() { return new Date().toISOString() }
function expIso(hours: number) { return new Date(Date.now() + hours * 3600_000).toISOString() }

async function loadSessions(): Promise<SessionStore> {
    return (await db.getItem<SessionStore>(SESSIONS_KEY)) ?? {}
}
async function saveSessions(s: SessionStore) {
    await db.setItem(SESSIONS_KEY, s)
}

export async function createSession(event: H3Event, userId: number) {
    const sid = crypto.randomBytes(32).toString('hex')
    const sessions = await loadSessions()
    sessions[sid] = { userId, createdAt: nowIso(), expiresAt: expIso(TTL_HOURS) }
    await saveSessions(sessions)

    setCookie(event, COOKIE_NAME, sid, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: TTL_HOURS * 3600,
    })
    return sid
}

export async function destroySession(event: H3Event) {
    const sid = getCookie(event, COOKIE_NAME)
    if (!sid) return
    const sessions = await loadSessions()
    if (sessions[sid]) {
        delete sessions[sid]
        await saveSessions(sessions)
    }
    deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function getUserSession(event: H3Event): Promise<Session | null> {
    const sid = getCookie(event, COOKIE_NAME)
    if (!sid) return null
    const sessions = await loadSessions()
    const s = sessions[sid]
    if (!s) return null
    if (new Date(s.expiresAt).getTime() < Date.now()) {
        // abgelaufen: aufräumen
        delete sessions[sid]
        await saveSessions(sessions)
        deleteCookie(event, COOKIE_NAME, { path: '/' })
        return null
    }
    return s
}

/** Wirft 401, wenn nicht eingeloggt. Gibt userId zurück. */
export async function requireAuth(event: H3Event): Promise<number> {
    const s = await getUserSession(event)
    if (!s) {
        // bewusst kein WWW-Authenticate etc. — Session erwartetes Modell
        event.node.res.statusCode = 401
        throw new Error('Unauthorized')
    }
    // Optional: Rolling Session erneuern
    return s.userId
}

/** Bequemer Wrapper zum Schützen einzelner Routen */
export function withAuth<T>(handler: (event: H3Event, userId: number) => T | Promise<T>) {
    return async (event: H3Event) => {
        const userId = await requireAuth(event)
        return handler(event, userId)
    }
}

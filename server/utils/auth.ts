// server/utils/auth.ts
import { db } from '~/server/utils/db'
import { dataSchemas } from '~/server/utils/data-schema'
import { z } from 'zod'
import argon2 from 'argon2'

type Users = z.infer<typeof dataSchemas.users>
type User = Users[number]
const USERS_KEY = 'users'

async function loadUsers(): Promise<Users> {
    const raw = await db.getItem<unknown>(USERS_KEY)
    if (!raw) return []
    const parsed = dataSchemas.users.safeParse(raw)
    return parsed.success ? parsed.data : []
}

async function saveUsers(users: Users) {
    await db.setItem(USERS_KEY, dataSchemas.users.parse(users))
}

export async function findUserByName(name: string) {
    const users = await loadUsers()
    return users.find(u => u.name === name) ?? null
}
export async function findUserById(id: number) {
    const users = await loadUsers()
    return users.find(u => u.id === id) ?? null
}

export async function createUser({
    id,
    name,
    password,
    email,
    role
}: {
    id: number
    name: string
    password: string
    email?: string
    role?: 'admin' | 'user'
}) {
    const users = (await db.getItem<typeof dataSchemas.users._type>('users')) || []

    if (email && users.some(u => u.email === email)) {
        throw new Error('email already in use')
    }

    const password_hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,   // 64 MB
        timeCost: 3,           // Iterationen
        parallelism: 1
    })

    const newUser = {
        id,
        name,
        email: email || '',
        password_hash,
        bearer_tokens: [],
        role: role ?? 'user',
        content: {}
    }

    await db.setItem('users', [...users, newUser])
    return newUser
}

export async function verifyPassword(name: string, password: string) {
    const user = await findUserByName(name)
    if (!user) return null
    const ok = await argon2.verify(user.password_hash, password)
    return ok ? user : null
}

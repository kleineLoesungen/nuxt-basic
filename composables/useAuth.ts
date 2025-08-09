// composables/useAuth.ts
export type AuthUser = { id: number; name: string } | null

export function useAuth() {
    const user = useState<AuthUser>('auth:user', () => null)
    const loading = useState('auth:loading', () => false)

    async function refresh() {
        loading.value = true
        try {
            const r = await $fetch<{ ok: boolean; user: AuthUser }>('/api/auth/me', { credentials: 'include' })
            user.value = r.user
        } finally {
            loading.value = false
        }
    }

    async function login(name: string, password: string) {
        await $fetch('/api/auth/login', { method: 'POST', body: { name, password }, credentials: 'include' })
        await refresh()
    }

    async function logout() {
        await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        user.value = null
    }

    return { user, loading, refresh, login, logout }
}

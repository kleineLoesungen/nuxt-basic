// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const { user, loading, refresh } = useAuth()

    // Status einmalig laden (oder wenn noch unklar)
    if (user.value === null && !loading.value) {
        await refresh()
    }

    // Geschützte Seiten nur mit Login
    const needsAuth = to.meta.requiresAuth === true
    if (needsAuth && !user.value) {
        const redirect = encodeURIComponent(to.fullPath)
        return navigateTo(`/auth/login?redirect=${redirect}`)
    }
})

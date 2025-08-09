// plugins/fetch-auth.client.ts
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.$fetch = $fetch.create({
        onResponseError({ response, request, options }) {
            if (response.status === 401) {
                const route = useRoute()
                navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
            }
        }
    })
})

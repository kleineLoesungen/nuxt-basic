<!-- pages/login.vue -->
<template>
    <div class="max-w-sm mx-auto mt-16">
        <h1 class="text-xl font-bold mb-4">Login</h1>
        <form @submit.prevent="onSubmit" class="space-y-3">
            <input v-model="name" placeholder="Username" class="w-full border p-2 rounded" />
            <input v-model="password" type="password" placeholder="Passwort" class="w-full border p-2 rounded" />
            <button class="bg-brand text-white px-4 py-2 rounded w-full">Einloggen</button>
        </form>
        <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { login } = useAuth()
const name = ref('')
const password = ref('')
const error = ref<string | null>(null)

async function onSubmit() {
    try {
        error.value = null
        await login(name.value, password.value)
        const target = (route.query.redirect as string) || '/'
        router.replace(target)
    } catch (e: any) {
        error.value = e?.data?.error || 'Login fehlgeschlagen'
    }
}
</script>

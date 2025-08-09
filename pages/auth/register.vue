<template>
  <div class="max-w-sm mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6">Register</h1>
    <form @submit.prevent="handleRegister" class="space-y-4">
      <input v-model="name" type="text" placeholder="Name" class="input" required />
      <input v-model="email" type="email" placeholder="Email (optional)" class="input" />
      <input v-model="password" type="password" placeholder="Password" class="input" required />
      <button type="submit" class="btn-primary w-full">Create account</button>
    </form>
    <p v-if="message" class="mt-4 text-green-600">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
const name = ref('')
const email = ref('')
const password = ref('')
const message = ref('')

async function handleRegister() {
  try {
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value
      }
    })

    if (res.success) {
      message.value = res.role === 'admin'
        ? 'Admin account created successfully!'
        : 'User account created successfully!'
    }
  } catch (err: any) {
    message.value = err.data?.statusMessage || 'Error registering'
  }
}
</script>

<style scoped>
.input {
  @apply border rounded px-3 py-2 w-full;
}
.btn-primary {
  @apply bg-brand text-white px-4 py-2 rounded;
}
</style>

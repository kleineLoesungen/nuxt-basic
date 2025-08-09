<!-- layouts/default.vue -->
<template>
    <div class="flex flex-col min-h-screen">
        <!-- HEADER -->
        <!-- layouts/default.vue (Ausschnitt) -->
        <header class="relative flex items-center justify-between bg-brand border-b px-4 py-3 shadow-sm">
            <!-- Left -->
            <div class="flex items-center space-x-2 text-white">
                <img v-if="iconSrc" :src="iconSrc" alt="App Icon" class="w-8 h-8" />
                <span class="font-bold text-lg">NUXT-STARTER</span>
            </div>

            <!-- Right: Menu Button (Icon erbt Weiß) -->
            <button @click="menuOpen = !menuOpen" class="p-2 rounded-md hover:bg-white/10 text-white" aria-label="Menü"
                :aria-expanded="menuOpen ? 'true' : 'false'" aria-controls="main-menu">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <!-- Menü: explizit dunkle Schrift -->
            <transition name="fade">
                <nav v-if="menuOpen" id="main-menu"
                    class="absolute top-full mt-2 right-2 w-48 bg-white text-gray-900 border shadow-md rounded-md p-2 z-50"
                    @keydown.esc="closeMenu">
                    <ul class="flex flex-col divide-y divide-gray-100">
                        <li>
                            <NuxtLink @click="closeMenu" to="/"
                                class="block px-3 py-2 rounded hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                                Startseite
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink @click="closeMenu" to="/protected"
                                class="block px-3 py-2 rounded hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                                Geschützte Seite
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink @click="closeMenu" to="/auth/login"
                                class="block px-3 py-2 rounded hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                                Login
                            </NuxtLink>
                        </li>
                    </ul>
                </nav>
            </transition>
        </header>

        <!-- PAGE CONTENT -->
        <main class="flex-1 p-4">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ iconSrc?: string }>()

const menuOpen = ref(false)
function closeMenu() { menuOpen.value = false }

const route = useRoute()
// Schließe Menü bei Navigation
watch(() => route.fullPath, () => closeMenu())

// Optional: Outside-Click zum Schließen
function onDocClick(e: MouseEvent) {
    const menu = document.getElementById('main-menu')
    const button = (e.target as HTMLElement)?.closest('button[aria-controls="main-menu"]')
    if (!menu) return
    if (menu.contains(e.target as Node) || button) return
    closeMenu()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

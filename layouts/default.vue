<template>
    <div class="flex flex-col min-h-screen">
        <!-- HEADER -->
        <header class="flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
            <!-- Left: Icon + App Name -->
            <div class="flex items-center space-x-2">
                <img src="/icon.png" alt="App Icon" class="w-8 h-8" />
                <span class="font-bold text-lg">MeineApp</span>
            </div>

            <!-- Right: Menu Button -->
            <button @click="menuOpen = !menuOpen" class="p-2 rounded-md hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </header>

        <!-- MOBILE MENU -->
        <transition name="fade">
            <nav v-if="menuOpen" class="absolute top-14 right-0 w-48 bg-white border shadow-md rounded-md p-2 z-50">
                <ul class="flex flex-col space-y-2">
                    <li>
                        <NuxtLink @click="closeMenu" to="/" class="block px-3 py-2 rounded hover:bg-gray-100">
                            Startseite
                        </NuxtLink>
                    </li>
                    <li>
                        <NuxtLink @click="closeMenu" to="/settings" class="block px-3 py-2 rounded hover:bg-gray-100">
                            Einstellungen
                        </NuxtLink>
                    </li>
                    <li>
                        <NuxtLink @click="closeMenu" to="/about" class="block px-3 py-2 rounded hover:bg-gray-100">
                            Über uns
                        </NuxtLink>
                    </li>
                </ul>
            </nav>
        </transition>

        <!-- PAGE CONTENT -->
        <main class="flex-1 p-4">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">

const menuOpen = ref(false)

function closeMenu() {
    menuOpen.value = false
}
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

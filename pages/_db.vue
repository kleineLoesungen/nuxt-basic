<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">🧩 Datenbank-Inspektion</h1>
        <div v-if="pending">Lade...</div>
        <div v-else>
            <div v-for="table in data" :key="table.name" class="mb-6 border rounded p-4 shadow-sm">
                <h2 class="text-xl font-semibold mb-2">🧱 Tabelle: {{ table.name }}</h2>
                <p class="mb-2">🔢 Einträge: {{ table.count }}</p>
                <table class="table-auto text-left text-sm">
                    <thead>
                        <tr>
                            <th class="pr-4">Spalte</th>
                            <th class="pr-4">Typ</th>
                            <th class="pr-4">Attribute</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="col in table.columns" :key="col.name">
                            <td class="pr-4 font-mono">{{ col.name }}</td>
                            <td class="pr-4">{{ col.type }}</td>
                            <td class="pr-4 text-gray-600">
                                <span v-if="col.primaryKey">PRIMARY KEY </span>
                                <span v-if="col.notNull">NOT NULL </span>
                                <span v-if="col.default !== null">DEFAULT {{ col.default }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { data, pending } = await useFetch('/api/_db')
</script>

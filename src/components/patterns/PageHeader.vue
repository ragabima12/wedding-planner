<script setup lang="ts">
const { title, description } = defineProps<{ title: string; description?: string }>()
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold tracking-tight text-balance">{{ title }}</h1>
      <p v-if="description" class="mt-1 max-w-prose text-sm text-pretty text-fg-muted">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

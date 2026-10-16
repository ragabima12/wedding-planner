<script setup lang="ts">
const { title, description } = defineProps<{ title: string; description?: string }>()
</script>

<template>
  <main
    id="main"
    class="flex min-h-dvh flex-col items-center justify-center gap-8 bg-bg-subtle px-4 py-10"
  >
    <div class="flex flex-col items-center gap-3 text-center">
      <img src="/favicon.svg" alt="" width="40" height="40" />
      <h1 class="text-2xl font-semibold tracking-tight text-balance">{{ title }}</h1>
      <p v-if="description" class="max-w-md text-sm text-pretty text-fg-muted">
        {{ description }}
      </p>
    </div>
    <slot />
  </main>
</template>

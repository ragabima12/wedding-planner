<script setup lang="ts">
import type { Component } from 'vue'

const { title, description, icon } = defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong/50 px-6 py-12 text-center"
  >
    <div
      v-if="icon"
      class="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-strong"
    >
      <component :is="icon" class="size-6" aria-hidden="true" />
    </div>
    <div>
      <p class="font-semibold">{{ title }}</p>
      <p v-if="description" class="mx-auto mt-1 max-w-sm text-sm text-pretty text-fg-muted">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.default" class="mt-1 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

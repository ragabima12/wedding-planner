<script setup lang="ts">
import { useId } from 'vue'
import { cn } from '@/lib/utils'

const { title, description, danger } = defineProps<{
  title: string
  description?: string
  danger?: boolean
}>()
const id = useId()
</script>

<template>
  <section
    :aria-labelledby="id"
    :class="
      cn(
        'grid gap-4 rounded-lg border bg-surface p-5 sm:p-6 lg:grid-cols-[16rem_1fr] lg:gap-8',
        danger ? 'border-danger/40' : 'border-border',
      )
    "
  >
    <div class="min-w-0">
      <h2 :id="id" :class="cn('font-semibold', danger && 'text-danger')">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-sm text-pretty text-fg-muted">{{ description }}</p>
    </div>
    <div class="min-w-0">
      <slot />
    </div>
  </section>
</template>

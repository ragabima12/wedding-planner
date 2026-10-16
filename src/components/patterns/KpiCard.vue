<script setup lang="ts">
import { cn } from '@/lib/utils'

const {
  label,
  value,
  sub,
  tone = 'default',
  title,
} = defineProps<{
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'danger' | 'success' | 'warning'
  /** Full value for abbreviated numbers. */
  title?: string
}>()
</script>

<template>
  <div class="@container min-w-0 rounded-lg border border-border bg-surface p-4 sm:p-5">
    <p class="text-sm font-medium text-fg-muted">{{ label }}</p>
    <p
      :title="title"
      :class="
        cn(
          'mt-2 text-xl font-semibold tracking-tight whitespace-nowrap tabular-nums @[14rem]:text-2xl',
          {
            default: 'text-fg',
            danger: 'text-danger',
            success: 'text-success',
            warning: 'text-warning',
          }[tone],
        )
      "
    >
      {{ value }}
    </p>
    <p v-if="sub || $slots.default" class="mt-1 text-xs text-fg-muted">
      <slot>{{ sub }}</slot>
    </p>
  </div>
</template>

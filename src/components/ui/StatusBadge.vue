<script setup lang="ts">
import { cn } from '@/lib/utils'

const { tone = 'neutral' } = defineProps<{
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}>()
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5',
        {
          neutral: 'bg-bg-subtle text-fg-muted ring-1 ring-border ring-inset',
          primary: 'bg-primary-soft text-primary-strong',
          success: 'bg-success-soft text-success',
          warning: 'bg-warning-soft text-warning',
          danger: 'bg-danger-soft text-danger',
          info: 'bg-info-soft text-info',
        }[tone],
      )
    "
  >
    <slot />
  </span>
</template>

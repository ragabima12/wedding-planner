<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const {
  value,
  max = 100,
  tone = 'primary',
  label,
} = defineProps<{
  value: number
  max?: number
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  label: string
}>()

const pct = computed(() => (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0))
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="Math.round(pct)"
    aria-valuemin="0"
    aria-valuemax="100"
    class="h-2 w-full overflow-hidden rounded-full bg-bg-subtle ring-1 ring-border ring-inset"
  >
    <div
      :class="
        cn(
          'h-full rounded-full transition-[width] duration-500 ease-out-quart',
          {
            primary: 'bg-primary',
            success: 'bg-success',
            warning: 'bg-warning',
            danger: 'bg-danger',
          }[tone],
        )
      "
      :style="{ width: `${pct}%` }"
    />
  </div>
</template>

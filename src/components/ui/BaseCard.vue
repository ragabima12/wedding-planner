<script setup lang="ts">
import { cn } from '@/lib/utils'

const { class: klass, as = 'section' } = defineProps<{ class?: string; as?: string }>()
</script>

<template>
  <component :is="as" :class="cn('rounded-lg border border-border bg-surface', klass)">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    block?: boolean
  }>(),
  { variant: 'secondary', size: 'md', type: 'button' },
)

const classes = computed(() =>
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none',
    'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0',
    {
      primary: 'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-hover',
      secondary:
        'border border-border-strong/60 bg-surface text-fg hover:bg-bg-subtle active:bg-border/60',
      ghost: 'text-fg hover:bg-bg-subtle active:bg-border/60',
      danger: 'bg-danger text-danger-fg hover:bg-danger/90',
      'danger-ghost': 'text-danger hover:bg-danger-soft',
    }[props.variant],
    {
      sm: 'h-9 px-3 text-sm touch:h-11',
      md: 'h-10 px-4 text-sm touch:h-11',
      lg: 'h-12 px-5 text-base',
      icon: 'size-10 touch:size-11',
      'icon-sm': 'size-8 touch:size-10',
    }[props.size],
    props.block && 'w-full',
  ),
)
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <Loader2 v-if="loading" class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
    <slot />
  </button>
</template>

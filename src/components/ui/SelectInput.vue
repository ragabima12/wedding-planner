<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { inputClass } from './inputClass'

defineOptions({ inheritAttrs: false })
const { options, class: klass } = defineProps<{
  options: readonly { value: string; label: string }[]
  class?: string
}>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div :class="cn('relative min-w-0', klass)">
    <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- label comes from the caller via id/aria -->
    <select v-model="model" v-bind="$attrs" :class="cn(inputClass, 'appearance-none pr-9')">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
      aria-hidden="true"
    />
  </div>
</template>

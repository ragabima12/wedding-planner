<script setup lang="ts">
import { Check } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <span class="relative inline-flex size-6 shrink-0 items-center justify-center">
    <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- label comes from the caller via id/aria -->
    <input
      v-model="model"
      type="checkbox"
      v-bind="$attrs"
      class="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-sm border-2 border-border-strong bg-surface checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
    <Check
      class="pointer-events-none relative size-4 text-primary-fg opacity-0 peer-checked:opacity-100"
      stroke-width="3"
      aria-hidden="true"
    />
  </span>
</template>

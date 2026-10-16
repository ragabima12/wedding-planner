<script setup lang="ts">
import { cn } from '@/lib/utils'
import { inputClass } from './inputClass'

defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ default: '' })
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- label comes from the caller via id/aria -->
  <textarea
    v-model="model"
    rows="3"
    v-bind="$attrs"
    :class="cn(inputClass, 'h-auto min-h-20 py-2 touch:h-auto')"
  />
</template>

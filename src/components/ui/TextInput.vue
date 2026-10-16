<script setup lang="ts">
import { cn } from '@/lib/utils'
import { inputClass } from './inputClass'

defineOptions({ inheritAttrs: false })
const { class: klass } = defineProps<{ class?: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <input v-model="model" v-bind="$attrs" :class="cn(inputClass, klass)" />
</template>

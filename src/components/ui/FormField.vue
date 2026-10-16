<script setup lang="ts">
import { useId } from 'vue'

const { label, hint, error, optional } = defineProps<{
  label: string
  hint?: string
  error?: string | null
  optional?: boolean
}>()

defineSlots<{
  default(props: { id: string; describedby: string | undefined; invalid: boolean }): unknown
}>()

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-fg">
      {{ label }}
      <span v-if="optional" class="font-normal text-fg-muted">(opsional)</span>
    </label>
    <slot
      :id="id"
      :describedby="[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined"
      :invalid="!!error"
    />
    <p v-if="hint && !error" :id="hintId" class="text-xs text-fg-muted">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="text-xs font-medium text-danger">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue'
import BaseDialog from './BaseDialog.vue'

const { title, description, confirmLabel, loading } = defineProps<{
  title: string
  description: string
  confirmLabel: string
  loading?: boolean
}>()
const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <BaseDialog v-model:open="open" :title="title" size="sm">
    <p class="text-sm text-pretty text-fg-muted">{{ description }}</p>
    <template #footer>
      <BaseButton @click="open = false">Batal</BaseButton>
      <BaseButton variant="danger" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

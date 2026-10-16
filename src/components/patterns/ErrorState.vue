<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import { errorMessage } from '@/composables/useToast'

const { error } = defineProps<{ error: unknown }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="flex flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft p-5 sm:flex-row sm:items-center"
  >
    <AlertTriangle class="size-5 shrink-0 text-danger" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-danger">Data gagal dimuat</p>
      <p class="mt-0.5 text-sm text-fg">{{ errorMessage(error) }}</p>
    </div>
    <BaseButton @click="emit('retry')">Coba lagi</BaseButton>
  </div>
</template>

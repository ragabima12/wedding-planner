<script setup lang="ts">
import { CheckCircle2, AlertCircle, X } from 'lucide-vue-next'
import { useToasts } from '@/composables/useToast'

const { toasts, dismiss, pause, resume } = useToasts()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup
      enter-from-class="opacity-0 translate-y-2"
      enter-active-class="transition duration-200 ease-out-quart"
      leave-to-class="opacity-0"
      leave-active-class="transition duration-150"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- hover/focus only pauses auto-dismiss -->
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-fg p-3 pl-4 text-bg shadow-lg"
        @mouseenter="pause(t.id)"
        @mouseleave="resume(t.id)"
        @focusin="pause(t.id)"
        @focusout="resume(t.id)"
      >
        <CheckCircle2
          v-if="t.tone === 'success'"
          class="mt-0.5 size-5 shrink-0 text-success-soft"
          aria-hidden="true"
        />
        <AlertCircle
          v-else-if="t.tone === 'danger'"
          class="mt-0.5 size-5 shrink-0 text-danger-soft"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1 py-0.5">
          <p class="text-sm font-medium">{{ t.title }}</p>
          <p v-if="t.description" class="mt-0.5 text-sm opacity-85">{{ t.description }}</p>
        </div>
        <button
          v-if="t.action"
          type="button"
          class="h-8 shrink-0 rounded-md px-2 text-sm font-semibold underline-offset-2 hover:underline focus-visible:outline-bg"
          @click="(t.action.run(), dismiss(t.id))"
        >
          {{ t.action.label }}
        </button>
        <button
          type="button"
          class="inline-flex size-8 shrink-0 items-center justify-center rounded-md opacity-80 hover:opacity-100 focus-visible:outline-bg"
          aria-label="Tutup notifikasi"
          @click="dismiss(t.id)"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

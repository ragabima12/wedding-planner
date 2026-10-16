<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const {
  title,
  description,
  side,
  size = 'md',
} = defineProps<{
  title: string
  description?: string
  /** "right" renders a drawer (sheet) instead of a centered dialog. */
  side?: 'right'
  size?: 'sm' | 'md' | 'lg'
}>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-scrim data-[state=open]:animate-[fade-in_150ms_ease-out]"
      />
      <DialogContent
        :class="
          cn(
            'fixed z-50 flex flex-col bg-surface-raised shadow-2xl ring-1 ring-border focus-visible:outline-none',
            side === 'right'
              ? 'inset-y-0 right-0 w-full max-w-lg data-[state=open]:animate-[sheet-in_220ms_var(--ease-out-quart)]'
              : [
                  'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-4rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
                  { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }[size],
                  'data-[state=open]:animate-[dialog-in_180ms_var(--ease-out-quart)]',
                ],
          )
        "
      >
        <header class="flex items-start gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div class="min-w-0 flex-1">
            <DialogTitle class="text-base font-semibold text-balance">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-sm text-fg-muted">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            class="-mt-1 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
            aria-label="Tutup"
          >
            <X class="size-5" aria-hidden="true" />
          </DialogClose>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <slot />
        </div>
        <footer
          v-if="$slots.footer"
          class="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6"
        >
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { MoreHorizontal } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export interface MenuItem {
  label: string
  run: () => void
  danger?: boolean
}

const { items, label } = defineProps<{ items: MenuItem[]; label: string }>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg touch:size-11"
      :aria-label="label"
    >
      <MoreHorizontal class="size-5" aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="4"
        class="z-50 min-w-44 rounded-md border border-border bg-surface-raised p-1 shadow-lg"
      >
        <template v-for="(item, i) in items" :key="item.label">
          <DropdownMenuSeparator v-if="item.danger && i > 0" class="my-1 h-px bg-border" />
          <DropdownMenuItem
            :class="
              cn(
                'flex h-9 cursor-pointer items-center rounded-sm px-3 text-sm outline-none select-none data-highlighted:bg-bg-subtle touch:h-11',
                item.danger && 'text-danger data-highlighted:bg-danger-soft',
              )
            "
            @select="item.run"
          >
            {{ item.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

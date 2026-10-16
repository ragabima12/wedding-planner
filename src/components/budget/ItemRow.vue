<script setup lang="ts">
import { ref, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import type { BudgetItem, Patch } from '@/types'

const { item, eventOptions, vendorOptions, readonly } = defineProps<{
  item: BudgetItem
  eventOptions: { value: string; label: string }[]
  vendorOptions: { value: string; label: string }[]
  readonly: boolean
}>()
const emit = defineEmits<{ update: [patch: Patch<'budget_items'>]; remove: [] }>()

const name = ref(item.name)
const estimated = ref<number | null>(item.estimated)
const actual = ref<number | null>(item.actual)
watch(
  () => item,
  (i) => {
    name.value = i.name
    estimated.value = i.estimated
    actual.value = i.actual
  },
)

function commitName() {
  const v = name.value.trim()
  if (!v) name.value = item.name
  else if (v !== item.name) emit('update', { name: v })
}
</script>

<template>
  <li
    class="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border px-4 py-3 first:border-t-0 sm:px-5 md:grid-cols-[minmax(10rem,1fr)_10rem_10rem_10rem_10rem_2.75rem] md:items-center md:gap-y-0 md:py-2"
  >
    <div class="col-span-2 min-w-0 md:col-span-1">
      <TextInput
        v-model="name"
        placeholder="Nama rincian"
        :aria-label="`Nama rincian ${item.name}`"
        :disabled="readonly"
        class="border-transparent bg-transparent font-medium hover:border-border focus-visible:bg-surface disabled:bg-transparent disabled:text-fg"
        @blur="commitName"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
      />
    </div>
    <label class="flex min-w-0 flex-col gap-1 md:contents">
      <span class="text-xs text-fg-muted md:sr-only">Acara</span>
      <SelectInput
        :model-value="item.event_id ?? ''"
        :options="eventOptions"
        :disabled="readonly"
        :aria-label="`Acara untuk ${item.name}`"
        @update:model-value="emit('update', { event_id: $event || null })"
      />
    </label>
    <label class="flex min-w-0 flex-col gap-1 md:contents">
      <span class="text-xs text-fg-muted md:sr-only">Vendor</span>
      <SelectInput
        :model-value="item.vendor_id ?? ''"
        :options="vendorOptions"
        :disabled="readonly"
        :aria-label="`Vendor untuk ${item.name}`"
        @update:model-value="emit('update', { vendor_id: $event || null })"
      />
    </label>
    <label class="flex min-w-0 flex-col gap-1 md:contents">
      <span class="text-xs text-fg-muted md:sr-only">Estimasi</span>
      <MoneyInput
        v-model="estimated"
        placeholder="0"
        :aria-label="`Estimasi ${item.name}`"
        :disabled="readonly"
        @commit="(v) => (v ?? 0) !== item.estimated && emit('update', { estimated: v ?? 0 })"
      />
    </label>
    <label class="flex min-w-0 flex-col gap-1 md:contents">
      <span class="text-xs text-fg-muted md:sr-only">Harga final</span>
      <MoneyInput
        v-model="actual"
        :aria-label="`Harga final ${item.name}`"
        placeholder="Belum deal"
        :disabled="readonly"
        @commit="(v) => v !== item.actual && emit('update', { actual: v })"
      />
    </label>
    <div class="flex items-end justify-end md:items-center">
      <button
        v-if="!readonly"
        type="button"
        class="inline-flex size-10 items-center justify-center rounded-md text-fg-muted hover:bg-danger-soft hover:text-danger touch:size-11"
        :aria-label="`Hapus ${item.name}`"
        :title="`Hapus ${item.name}`"
        @click="emit('remove')"
      >
        <Trash2 class="size-4" aria-hidden="true" />
      </button>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { AlertTriangle, ChevronDown, Plus } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CategoryIcon from '@/components/patterns/CategoryIcon.vue'
import RowMenu from '@/components/patterns/RowMenu.vue'
import type { CategorySummary } from '@/composables/useSummary'
import { formatRupiah, percent } from '@/lib/format'
import type { BudgetItem, Patch } from '@/types'
import ItemRow from './ItemRow.vue'

const { summary, items, eventOptions, vendorOptions, readonly } = defineProps<{
  summary: CategorySummary
  items: BudgetItem[]
  eventOptions: { value: string; label: string }[]
  vendorOptions: { value: string; label: string }[]
  readonly: boolean
}>()
const emit = defineEmits<{
  edit: []
  remove: []
  addItem: [name: string]
  updateItem: [id: string, patch: Patch<'budget_items'>]
  removeItem: [item: BudgetItem]
}>()
const open = defineModel<boolean>('open', { default: false })

const c = computed(() => summary.category)
const over = computed(() => c.value.allocated > 0 && summary.projected > c.value.allocated)
const panelId = computed(() => `cat-${c.value.id}`)

const newName = ref('')
const newInput = useTemplateRef<HTMLInputElement>('newInput')
function add() {
  const v = newName.value.trim()
  if (!v) {
    newInput.value?.focus()
    return
  }
  emit('addItem', v)
  newName.value = ''
}
</script>

<template>
  <BaseCard as="article" class="overflow-hidden">
    <div class="flex items-start gap-3 p-4 sm:p-5">
      <CategoryIcon :name="c.icon" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 class="min-w-0 font-semibold">
            <button
              type="button"
              class="inline-flex min-h-6 items-center gap-1.5 text-left hover:underline"
              :aria-expanded="open"
              :aria-controls="panelId"
              @click="open = !open"
            >
              {{ c.name }}
              <ChevronDown
                :class="[
                  'size-4 shrink-0 text-fg-muted transition-transform',
                  open && 'rotate-180',
                ]"
                aria-hidden="true"
              />
            </button>
          </h2>
          <StatusBadge v-if="over" tone="danger">
            <AlertTriangle aria-hidden="true" />
            Lewat {{ formatRupiah(summary.projected - c.allocated) }}
          </StatusBadge>
          <span class="text-xs text-fg-muted">{{ summary.itemCount }} rincian</span>
        </div>

        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div class="min-w-0">
            <dt class="text-xs text-fg-muted">Anggaran</dt>
            <dd class="font-medium whitespace-nowrap tabular-nums">
              {{ formatRupiah(c.allocated) }}
            </dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-fg-muted">Proyeksi biaya</dt>
            <dd :class="['font-medium whitespace-nowrap tabular-nums', over && 'text-danger']">
              {{ formatRupiah(summary.projected) }}
            </dd>
          </div>
          <div class="min-w-0">
            <dt class="text-xs text-fg-muted">Sudah dibayar</dt>
            <dd class="font-medium whitespace-nowrap tabular-nums">
              {{ formatRupiah(summary.paid) }}
            </dd>
          </div>
        </dl>
        <div class="mt-3">
          <ProgressBar
            :value="summary.projected"
            :max="c.allocated || summary.projected || 1"
            :tone="over ? 'danger' : 'primary'"
            :label="`Proyeksi ${c.name}: ${percent(summary.projected, c.allocated)}% dari anggaran`"
          />
          <p v-if="c.notes" class="mt-2 text-xs text-fg-muted">{{ c.notes }}</p>
        </div>
      </div>
      <RowMenu
        v-if="!readonly"
        :label="`Aksi untuk ${c.name}`"
        :items="[
          { label: 'Ubah kategori', run: () => emit('edit') },
          { label: 'Hapus kategori', run: () => emit('remove'), danger: true },
        ]"
      />
    </div>

    <div v-show="open" :id="panelId" class="border-t border-border bg-bg-subtle/50">
      <div
        class="hidden grid-cols-[minmax(10rem,1fr)_10rem_10rem_10rem_10rem_2.75rem] gap-x-3 px-5 pt-3 pb-1 text-xs font-medium text-fg-muted md:grid"
        aria-hidden="true"
      >
        <span class="pl-3">Rincian</span>
        <span>Acara</span>
        <span>Vendor</span>
        <span class="text-right">Estimasi</span>
        <span class="text-right">Harga final</span>
        <span />
      </div>
      <ul v-if="items.length" :aria-label="`Rincian ${c.name}`">
        <ItemRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          :event-options="eventOptions"
          :vendor-options="vendorOptions"
          :readonly="readonly"
          @update="(p) => emit('updateItem', item.id, p)"
          @remove="emit('removeItem', item)"
        />
      </ul>
      <p v-else class="px-5 py-4 text-sm text-fg-muted">Belum ada rincian biaya.</p>

      <form
        v-if="!readonly"
        class="flex gap-2 border-t border-border px-4 py-3 sm:px-5"
        @submit.prevent="add"
      >
        <input
          ref="newInput"
          v-model="newName"
          :aria-label="`Nama rincian baru untuk ${c.name}`"
          placeholder="Contoh: Tenda tambahan"
          class="h-10 min-w-0 flex-1 rounded-md border border-border-strong/70 bg-surface px-3 text-base sm:text-sm touch:h-11"
        />
        <BaseButton type="submit">
          <Plus aria-hidden="true" />
          Tambah rincian
        </BaseButton>
      </form>
    </div>
  </BaseCard>
</template>

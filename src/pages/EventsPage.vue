<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, CalendarHeart, Clock, MapPin, Plus } from 'lucide-vue-next'
import PageHeader from '@/components/patterns/PageHeader.vue'
import EmptyState from '@/components/patterns/EmptyState.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import RowMenu from '@/components/patterns/RowMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EventSheet from '@/components/events/EventSheet.vue'
import { useRowMutations, useRows } from '@/composables/useRows'
import { useWorkspace } from '@/composables/useWorkspace'
import { SIDE_LABEL } from '@/composables/useSummary'
import { EVENT_KINDS } from '@/data/templates'
import { daysUntil, formatDate, formatRupiah, formatRupiahShort, relativeDays } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { NewRow, WeddingEvent } from '@/types'

const { canEdit } = useWorkspace()
const events = useRows('events')
const items = useRows('budget_items')
const { insert, update, remove } = useRowMutations('events', 'Acara')

const list = computed(() =>
  [...(events.data.value ?? [])].sort(
    (a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at),
  ),
)

const costByEvent = computed(() => {
  const map = new Map<string, number>()
  for (const i of items.data.value ?? [])
    if (i.event_id) map.set(i.event_id, (map.get(i.event_id) ?? 0) + (i.actual ?? i.estimated))
  return map
})
const totalLinked = computed(() => sum([...costByEvent.value.values()], (v) => v))

const sheetOpen = ref(false)
const editing = ref<WeddingEvent | null>(null)

function openNew() {
  editing.value = null
  sheetOpen.value = true
}
function openEdit(e: WeddingEvent) {
  editing.value = e
  sheetOpen.value = true
}

async function save(row: Omit<NewRow<'events'>, 'sort'>) {
  if (editing.value) {
    await update.mutateAsync({ id: editing.value.id, patch: row })
  } else {
    const last = list.value.at(-1)
    await insert.mutateAsync([{ ...row, sort: (last?.sort ?? -1) + 1 }])
  }
  sheetOpen.value = false
}

/** Swap sort values with the neighbour: button alternative to drag-and-drop (WCAG 2.5.7). */
function move(index: number, dir: -1 | 1) {
  const a = list.value[index]
  const b = list.value[index + dir]
  if (!a || !b) return
  const sa = a.sort === b.sort ? index : a.sort
  const sb = a.sort === b.sort ? index + dir : b.sort
  update.mutate({ id: a.id, patch: { sort: sb } })
  update.mutate({ id: b.id, patch: { sort: sa } })
}

function dateTone(iso: string | null) {
  const d = daysUntil(iso)
  if (d === null) return 'neutral' as const
  if (d < 0) return 'neutral' as const
  if (d <= 14) return 'warning' as const
  return 'primary' as const
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Acara"
      description="Urutan rangkaian acara dari lamaran sampai ngunduh mantu, lengkap dengan tanggal, tempat, dan biaya terkait."
    >
      <template #actions>
        <BaseButton v-if="canEdit" variant="primary" @click="openNew">
          <Plus aria-hidden="true" /> Tambah acara
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!canEdit" class="rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
      Kamu punya akses lihat saja. Minta pemilik mengubah peranmu agar bisa mengedit.
    </p>

    <ErrorState v-if="events.isError.value" :error="events.error.value" @retry="events.refetch()" />
    <SkeletonRows v-else-if="events.isPending.value" :rows="5" />
    <EmptyState
      v-else-if="!list.length"
      :icon="CalendarHeart"
      title="Belum ada acara"
      description="Tambahkan rangkaian acara seperti lamaran, akad, dan resepsi agar tanggal dan biayanya terpantau."
    >
      <BaseButton v-if="canEdit" variant="primary" @click="openNew">
        <Plus aria-hidden="true" /> Tambah acara pertama
      </BaseButton>
    </EmptyState>

    <template v-else>
      <p class="text-sm text-fg-muted">
        {{ list.length }} acara · biaya terkait
        <span class="font-medium text-fg tabular-nums" :title="formatRupiah(totalLinked)">{{
          formatRupiahShort(totalLinked)
        }}</span>
        <span class="text-xs"> (dari rincian anggaran yang ditautkan ke acara)</span>
      </p>

      <ol class="relative flex flex-col gap-3">
        <li v-for="(e, i) in list" :key="e.id" class="relative flex gap-3 sm:gap-4">
          <!-- timeline rail -->
          <div class="flex w-6 shrink-0 flex-col items-center pt-5" aria-hidden="true">
            <span class="size-3 rounded-full border-2 border-primary bg-surface" />
            <span v-if="i < list.length - 1" class="mt-1 w-px flex-1 bg-border" />
          </div>

          <BaseCard as="article" class="min-w-0 flex-1 p-4 sm:p-5">
            <div class="flex items-start gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="font-semibold text-balance">{{ e.name }}</h2>
                  <StatusBadge v-if="e.kind !== 'lainnya' && EVENT_KINDS[e.kind] !== e.name">
                    {{ EVENT_KINDS[e.kind] ?? e.kind }}
                  </StatusBadge>
                  <StatusBadge>{{ SIDE_LABEL[e.side] }}</StatusBadge>
                </div>
                <dl class="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                  <div class="flex items-center gap-1.5">
                    <dt class="sr-only">Tanggal</dt>
                    <CalendarHeart class="size-4 text-fg-muted" aria-hidden="true" />
                    <dd v-if="e.date" class="flex flex-wrap items-center gap-2">
                      {{ formatDate(e.date, 'day') }}
                      <StatusBadge :tone="dateTone(e.date)">{{ relativeDays(e.date) }}</StatusBadge>
                    </dd>
                    <dd v-else class="text-fg-muted">Tanggal belum ditentukan</dd>
                  </div>
                  <div v-if="e.start_time" class="flex items-center gap-1.5">
                    <dt class="sr-only">Jam</dt>
                    <Clock class="size-4 text-fg-muted" aria-hidden="true" />
                    <dd class="tabular-nums">{{ e.start_time }} WIB</dd>
                  </div>
                  <div class="flex min-w-0 items-center gap-1.5">
                    <dt class="sr-only">Tempat</dt>
                    <MapPin class="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
                    <dd :class="['min-w-0 break-words', !e.venue && 'text-fg-muted']">
                      {{ e.venue || 'Tempat belum diisi' }}
                    </dd>
                  </div>
                </dl>
                <p v-if="e.notes" class="mt-2 max-w-prose text-sm text-pretty text-fg-muted">
                  {{ e.notes }}
                </p>
              </div>

              <div class="flex shrink-0 flex-col items-end gap-1">
                <p class="text-right">
                  <span class="block text-xs text-fg-muted">Biaya terkait</span>
                  <span
                    class="block text-sm font-semibold whitespace-nowrap tabular-nums"
                    :title="formatRupiah(costByEvent.get(e.id) ?? 0)"
                    >{{ formatRupiahShort(costByEvent.get(e.id) ?? 0) }}</span
                  >
                </p>
              </div>
            </div>

            <div v-if="canEdit" class="mt-3 flex items-center gap-1 border-t border-border pt-3">
              <BaseButton
                size="icon-sm"
                variant="ghost"
                :disabled="i === 0"
                :aria-label="`Naikkan ${e.name}`"
                title="Naikkan urutan"
                @click="move(i, -1)"
              >
                <ArrowUp aria-hidden="true" />
              </BaseButton>
              <BaseButton
                size="icon-sm"
                variant="ghost"
                :disabled="i === list.length - 1"
                :aria-label="`Turunkan ${e.name}`"
                title="Turunkan urutan"
                @click="move(i, 1)"
              >
                <ArrowDown aria-hidden="true" />
              </BaseButton>
              <span class="flex-1" />
              <BaseButton size="sm" variant="ghost" @click="openEdit(e)">Ubah</BaseButton>
              <RowMenu
                :label="`Aksi lain untuk ${e.name}`"
                :items="[
                  { label: 'Ubah acara', run: () => openEdit(e) },
                  { label: 'Hapus acara', danger: true, run: () => remove.mutate([e]) },
                ]"
              />
            </div>
          </BaseCard>
        </li>
      </ol>
    </template>

    <EventSheet
      v-model:open="sheetOpen"
      :event="editing"
      :saving="insert.isPending.value || update.isPending.value"
      @save="save"
    />
  </div>
</template>

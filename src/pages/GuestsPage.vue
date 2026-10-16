<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { Download, MessageCircle, Plus, Search, Users, X } from 'lucide-vue-next'
import PageHeader from '@/components/patterns/PageHeader.vue'
import KpiCard from '@/components/patterns/KpiCard.vue'
import EmptyState from '@/components/patterns/EmptyState.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import RowMenu from '@/components/patterns/RowMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TextInput from '@/components/ui/TextInput.vue'
import GuestSheet from '@/components/guests/GuestSheet.vue'
import {
  GIFT_CHANNEL_LABEL,
  RSVP_LABEL,
  RSVP_TONE,
  downloadGuestsCsv,
  normalizePhone,
  waLink,
} from '@/components/guests/guestUtils'
import { useRowMutations, useRows } from '@/composables/useRows'
import { useWorkspace } from '@/composables/useWorkspace'
import { SIDE_LABEL, useSummary } from '@/composables/useSummary'
import { EVENT_KINDS } from '@/data/templates'
import { formatNumber, formatRupiah, formatRupiahShort, todayIso } from '@/lib/format'
import { cn, sum } from '@/lib/utils'
import type { Guest, NewRow, Rsvp, Side } from '@/types'

const { canEdit, wedding } = useWorkspace()
const guests = useRows('guests')
const events = useRows('events')
const { guestTotals } = useSummary()
const { insert, update, remove } = useRowMutations('guests', 'Tamu')

// ------------------------------------------------------------ filters
const query = ref('')
const q = refDebounced(query, 250)
const side = ref<'' | Side>('')
const rsvp = ref<'' | Rsvp>('')
const sent = ref<'' | 'ya' | 'belum'>('')

const sideOptions = [
  { value: '', label: 'Semua pihak' },
  ...Object.entries(SIDE_LABEL).map(([value, label]) => ({ value, label })),
]
const rsvpOptions = [
  { value: '', label: 'Semua RSVP' },
  ...Object.entries(RSVP_LABEL).map(([value, label]) => ({ value, label })),
]
const sentOptions = [
  { value: '', label: 'Semua undangan' },
  { value: 'ya', label: 'Sudah dikirim' },
  { value: 'belum', label: 'Belum dikirim' },
]

interface Chip {
  key: string
  label: string
  clear: () => void
}
const chips = computed<Chip[]>(() => {
  const list: Chip[] = []
  if (q.value.trim())
    list.push({ key: 'q', label: `“${q.value.trim()}”`, clear: () => (query.value = '') })
  if (side.value)
    list.push({ key: 'side', label: SIDE_LABEL[side.value], clear: () => (side.value = '') })
  if (rsvp.value)
    list.push({ key: 'rsvp', label: RSVP_LABEL[rsvp.value], clear: () => (rsvp.value = '') })
  if (sent.value)
    list.push({
      key: 'sent',
      label: sent.value === 'ya' ? 'Sudah dikirim' : 'Belum dikirim',
      clear: () => (sent.value = ''),
    })
  return list
})
function clearFilters() {
  query.value = ''
  side.value = ''
  rsvp.value = ''
  sent.value = ''
}

const all = computed(() => guests.data.value ?? [])
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  const phoneTerm = /\d/.test(term) ? normalizePhone(term) : ''
  return all.value.filter((g) => {
    if (side.value && g.side !== side.value) return false
    if (rsvp.value && g.rsvp !== rsvp.value) return false
    if (sent.value && g.invite_sent !== (sent.value === 'ya')) return false
    if (!term) return true
    return (
      g.name.toLowerCase().includes(term) ||
      g.group_name.toLowerCase().includes(term) ||
      (phoneTerm.length >= 3 && normalizePhone(g.phone).includes(phoneTerm))
    )
  })
})
const filteredPax = computed(() => sum(filtered.value, (g) => g.pax))

const groups = computed(() =>
  [...new Set(all.value.map((g) => g.group_name).filter(Boolean))].sort(),
)

// Events a guest can be invited to: akad / resepsi / ngunduh mantu present in this wedding.
const eventOptions = computed(() => {
  const kinds = new Set((events.data.value ?? []).map((e) => e.kind))
  const base = ['akad', 'resepsi', 'ngunduh'].filter((k) => kinds.has(k))
  return (base.length ? base : ['akad', 'resepsi']).map((k) => ({
    value: k,
    label: EVENT_KINDS[k] ?? k,
  }))
})

// ---------------------------------------------------------- selection
const selected = ref<Set<string>>(new Set())
watch(filtered, (list) => {
  const ids = new Set(list.map((g) => g.id))
  selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
})
const allSelected = computed(
  () => filtered.value.length > 0 && filtered.value.every((g) => selected.value.has(g.id)),
)
function toggleAll(on: boolean) {
  selected.value = on ? new Set(filtered.value.map((g) => g.id)) : new Set()
}
function toggleOne(id: string, on: boolean) {
  const next = new Set(selected.value)
  if (on) next.add(id)
  else next.delete(id)
  selected.value = next
}
const selectedRows = computed(() => all.value.filter((g) => selected.value.has(g.id)))

function markSent() {
  for (const g of selectedRows.value)
    if (!g.invite_sent) update.mutate({ id: g.id, patch: { invite_sent: true } })
  selected.value = new Set()
}
function removeSelected() {
  remove.mutate(selectedRows.value)
  selected.value = new Set()
}

// ---------------------------------------------------------- quick add
const quickName = ref('')
const quickPax = ref('2')
const quickSide = ref<Side>('bersama')
const quickError = ref<string | null>(null)

function blankGuest(): Omit<NewRow<'guests'>, 'name' | 'pax' | 'side'> {
  return {
    group_name: '',
    phone: '',
    invite_type: 'digital',
    invite_sent: false,
    rsvp: 'belum',
    events: eventOptions.value.map((e) => e.value),
    gift_amount: null,
    gift_channel: '',
    notes: '',
  }
}

function quickAdd() {
  const name = quickName.value.trim()
  const pax = Number(quickPax.value)
  if (!name) {
    quickError.value = 'Isi nama tamu.'
    return
  }
  if (!Number.isInteger(pax) || pax < 1 || pax > 50) {
    quickError.value = 'Isi jumlah orang antara 1 dan 50.'
    return
  }
  quickError.value = null
  insert.mutate([{ ...blankGuest(), name, pax, side: quickSide.value }])
  quickName.value = ''
  quickPax.value = '2'
  document.getElementById('quick-guest-name')?.focus()
}

// --------------------------------------------------------------- sheet
const sheetOpen = ref(false)
const editing = ref<Guest | null>(null)
function openNew() {
  editing.value = null
  sheetOpen.value = true
}
function openEdit(g: Guest) {
  editing.value = g
  sheetOpen.value = true
}
async function save(row: NewRow<'guests'>) {
  if (editing.value) await update.mutateAsync({ id: editing.value.id, patch: row })
  else await insert.mutateAsync([row])
  sheetOpen.value = false
}

function setRsvp(g: Guest, value: string) {
  update.mutate({ id: g.id, patch: { rsvp: value as Rsvp } })
}
function setSent(g: Guest, value: boolean) {
  update.mutate({ id: g.id, patch: { invite_sent: value } })
}
function menuFor(g: Guest) {
  return [
    { label: 'Ubah tamu', run: () => openEdit(g) },
    { label: 'Hapus tamu', danger: true, run: () => remove.mutate([g]) },
  ]
}

function exportCsv() {
  downloadGuestsCsv(filtered.value, `daftar-tamu-${todayIso()}.csv`)
}

const buffer = computed(() => wedding.value?.catering_buffer_pct ?? 10)
</script>

<template>
  <div :class="['flex flex-col gap-6', selected.size && 'pb-28 md:pb-0']">
    <PageHeader
      title="Tamu"
      description="Daftar undangan per pihak keluarga, status RSVP, dan catatan angpao."
    >
      <template #actions>
        <BaseButton :disabled="!filtered.length" @click="exportCsv">
          <Download aria-hidden="true" /> Ekspor CSV
        </BaseButton>
        <BaseButton v-if="canEdit" variant="primary" @click="openNew">
          <Plus aria-hidden="true" /> Tambah tamu
        </BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Undangan"
        :value="formatNumber(guestTotals.invitations)"
        :sub="`${formatNumber(guestTotals.sent)} sudah dikirim`"
      />
      <KpiCard
        label="Total orang"
        :value="formatNumber(guestTotals.pax)"
        :sub="`${formatNumber(guestTotals.declinedPax)} orang tidak hadir`"
      />
      <KpiCard
        label="Hadir (orang)"
        tone="success"
        :value="formatNumber(guestTotals.confirmedPax)"
        :sub="`${formatNumber(guestTotals.responded)} dari ${formatNumber(guestTotals.invitations)} undangan menjawab`"
      />
      <KpiCard
        label="Perkiraan porsi"
        :value="formatNumber(guestTotals.portions)"
        :sub="`Tamu yang diharapkan + cadangan ${buffer}%`"
      />
    </div>

    <p v-if="!canEdit" class="rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
      Kamu punya akses lihat saja. Minta pemilik mengubah peranmu agar bisa mengedit.
    </p>

    <!-- Quick add -->
    <BaseCard v-if="canEdit" class="p-4">
      <form
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
        novalidate
        aria-label="Tambah tamu cepat"
        @submit.prevent="quickAdd"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <label for="quick-guest-name" class="text-sm font-medium">Tambah cepat</label>
          <TextInput
            id="quick-guest-name"
            v-model="quickName"
            placeholder="Contoh: Keluarga Bpk. Hadi"
            autocomplete="off"
            :aria-invalid="!!quickError"
            aria-describedby="quick-guest-error"
          />
        </div>
        <div class="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 sm:contents">
          <div class="flex flex-col gap-1.5 sm:w-24">
            <label for="quick-guest-pax" class="text-sm font-medium">Orang</label>
            <TextInput
              id="quick-guest-pax"
              v-model="quickPax"
              placeholder="2"
              type="number"
              inputmode="numeric"
              min="1"
              max="50"
            />
          </div>
          <div class="flex min-w-0 flex-col gap-1.5 sm:w-44">
            <label for="quick-guest-side" class="text-sm font-medium">Pihak</label>
            <SelectInput
              id="quick-guest-side"
              v-model="quickSide"
              :options="sideOptions.slice(1)"
            />
          </div>
        </div>
        <BaseButton type="submit"> <Plus aria-hidden="true" /> Tambah </BaseButton>
      </form>
      <p id="quick-guest-error" class="mt-2 text-xs font-medium text-danger" aria-live="polite">
        {{ quickError }}
      </p>
    </BaseCard>

    <!-- Toolbar -->
    <div class="flex flex-col gap-3">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,11rem)]">
        <div class="relative min-w-0">
          <label for="guest-search" class="sr-only">Cari tamu</label>
          <Search
            class="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <TextInput
            id="guest-search"
            v-model="query"
            type="search"
            placeholder="Cari nama, grup, atau nomor"
            class="pl-9"
            autocomplete="off"
          />
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:contents">
          <SelectInput v-model="side" :options="sideOptions" aria-label="Filter pihak" />
          <SelectInput v-model="rsvp" :options="rsvpOptions" aria-label="Filter RSVP" />
          <SelectInput v-model="sent" :options="sentOptions" aria-label="Filter undangan" />
        </div>
      </div>
      <div v-if="chips.length" class="flex flex-wrap items-center gap-2">
        <button
          v-for="c in chips"
          :key="c.key"
          type="button"
          class="inline-flex h-8 items-center gap-1 rounded-full bg-primary-soft pr-2 pl-3 text-xs font-medium text-primary-strong hover:opacity-85 touch:h-10"
          :aria-label="`Hapus filter ${c.label}`"
          @click="c.clear()"
        >
          {{ c.label }} <X class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="h-8 px-2 text-xs font-medium text-fg-muted underline-offset-2 hover:underline touch:h-10"
          @click="clearFilters"
        >
          Hapus semua filter
        </button>
      </div>
      <p class="text-sm text-fg-muted" role="status" aria-live="polite">
        {{ formatNumber(filtered.length) }} undangan · {{ formatNumber(filteredPax) }} orang
      </p>
    </div>

    <ErrorState v-if="guests.isError.value" :error="guests.error.value" @retry="guests.refetch()" />
    <SkeletonRows v-else-if="guests.isPending.value" :rows="6" />
    <EmptyState
      v-else-if="!all.length"
      :icon="Users"
      title="Belum ada tamu"
      description="Masukkan undangan per keluarga atau per orang. Jumlah orang dipakai menghitung porsi katering."
    >
      <BaseButton v-if="canEdit" variant="primary" @click="openNew">
        <Plus aria-hidden="true" /> Tambah tamu pertama
      </BaseButton>
    </EmptyState>
    <EmptyState
      v-else-if="!filtered.length"
      :icon="Search"
      title="Tidak ada tamu yang cocok"
      description="Coba kata kunci lain atau hapus filter."
    >
      <BaseButton @click="clearFilters">Hapus semua filter</BaseButton>
    </EmptyState>

    <template v-else>
      <!-- Desktop table -->
      <BaseCard class="hidden overflow-hidden md:block">
        <div class="relative overflow-x-auto">
          <table class="w-full min-w-[56rem] text-sm">
            <caption class="sr-only">
              Daftar tamu
            </caption>
            <thead class="bg-bg-subtle text-left text-xs font-medium text-fg-muted">
              <tr>
                <th v-if="canEdit" scope="col" class="w-12 px-4 py-3">
                  <BaseCheckbox
                    :model-value="allSelected"
                    aria-label="Pilih semua tamu yang tampil"
                    @update:model-value="toggleAll"
                  />
                </th>
                <th scope="col" class="sticky left-0 z-10 bg-bg-subtle px-4 py-3">Nama</th>
                <th scope="col" class="px-4 py-3">Pihak</th>
                <th scope="col" class="px-4 py-3 text-right">Orang</th>
                <th scope="col" class="px-4 py-3">Undangan</th>
                <th scope="col" class="px-4 py-3">RSVP</th>
                <th scope="col" class="px-4 py-3 text-right">Angpao/kado</th>
                <th scope="col" class="w-24 px-4 py-3"><span class="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="g in filtered"
                :key="g.id"
                :class="selected.has(g.id) ? 'bg-primary-soft/40' : 'hover:bg-bg-subtle/60'"
              >
                <td v-if="canEdit" class="px-4 py-2">
                  <BaseCheckbox
                    :model-value="selected.has(g.id)"
                    :aria-label="`Pilih ${g.name}`"
                    @update:model-value="toggleOne(g.id, $event)"
                  />
                </td>
                <th
                  scope="row"
                  class="sticky left-0 z-10 max-w-64 bg-surface px-4 py-2 text-left font-normal"
                >
                  <button
                    v-if="canEdit"
                    type="button"
                    class="block min-h-6 max-w-full truncate text-left font-medium hover:underline"
                    @click="openEdit(g)"
                  >
                    {{ g.name }}
                  </button>
                  <span v-else class="block truncate font-medium">{{ g.name }}</span>
                  <span v-if="g.group_name" class="block truncate text-xs text-fg-muted">{{
                    g.group_name
                  }}</span>
                </th>
                <td class="px-4 py-2 whitespace-nowrap">{{ SIDE_LABEL[g.side] }}</td>
                <td class="px-4 py-2 text-right tabular-nums">{{ g.pax }}</td>
                <td class="px-4 py-2">
                  <label class="flex min-h-10 cursor-pointer items-center gap-2 whitespace-nowrap">
                    <BaseCheckbox
                      :model-value="g.invite_sent"
                      :disabled="!canEdit"
                      @update:model-value="setSent(g, $event)"
                    />
                    <span>
                      {{ g.invite_type === 'cetak' ? 'Cetak' : 'Digital' }}
                      <span class="text-fg-muted"
                        >· {{ g.invite_sent ? 'terkirim' : 'belum' }}</span
                      >
                    </span>
                  </label>
                </td>
                <td class="px-4 py-2">
                  <SelectInput
                    v-if="canEdit"
                    :model-value="g.rsvp"
                    :options="rsvpOptions.slice(1)"
                    :aria-label="`RSVP ${g.name}`"
                    class="w-36"
                    @update:model-value="setRsvp(g, $event)"
                  />
                  <StatusBadge v-else :tone="RSVP_TONE[g.rsvp]">{{
                    RSVP_LABEL[g.rsvp]
                  }}</StatusBadge>
                </td>
                <td class="px-4 py-2 text-right whitespace-nowrap tabular-nums">
                  <template v-if="g.gift_amount">
                    <span :title="formatRupiah(g.gift_amount)">{{
                      formatRupiahShort(g.gift_amount)
                    }}</span>
                    <span class="block text-xs text-fg-muted">{{
                      GIFT_CHANNEL_LABEL[g.gift_channel]
                    }}</span>
                  </template>
                  <span v-else-if="g.gift_channel === 'kado'">Kado</span>
                  <span v-else class="text-fg-muted">—</span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      v-if="waLink(g.phone)"
                      :href="waLink(g.phone) ?? undefined"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
                      :aria-label="`Chat WhatsApp ${g.name} (tab baru)`"
                      title="Chat WhatsApp"
                    >
                      <MessageCircle class="size-4" aria-hidden="true" />
                    </a>
                    <RowMenu v-if="canEdit" :label="`Aksi untuk ${g.name}`" :items="menuFor(g)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <!-- Phone cards -->
      <div class="flex flex-col gap-2 md:hidden">
        <label
          v-if="canEdit"
          class="flex min-h-11 cursor-pointer items-center gap-3 px-1 text-sm text-fg-muted"
        >
          <BaseCheckbox :model-value="allSelected" @update:model-value="toggleAll" />
          Pilih semua yang tampil
        </label>
        <BaseCard
          v-for="g in filtered"
          :key="g.id"
          as="article"
          :class="cn('p-4', selected.has(g.id) && 'border-primary bg-primary-soft/40')"
        >
          <div class="flex items-start gap-3">
            <BaseCheckbox
              v-if="canEdit"
              class="mt-0.5"
              :model-value="selected.has(g.id)"
              :aria-label="`Pilih ${g.name}`"
              @update:model-value="toggleOne(g.id, $event)"
            />
            <div class="min-w-0 flex-1">
              <h2 class="font-medium break-words">{{ g.name }}</h2>
              <p class="text-xs text-fg-muted">
                {{ SIDE_LABEL[g.side]
                }}<template v-if="g.group_name"> · {{ g.group_name }}</template> ·
                <span class="tabular-nums">{{ g.pax }}</span> orang
              </p>
            </div>
            <a
              v-if="waLink(g.phone)"
              :href="waLink(g.phone) ?? undefined"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle"
              :aria-label="`Chat WhatsApp ${g.name} (tab baru)`"
            >
              <MessageCircle class="size-5" aria-hidden="true" />
            </a>
            <RowMenu v-if="canEdit" :label="`Aksi untuk ${g.name}`" :items="menuFor(g)" />
          </div>
          <div class="mt-3 grid grid-cols-1 gap-3 xs:grid-cols-2">
            <label class="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <BaseCheckbox
                :model-value="g.invite_sent"
                :disabled="!canEdit"
                @update:model-value="setSent(g, $event)"
              />
              {{ g.invite_type === 'cetak' ? 'Cetak' : 'Digital' }} ·
              {{ g.invite_sent ? 'terkirim' : 'belum dikirim' }}
            </label>
            <SelectInput
              v-if="canEdit"
              :model-value="g.rsvp"
              :options="rsvpOptions.slice(1)"
              :aria-label="`RSVP ${g.name}`"
              @update:model-value="setRsvp(g, $event)"
            />
            <StatusBadge v-else :tone="RSVP_TONE[g.rsvp]">{{ RSVP_LABEL[g.rsvp] }}</StatusBadge>
          </div>
          <p v-if="g.gift_amount" class="mt-2 text-sm">
            Angpao/kado:
            <span class="font-medium tabular-nums">{{ formatRupiah(g.gift_amount) }}</span>
            <span class="text-fg-muted"> · {{ GIFT_CHANNEL_LABEL[g.gift_channel] }}</span>
          </p>
        </BaseCard>
      </div>

      <p v-if="guestTotals.gifts" class="text-right text-sm text-fg-muted">
        Total angpao tercatat:
        <span class="font-semibold text-fg tabular-nums">{{
          formatRupiah(guestTotals.gifts)
        }}</span>
      </p>
    </template>

    <!-- Bulk action bar -->
    <Transition
      enter-from-class="translate-y-4 opacity-0"
      enter-active-class="transition duration-200 ease-out-quart"
      leave-to-class="translate-y-4 opacity-0"
      leave-active-class="transition duration-150"
    >
      <div
        v-if="selected.size && canEdit"
        class="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-2 border-t border-border bg-surface-raised p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:sticky md:bottom-4 md:mx-auto md:w-fit md:rounded-lg md:border md:pb-3"
        role="region"
        aria-label="Aksi untuk tamu terpilih"
      >
        <p class="px-2 text-sm font-medium" aria-live="polite">{{ selected.size }} dipilih</p>
        <BaseButton size="sm" @click="markSent">Tandai undangan terkirim</BaseButton>
        <BaseButton size="sm" variant="danger-ghost" @click="removeSelected">
          Hapus {{ selected.size }} tamu
        </BaseButton>
        <BaseButton size="sm" variant="ghost" @click="selected = new Set()">Batal pilih</BaseButton>
      </div>
    </Transition>

    <GuestSheet
      v-model:open="sheetOpen"
      :guest="editing"
      :groups="groups"
      :event-options="eventOptions"
      :saving="insert.isPending.value || update.isPending.value"
      @save="save"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Receipt } from 'lucide-vue-next'
import PageHeader from '@/components/patterns/PageHeader.vue'
import KpiCard from '@/components/patterns/KpiCard.vue'
import EmptyState from '@/components/patterns/EmptyState.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import PaymentRow from '@/components/payments/PaymentRow.vue'
import PaymentSheet from '@/components/payments/PaymentSheet.vue'
import { useMarkPaid } from '@/components/payments/useMarkPaid'
import { useSummary } from '@/composables/useSummary'
import { useWorkspace } from '@/composables/useWorkspace'
import { formatNumber, formatRupiah, formatRupiahShort, toDate } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { Payment } from '@/types'

const { canEdit } = useWorkspace()
const { payments, vendors, categories, totals, paymentCategory } = useSummary()
const { setPaid, remove } = useMarkPaid()

type Filter = 'semua' | 'belum' | 'lunas'
const filter = ref<Filter>('belum')
const filters: { value: Filter; label: string }[] = [
  { value: 'belum', label: 'Belum lunas' },
  { value: 'lunas', label: 'Lunas' },
  { value: 'semua', label: 'Semua' },
]

const vendorName = computed(() => new Map((vendors.data.value ?? []).map((v) => [v.id, v.name])))
const categoryName = computed(
  () => new Map((categories.data.value ?? []).map((c) => [c.id, c.name])),
)

const all = computed(() => payments.data.value ?? [])
const counts = computed(() => ({
  semua: all.value.length,
  belum: all.value.filter((p) => !p.paid_at).length,
  lunas: all.value.filter((p) => p.paid_at).length,
}))

const monthFmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Grouped by month of due date (paid ones fall back to paid date), no-date group last. */
const groups = computed(() => {
  const list = all.value
    .filter((p) =>
      filter.value === 'semua' ? true : filter.value === 'lunas' ? !!p.paid_at : !p.paid_at,
    )
    .slice()
    .sort((a, b) =>
      (a.due_date ?? a.paid_at ?? '9999').localeCompare(b.due_date ?? b.paid_at ?? '9999'),
    )
  const map = new Map<string, Payment[]>()
  for (const p of list) {
    const date = p.due_date ?? p.paid_at
    const key = date ? date.slice(0, 7) : 'none'
    map.set(key, [...(map.get(key) ?? []), p])
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === 'none' ? 1 : b === 'none' ? -1 : a.localeCompare(b)))
    .map(([key, rows]) => ({
      key,
      label:
        key === 'none' ? 'Belum ada tanggal' : capitalize(monthFmt.format(toDate(`${key}-01`))),
      rows,
      total: sum(rows, (p) => p.amount),
    }))
})

const dueSoonTotal = computed(() => sum(totals.value.dueSoon, (p) => p.amount))
const overdueTotal = computed(() => sum(totals.value.overdue, (p) => p.amount))

const sheetOpen = ref(false)
const editing = ref<Payment | null>(null)
function openNew() {
  editing.value = null
  sheetOpen.value = true
}
function openEdit(p: Payment) {
  editing.value = p
  sheetOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Pembayaran"
      description="Jadwal DP, termin, dan pelunasan semua vendor, plus biaya lain seperti mahar dan KUA."
    >
      <template v-if="canEdit" #actions>
        <BaseButton variant="primary" @click="openNew">
          <Plus aria-hidden="true" />
          Tambah pembayaran
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!canEdit" class="rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
      Kamu punya akses lihat saja. Minta pemilik mengubah peranmu menjadi Editor untuk mencatat
      pembayaran.
    </p>

    <div class="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Sudah dibayar"
        :value="formatRupiahShort(totals.paid)"
        :title="formatRupiah(totals.paid)"
        :sub="formatRupiah(totals.paid)"
        tone="success"
      />
      <KpiCard
        label="Belum dibayar"
        :value="formatRupiahShort(totals.scheduledUnpaid)"
        :title="formatRupiah(totals.scheduledUnpaid)"
        :sub="`${formatNumber(counts.belum)} pembayaran terjadwal`"
      />
      <KpiCard
        label="Terlambat"
        :value="formatRupiahShort(overdueTotal)"
        :title="formatRupiah(overdueTotal)"
        :sub="`${formatNumber(totals.overdue.length)} lewat jatuh tempo`"
        :tone="totals.overdue.length ? 'danger' : 'default'"
      />
      <KpiCard
        label="Jatuh tempo 14 hari"
        :value="formatRupiahShort(dueSoonTotal)"
        :title="formatRupiah(dueSoonTotal)"
        :sub="`${formatNumber(totals.dueSoon.length)} pembayaran`"
        :tone="totals.dueSoon.length ? 'warning' : 'default'"
      />
    </div>

    <div
      class="relative flex w-full gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1 sm:w-fit"
      role="group"
      aria-label="Saring pembayaran"
    >
      <button
        v-for="f in filters"
        :key="f.value"
        type="button"
        :aria-pressed="filter === f.value"
        :class="[
          'flex h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap sm:flex-none touch:h-11',
          filter === f.value
            ? 'bg-primary-soft text-primary-strong'
            : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
        ]"
        @click="filter = f.value"
      >
        {{ f.label }}
        <span class="text-xs tabular-nums opacity-80">{{ formatNumber(counts[f.value]) }}</span>
      </button>
    </div>

    <ErrorState
      v-if="payments.isError.value"
      :error="payments.error.value"
      @retry="payments.refetch()"
    />
    <SkeletonRows v-else-if="payments.isPending.value" :rows="6" />
    <EmptyState
      v-else-if="!all.length"
      :icon="Receipt"
      title="Belum ada pembayaran"
      description="Buat jadwal termin dari halaman Vendor, atau catat pembayaran lain seperti mahar dan biaya nikah di luar KUA (Rp 600.000)."
    >
      <BaseButton v-if="canEdit" variant="primary" @click="openNew">
        <Plus aria-hidden="true" />
        Tambah pembayaran
      </BaseButton>
      <RouterLink
        to="/vendor"
        class="inline-flex h-11 items-center rounded-md px-4 text-sm font-medium text-primary-strong underline underline-offset-2"
        >Buka halaman Vendor</RouterLink
      >
    </EmptyState>
    <EmptyState
      v-else-if="!groups.length"
      :title="filter === 'lunas' ? 'Belum ada yang lunas' : 'Semua pembayaran sudah lunas'"
      :description="
        filter === 'lunas'
          ? 'Pembayaran yang ditandai lunas akan muncul di sini.'
          : 'Tidak ada tagihan tersisa.'
      "
    >
      <BaseButton @click="filter = 'semua'">Lihat semua pembayaran</BaseButton>
    </EmptyState>

    <div v-else class="flex flex-col gap-6">
      <BaseCard v-for="g in groups" :key="g.key" :aria-labelledby="`grp-${g.key}`">
        <header
          class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3 sm:px-5"
        >
          <h2 :id="`grp-${g.key}`" class="text-sm font-semibold">{{ g.label }}</h2>
          <p class="text-sm text-fg-muted tabular-nums">
            {{ formatNumber(g.rows.length) }} pembayaran · {{ formatRupiah(g.total) }}
          </p>
        </header>
        <ul class="divide-y divide-border">
          <PaymentRow
            v-for="p in g.rows"
            :key="p.id"
            :payment="p"
            :vendor-name="p.vendor_id ? vendorName.get(p.vendor_id) : null"
            :category-name="categoryName.get(paymentCategory(p) ?? '')"
            :can-edit="canEdit"
            @paid="setPaid(p, $event)"
            @edit="openEdit(p)"
            @remove="remove.mutate([p])"
          />
        </ul>
      </BaseCard>
    </div>

    <PaymentSheet
      v-model:open="sheetOpen"
      :payment="editing"
      :vendors="vendors.data.value ?? []"
      :categories="categories.data.value ?? []"
    />
  </div>
</template>

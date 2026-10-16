<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertTriangle, Plus, Search, Store } from 'lucide-vue-next'
import PageHeader from '@/components/patterns/PageHeader.vue'
import CategoryIcon from '@/components/patterns/CategoryIcon.vue'
import EmptyState from '@/components/patterns/EmptyState.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TextInput from '@/components/ui/TextInput.vue'
import VendorSheet from '@/components/vendors/VendorSheet.vue'
import { statusMeta, VENDOR_STATUS } from '@/components/vendors/vendorOptions'
import { useSummary } from '@/composables/useSummary'
import { useWorkspace } from '@/composables/useWorkspace'
import { daysUntil, formatDate, formatNumber, formatRupiah, relativeDays } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { Payment, Vendor } from '@/types'

const { canEdit, wedding } = useWorkspace()
const { vendors, payments, categories } = useSummary()

const search = ref('')
const status = ref('')
const category = ref('')

const statusOptions = [{ value: '', label: 'Semua status' }, ...VENDOR_STATUS]
const categoryOptions = computed(() => [
  { value: '', label: 'Semua kategori' },
  ...(categories.data.value ?? []).map((c) => ({ value: c.id, label: c.name })),
])
const categoryById = computed(() => new Map((categories.data.value ?? []).map((c) => [c.id, c])))

const paymentsByVendor = computed(() => {
  const map = new Map<string, Payment[]>()
  for (const p of payments.data.value ?? [])
    if (p.vendor_id) map.set(p.vendor_id, [...(map.get(p.vendor_id) ?? []), p])
  return map
})

const all = computed(() => vendors.data.value ?? [])
const hasFilters = computed(() => !!(search.value.trim() || status.value || category.value))

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return all.value
    .filter((v) => !status.value || v.status === status.value)
    .filter((v) => !category.value || v.category_id === category.value)
    .filter(
      (v) =>
        !q ||
        [v.name, v.contact_name, v.instagram, v.notes].some((s) => s.toLowerCase().includes(q)),
    )
    .map((v) => {
      const ps = paymentsByVendor.value.get(v.id) ?? []
      const next = ps
        .filter((p) => !p.paid_at && p.due_date)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0]
      return {
        vendor: v,
        category: v.category_id ? categoryById.value.get(v.category_id) : undefined,
        paid: sum(
          ps.filter((p) => p.paid_at),
          (p) => p.amount,
        ),
        next,
      }
    })
    .sort(
      (a, b) =>
        VENDOR_STATUS.findIndex((s) => s.value === b.vendor.status) -
          VENDOR_STATUS.findIndex((s) => s.value === a.vendor.status) ||
        a.vendor.name.localeCompare(b.vendor.name),
    )
})

const dealCount = computed(() => all.value.filter((v) => v.status === 'deal').length)
const contractSum = computed(() =>
  sum(
    all.value.filter((v) => v.status === 'deal'),
    (v) => v.contract_total,
  ),
)

function clearFilters() {
  search.value = ''
  status.value = ''
  category.value = ''
}

const sheetOpen = ref(false)
const selectedId = ref<string | null>(null)
const selected = computed<Vendor | null>(
  () => all.value.find((v) => v.id === selectedId.value) ?? null,
)
function openNew() {
  selectedId.value = null
  sheetOpen.value = true
}
function openVendor(v: Vendor) {
  selectedId.value = v.id
  sheetOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Vendor"
      description="Bandingkan vendor yang disurvei, catat kontrak yang deal, dan pantau pembayarannya."
    >
      <template v-if="canEdit" #actions>
        <BaseButton variant="primary" @click="openNew">
          <Plus aria-hidden="true" />
          Tambah vendor
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!canEdit" class="rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
      Kamu punya akses lihat saja. Minta pemilik mengubah peranmu menjadi Editor untuk mengubah
      vendor.
    </p>

    <div v-if="all.length" class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="relative min-w-0 lg:w-80">
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
          aria-hidden="true"
        />
        <TextInput
          v-model="search"
          type="search"
          class="pl-9"
          placeholder="Cari nama, kontak, catatan"
          aria-label="Cari vendor"
        />
      </div>
      <div class="grid grid-cols-2 gap-3 lg:flex">
        <SelectInput
          v-model="status"
          :options="statusOptions"
          aria-label="Saring status"
          class="lg:w-44"
        />
        <SelectInput
          v-model="category"
          :options="categoryOptions"
          aria-label="Saring kategori"
          class="lg:w-56"
        />
      </div>
      <p class="text-sm text-fg-muted tabular-nums lg:ml-auto" role="status">
        {{ formatNumber(dealCount) }} deal · kontrak {{ formatRupiah(contractSum) }}
      </p>
    </div>

    <ErrorState
      v-if="vendors.isError.value"
      :error="vendors.error.value"
      @retry="vendors.refetch()"
    />
    <SkeletonRows v-else-if="vendors.isPending.value" :rows="6" />
    <EmptyState
      v-else-if="!all.length"
      :icon="Store"
      title="Belum ada vendor"
      description="Catat vendor saat survei, lalu ubah statusnya menjadi Deal dan buat jadwal termin pembayaran."
    >
      <BaseButton v-if="canEdit" variant="primary" @click="openNew">
        <Plus aria-hidden="true" />
        Tambah vendor
      </BaseButton>
    </EmptyState>
    <EmptyState
      v-else-if="!rows.length && hasFilters"
      title="Tidak ada vendor yang cocok"
      description="Ubah kata kunci atau saringan."
    >
      <BaseButton @click="clearFilters">Hapus saringan</BaseButton>
    </EmptyState>

    <ul v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <li v-for="r in rows" :key="r.vendor.id">
        <button
          type="button"
          class="flex h-full w-full flex-col gap-4 rounded-lg border border-border bg-surface p-4 text-left hover:border-border-strong/70 hover:bg-bg-subtle/50 sm:p-5"
          :class="r.vendor.status === 'batal' && 'opacity-70'"
          @click="openVendor(r.vendor)"
        >
          <div class="flex w-full min-w-0 items-start gap-3">
            <CategoryIcon :name="r.category?.icon ?? 'wallet'" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ r.vendor.name }}</p>
              <p class="truncate text-xs text-fg-muted">
                {{ r.category?.name ?? 'Tanpa kategori' }}
              </p>
            </div>
            <StatusBadge :tone="statusMeta(r.vendor.status).tone">
              {{ statusMeta(r.vendor.status).label }}
            </StatusBadge>
          </div>

          <div class="flex w-full flex-col gap-2">
            <div class="flex items-baseline justify-between gap-3 text-sm">
              <span class="text-fg-muted">Kontrak</span>
              <span class="font-semibold tabular-nums">
                {{ r.vendor.contract_total ? formatRupiah(r.vendor.contract_total) : '—' }}
              </span>
            </div>
            <template v-if="r.vendor.contract_total">
              <ProgressBar
                :value="r.paid"
                :max="r.vendor.contract_total"
                tone="success"
                :label="`${r.vendor.name}: dibayar ${formatRupiah(r.paid)} dari ${formatRupiah(r.vendor.contract_total)}`"
              />
              <p class="text-xs text-fg-muted tabular-nums">Dibayar {{ formatRupiah(r.paid) }}</p>
            </template>
          </div>

          <p
            class="mt-auto w-full border-t border-border pt-3 text-xs"
            :class="r.next ? 'text-fg' : 'text-fg-muted'"
          >
            <template v-if="r.next">
              Berikutnya: <span class="font-medium">{{ r.next.label }}</span>
              {{ formatRupiah(r.next.amount) }} · {{ formatDate(r.next.due_date) }} ({{
                relativeDays(r.next.due_date)
              }})
              <span
                v-if="(daysUntil(r.next.due_date) ?? 0) < 0"
                class="ml-1 inline-flex items-center gap-1 font-semibold text-danger"
              >
                <AlertTriangle class="size-3.5" aria-hidden="true" />
                Terlambat
              </span>
            </template>
            <template v-else-if="r.vendor.contact_name"
              >Kontak: {{ r.vendor.contact_name }}</template
            >
            <template v-else>Belum ada jadwal pembayaran</template>
          </p>
        </button>
      </li>
    </ul>

    <VendorSheet
      v-model:open="sheetOpen"
      :vendor="selected"
      :vendors="all"
      :categories="categories.data.value ?? []"
      :payments="selected ? (paymentsByVendor.get(selected.id) ?? []) : []"
      :wedding-date="wedding?.wedding_date ?? null"
      :can-edit="canEdit"
      @created="selectedId = $event.id"
      @deleted="selectedId = null"
    />
  </div>
</template>

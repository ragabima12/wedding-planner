<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, Pencil, Plus, Wand2, Wallet } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import EmptyState from '@/components/patterns/EmptyState.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import KpiCard from '@/components/patterns/KpiCard.vue'
import PageHeader from '@/components/patterns/PageHeader.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import CategoryCard from '@/components/budget/CategoryCard.vue'
import CategoryDialog from '@/components/budget/CategoryDialog.vue'
import { useRowMutations, useRows } from '@/composables/useRows'
import { useSummary } from '@/composables/useSummary'
import { useWorkspace } from '@/composables/useWorkspace'
import { toast } from '@/composables/useToast'
import { CATEGORY_TEMPLATES, EVENT_KINDS } from '@/data/templates'
import { formatRupiah, formatRupiahShort, percent } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { Category } from '@/types'

const { canEdit, updateWedding } = useWorkspace()
const { wedding, byCategory, totals, items, isPending, error, refetch } = useSummary()
const events = useRows('events')
const vendors = useRows('vendors')
const catMut = useRowMutations('budget_categories', 'Kategori', { undo: false })
const itemMut = useRowMutations('budget_items', 'Rincian')

const expanded = ref<Set<string>>(new Set())
function setOpen(id: string, v: boolean) {
  const next = new Set(expanded.value)
  if (v) next.add(id)
  else next.delete(id)
  expanded.value = next
}
const allOpen = computed(
  () =>
    byCategory.value.length > 0 && byCategory.value.every((c) => expanded.value.has(c.category.id)),
)
function toggleAll() {
  expanded.value = allOpen.value ? new Set() : new Set(byCategory.value.map((c) => c.category.id))
}

const eventOptions = computed(() => [
  { value: '', label: 'Umum' },
  ...(events.data.value ?? []).map((e) => ({
    value: e.id,
    label: e.name || EVENT_KINDS[e.kind] || e.kind,
  })),
])
const vendorOptions = computed(() => [
  { value: '', label: 'Tanpa vendor' },
  ...(vendors.data.value ?? [])
    .filter((v) => v.status !== 'batal')
    .map((v) => ({ value: v.id, label: v.name })),
])

const itemsByCategory = computed(() => {
  const map = new Map<string, NonNullable<typeof items.data.value>>()
  for (const i of items.data.value ?? []) {
    const list = map.get(i.category_id) ?? []
    list.push(i)
    map.set(i.category_id, list)
  }
  return map
})

// --- total budget
const totalOpen = ref(false)
const totalDraft = ref<number | null>(null)
function openTotal() {
  totalDraft.value = wedding.value?.total_budget ?? null
  totalOpen.value = true
}
function saveTotal() {
  updateWedding.mutate(
    { total_budget: totalDraft.value ?? 0 },
    { onSuccess: () => toast({ title: 'Total anggaran disimpan', tone: 'success' }) },
  )
  totalOpen.value = false
}

// --- category dialog
const dialogOpen = ref(false)
const editing = ref<Category | null>(null)
function openCategory(c: Category | null) {
  editing.value = c
  dialogOpen.value = true
}
function saveCategory(v: { name: string; icon: string; allocated: number; notes: string }) {
  if (editing.value) catMut.update.mutate({ id: editing.value.id, patch: v })
  else
    catMut.insert.mutate([{ ...v, sort: byCategory.value.length }], {
      onSuccess: ([c]) => c && setOpen(c.id, true),
    })
  dialogOpen.value = false
}

const toDelete = ref<Category | null>(null)
const deleteCount = computed(() =>
  toDelete.value ? (itemsByCategory.value.get(toDelete.value.id)?.length ?? 0) : 0,
)
function confirmDelete() {
  const c = toDelete.value
  if (!c) return
  catMut.remove.mutate([c], {
    onSettled: () => items.refetch(),
  })
  toDelete.value = null
}

// --- auto allocate with research-based percentages
const autoOpen = ref(false)
const suggestion = computed(() => {
  const total = wedding.value?.total_budget ?? 0
  return byCategory.value.map(({ category }) => {
    const t = CATEGORY_TEMPLATES.find((x) => x.name === category.name)
    return {
      category,
      pct: t?.pct ?? null,
      allocated: t ? Math.round((total * t.pct) / 100 / 100_000) * 100_000 : category.allocated,
    }
  })
})
function applyAuto() {
  for (const s of suggestion.value)
    if (s.pct !== null && s.allocated !== s.category.allocated)
      catMut.update.mutate({ id: s.category.id, patch: { allocated: s.allocated } })
  autoOpen.value = false
  toast({ title: 'Anggaran dibagi sesuai saran', tone: 'success' })
}

function exportCsv() {
  const rows = [['Kategori', 'Rincian', 'Estimasi', 'Harga final', 'Anggaran kategori']]
  for (const { category } of byCategory.value)
    for (const i of itemsByCategory.value.get(category.id) ?? [])
      rows.push([
        category.name,
        i.name,
        String(i.estimated),
        String(i.actual ?? ''),
        String(category.allocated),
      ])
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: 'anggaran-pernikahan.csv',
  })
  a.click()
  URL.revokeObjectURL(url)
}

const usedPct = computed(() => percent(totals.value.projected, totals.value.budget))
const contingency = computed(() => {
  const c = byCategory.value.find((x) => x.category.icon === 'shield')
  return c ? c.category.allocated : 0
})
const suggestedContingency = computed(
  () => ((wedding.value?.total_budget ?? 0) * (wedding.value?.contingency_pct ?? 10)) / 100,
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Anggaran"
      description="Atur batas per kategori, catat estimasi, lalu isi harga final saat sudah deal dengan vendor."
    >
      <template #actions>
        <BaseButton v-if="byCategory.length" @click="exportCsv">
          <Download aria-hidden="true" />
          Ekspor CSV
        </BaseButton>
        <BaseButton v-if="canEdit" variant="primary" @click="openCategory(null)">
          <Plus aria-hidden="true" />
          Tambah kategori
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!canEdit" class="rounded-md bg-info-soft px-4 py-3 text-sm text-fg">
      Kamu punya akses lihat saja. Minta pemilik rencana mengubah peranmu menjadi Editor untuk
      mengubah anggaran.
    </p>

    <div class="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
      <div class="relative">
        <KpiCard
          label="Total anggaran"
          :value="formatRupiah(totals.budget)"
          :sub="totals.budget ? undefined : 'Belum diisi'"
        />
        <button
          v-if="canEdit"
          type="button"
          class="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg touch:size-11"
          aria-label="Ubah total anggaran"
          title="Ubah total anggaran"
          @click="openTotal"
        >
          <Pencil class="size-4" aria-hidden="true" />
        </button>
      </div>
      <KpiCard
        label="Sudah dialokasikan"
        :value="formatRupiah(totals.allocated)"
        :tone="totals.unallocated < 0 ? 'danger' : 'default'"
        :sub="
          totals.unallocated >= 0
            ? `Sisa belum dialokasikan ${formatRupiahShort(totals.unallocated)}`
            : `Lebih ${formatRupiahShort(-totals.unallocated)} dari total`
        "
      />
      <KpiCard
        label="Proyeksi biaya"
        :value="formatRupiah(totals.projected)"
        :sub="totals.budget ? `${usedPct}% dari total anggaran` : 'Estimasi + harga final'"
      />
      <KpiCard
        label="Sisa anggaran"
        :value="formatRupiah(totals.remaining)"
        :tone="totals.remaining < 0 ? 'danger' : 'success'"
        :sub="totals.remaining < 0 ? 'Proyeksi melebihi anggaran' : 'Total dikurangi proyeksi'"
      />
    </div>

    <div
      v-if="canEdit && totals.budget > 0"
      class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center"
    >
      <Wand2 class="size-5 shrink-0 text-primary-strong" aria-hidden="true" />
      <p class="min-w-0 flex-1 text-sm text-pretty">
        Bingung membagi? Gunakan pembagian umum pernikahan di Indonesia: katering ±33%, venue ±14%,
        dekorasi ±11%, dana cadangan 10%.
        <span v-if="contingency < suggestedContingency" class="text-fg-muted">
          Dana cadanganmu saat ini {{ formatRupiahShort(contingency) }}, saran
          {{ formatRupiahShort(suggestedContingency) }}.
        </span>
      </p>
      <BaseButton @click="autoOpen = true">Lihat pembagian saran</BaseButton>
    </div>

    <SkeletonRows v-if="isPending" :rows="6" />
    <ErrorState v-else-if="error" :error="error" @retry="refetch" />
    <EmptyState
      v-else-if="!byCategory.length"
      :icon="Wallet"
      title="Belum ada kategori anggaran"
      description="Kategori mengelompokkan biaya, misalnya katering, venue, dan busana."
    >
      <BaseButton v-if="canEdit" variant="primary" @click="openCategory(null)">
        <Plus aria-hidden="true" />
        Tambah kategori
      </BaseButton>
    </EmptyState>

    <section v-else aria-labelledby="cat-heading" class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 id="cat-heading" class="text-sm font-semibold text-fg-muted">
          {{ byCategory.length }} kategori · {{ sum(byCategory, (c) => c.itemCount) }} rincian
        </h2>
        <BaseButton variant="ghost" size="sm" @click="toggleAll">
          {{ allOpen ? 'Tutup semua' : 'Buka semua' }}
        </BaseButton>
      </div>
      <CategoryCard
        v-for="s in byCategory"
        :key="s.category.id"
        :open="expanded.has(s.category.id)"
        :summary="s"
        :items="itemsByCategory.get(s.category.id) ?? []"
        :event-options="eventOptions"
        :vendor-options="vendorOptions"
        :readonly="!canEdit"
        @update:open="(v) => setOpen(s.category.id, v)"
        @edit="openCategory(s.category)"
        @remove="toDelete = s.category"
        @add-item="
          (name) =>
            itemMut.insert.mutate([
              {
                category_id: s.category.id,
                event_id: null,
                vendor_id: null,
                name,
                estimated: 0,
                actual: null,
                notes: '',
                sort: s.itemCount,
              },
            ])
        "
        @update-item="(id, patch) => itemMut.update.mutate({ id, patch })"
        @remove-item="(item) => itemMut.remove.mutate([item])"
      />
    </section>

    <CategoryDialog
      v-model:open="dialogOpen"
      :category="editing"
      :saving="catMut.insert.isPending.value"
      @save="saveCategory"
    />

    <ConfirmDialog
      :open="!!toDelete"
      :title="`Hapus kategori ${toDelete?.name}?`"
      :description="`Kategori dan ${deleteCount} rincian di dalamnya akan dihapus permanen. Pembayaran dan vendor tetap ada, tapi tidak lagi punya kategori.`"
      confirm-label="Hapus kategori"
      @update:open="(v) => !v && (toDelete = null)"
      @confirm="confirmDelete"
    />

    <BaseDialog v-model:open="totalOpen" title="Ubah total anggaran" size="sm">
      <form id="total-form" @submit.prevent="saveTotal">
        <FormField v-slot="f" label="Total anggaran" hint="Boleh ketik 150jt atau 1,2M.">
          <MoneyInput
            :id="f.id"
            v-model="totalDraft"
            placeholder="Contoh: 150jt"
            :aria-describedby="f.describedby"
          />
        </FormField>
      </form>
      <template #footer>
        <BaseButton @click="totalOpen = false">Batal</BaseButton>
        <BaseButton type="submit" form="total-form" variant="primary">Simpan total</BaseButton>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model:open="autoOpen"
      title="Pembagian anggaran saran"
      description="Berdasarkan rata-rata pernikahan di Indonesia 2025–2026. Kategori buatanmu sendiri tidak diubah."
      size="md"
    >
      <table class="w-full text-sm">
        <caption class="sr-only">
          Perbandingan anggaran saat ini dan saran
        </caption>
        <thead class="text-left text-xs text-fg-muted">
          <tr>
            <th scope="col" class="pb-2 font-medium">Kategori</th>
            <th scope="col" class="pb-2 text-right font-medium">Saran</th>
            <th scope="col" class="pb-2 text-right font-medium">Saat ini</th>
            <th scope="col" class="pb-2 text-right font-medium">Menjadi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in suggestion" :key="s.category.id" class="border-t border-border">
            <th scope="row" class="py-2 pr-2 text-left font-medium">{{ s.category.name }}</th>
            <td class="py-2 text-right text-fg-muted tabular-nums">
              {{ s.pct === null ? '—' : `${s.pct}%` }}
            </td>
            <td class="py-2 text-right whitespace-nowrap tabular-nums">
              {{ formatRupiahShort(s.category.allocated) }}
            </td>
            <td class="py-2 text-right font-medium whitespace-nowrap tabular-nums">
              {{ formatRupiahShort(s.allocated) }}
            </td>
          </tr>
        </tbody>
      </table>
      <template #footer>
        <BaseButton @click="autoOpen = false">Batal</BaseButton>
        <BaseButton variant="primary" @click="applyAuto">Terapkan pembagian</BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertTriangle,
  ArrowRight,
  CalendarHeart,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import KpiCard from '@/components/patterns/KpiCard.vue'
import PageHeader from '@/components/patterns/PageHeader.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import BudgetBars from '@/components/overview/BudgetBars.vue'
import { useRows } from '@/composables/useRows'
import { useSummary, paymentState, PAYMENT_STATE_LABEL } from '@/composables/useSummary'
import { auth } from '@/lib/auth'
import {
  daysUntil,
  formatDate,
  formatNumber,
  formatRupiah,
  formatRupiahShort,
  percent,
  relativeDays,
} from '@/lib/format'

const {
  wedding,
  byCategory,
  totals,
  guestTotals,
  taskTotals,
  payments,
  vendors,
  isPending,
  error,
  refetch,
} = useSummary()
const events = useRows('events')

const firstName = computed(() => auth.me?.name.split(' ')[0] ?? '')
const days = computed(() => daysUntil(wedding.value?.wedding_date))

const setup = computed(() => [
  { done: !!wedding.value?.wedding_date, label: 'Tentukan tanggal akad', to: '/pengaturan' },
  { done: totals.value.budget > 0, label: 'Isi total anggaran', to: '/anggaran' },
  { done: totals.value.projected > 0, label: 'Catat estimasi biaya pertama', to: '/anggaran' },
  {
    done: (vendors.data.value?.length ?? 0) > 0,
    label: 'Tambah vendor yang disurvei',
    to: '/vendor',
  },
  { done: guestTotals.value.invitations > 0, label: 'Mulai daftar tamu', to: '/tamu' },
])
const setupDone = computed(() => setup.value.filter((s) => s.done).length)

const vendorName = computed(() => new Map((vendors.data.value ?? []).map((v) => [v.id, v.name])))
const nextPayments = computed(() =>
  (payments.data.value ?? [])
    .filter((p) => !p.paid_at)
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    .slice(0, 5),
)

const nextEvents = computed(() =>
  (events.data.value ?? []).filter((e) => (daysUntil(e.date) ?? 0) >= 0).slice(0, 4),
)

const stateTone = {
  lunas: 'success',
  terlambat: 'danger',
  segera: 'warning',
  terjadwal: 'neutral',
  'tanpa-tanggal': 'neutral',
} as const
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      :title="firstName ? `Halo, ${firstName}` : 'Ringkasan'"
      :description="
        wedding?.wedding_date
          ? `${wedding.name} · ${formatDate(wedding.wedding_date, 'day')}${wedding.city ? ` · ${wedding.city}` : ''}`
          : `${wedding?.name}. Tanggal akad belum ditentukan.`
      "
    >
      <template #actions>
        <RouterLink
          to="/anggaran"
          class="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover touch:h-11"
        >
          Buka anggaran
          <ArrowRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </template>
    </PageHeader>

    <SkeletonRows v-if="isPending" :rows="6" />
    <ErrorState v-else-if="error" :error="error" @retry="refetch" />

    <template v-else>
      <!-- Alerts -->
      <div
        v-if="totals.overdue.length"
        role="alert"
        class="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center"
      >
        <AlertTriangle class="size-5 shrink-0 text-danger" aria-hidden="true" />
        <p class="min-w-0 flex-1 text-sm">
          <strong class="font-semibold text-danger">
            {{ totals.overdue.length }} pembayaran terlambat
          </strong>
          senilai {{ formatRupiah(totals.overdue.reduce((s, p) => s + p.amount, 0)) }}. Hubungi
          vendor agar tanggal acara tetap aman.
        </p>
        <RouterLink
          to="/pembayaran"
          class="inline-flex h-10 items-center rounded-md border border-danger/40 bg-surface px-4 text-sm font-medium text-danger hover:bg-danger-soft"
          >Lihat pembayaran</RouterLink
        >
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 gap-3 xs:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Menuju hari H"
          :value="
            days === null
              ? '—'
              : days > 0
                ? `${formatNumber(days)} hari`
                : days === 0
                  ? 'Hari ini'
                  : 'Selesai'
          "
          :sub="
            wedding?.wedding_date
              ? formatDate(wedding.wedding_date, 'long')
              : 'Atur tanggal di Pengaturan'
          "
        />
        <KpiCard
          label="Proyeksi biaya"
          :value="formatRupiahShort(totals.projected)"
          :title="formatRupiah(totals.projected)"
          :tone="totals.budget && totals.projected > totals.budget ? 'danger' : 'default'"
          :sub="
            totals.budget
              ? `${percent(totals.projected, totals.budget)}% dari anggaran ${formatRupiahShort(totals.budget)}`
              : 'Total anggaran belum diisi'
          "
        />
        <KpiCard
          label="Sisa anggaran"
          :value="formatRupiahShort(totals.remaining)"
          :title="formatRupiah(totals.remaining)"
          :tone="totals.remaining < 0 ? 'danger' : 'success'"
          :sub="
            totals.remaining < 0 ? 'Proyeksi melebihi anggaran' : 'Setelah semua proyeksi biaya'
          "
        />
        <KpiCard
          label="Sudah dibayar"
          :value="formatRupiahShort(totals.paid)"
          :title="formatRupiah(totals.paid)"
          :sub="`Belum dibayar terjadwal ${formatRupiahShort(totals.scheduledUnpaid)}`"
        />
      </div>

      <!-- Setup checklist (Zeigarnik) -->
      <BaseCard v-if="setupDone < setup.length" class="p-4 sm:p-5">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-semibold">Langkah awal</h2>
          <p class="text-sm text-fg-muted tabular-nums">
            {{ setupDone }} dari {{ setup.length }} selesai
          </p>
        </div>
        <ProgressBar
          class="mt-3"
          :value="setupDone"
          :max="setup.length"
          tone="success"
          label="Progres langkah awal"
        />
        <ul class="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="s in setup" :key="s.label">
            <RouterLink
              :to="s.to"
              class="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-bg-subtle"
            >
              <CheckCircle2 v-if="s.done" class="size-5 shrink-0 text-success" aria-hidden="true" />
              <Circle v-else class="size-5 shrink-0 text-border-strong" aria-hidden="true" />
              <span :class="s.done && 'text-fg-muted line-through'">{{ s.label }}</span>
              <span class="sr-only">{{ s.done ? '(selesai)' : '(belum)' }}</span>
            </RouterLink>
          </li>
        </ul>
      </BaseCard>

      <div class="grid gap-6 xl:grid-cols-3">
        <!-- Budget by category -->
        <BaseCard class="p-4 sm:p-5 xl:col-span-2">
          <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-semibold">Biaya per kategori</h2>
            <RouterLink
              to="/anggaran"
              class="-my-2.5 inline-flex min-h-11 items-center text-sm font-medium text-primary-strong hover:underline"
              >Detail anggaran</RouterLink
            >
          </div>
          <BudgetBars :rows="byCategory" />
        </BaseCard>

        <div class="flex flex-col gap-6">
          <!-- Guests -->
          <BaseCard class="p-4 sm:p-5">
            <div class="flex items-baseline justify-between gap-2">
              <h2 class="font-semibold">Tamu</h2>
              <RouterLink
                to="/tamu"
                class="-my-2.5 inline-flex min-h-11 items-center text-sm font-medium text-primary-strong hover:underline"
                >Daftar tamu</RouterLink
              >
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt class="text-xs text-fg-muted">Undangan</dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatNumber(guestTotals.invitations) }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-fg-muted">Total orang</dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatNumber(guestTotals.pax) }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-fg-muted">Konfirmasi hadir</dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatNumber(guestTotals.confirmedPax) }}
                  <span class="text-xs font-normal text-fg-muted">orang</span>
                </dd>
              </div>
              <div>
                <dt class="text-xs text-fg-muted">Perkiraan porsi katering</dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatNumber(guestTotals.portions) }}
                </dd>
              </div>
            </dl>
            <p class="mt-3 text-xs text-fg-muted">
              Porsi = perkiraan hadir + cadangan {{ wedding?.catering_buffer_pct ?? 10 }}%.
              {{ guestTotals.sent }} dari {{ guestTotals.invitations }} undangan sudah dikirim.
            </p>
          </BaseCard>

          <!-- Checklist -->
          <BaseCard class="p-4 sm:p-5">
            <div class="flex items-baseline justify-between gap-2">
              <h2 class="font-semibold">Checklist</h2>
              <RouterLink
                to="/checklist"
                class="-my-2.5 inline-flex min-h-11 items-center text-sm font-medium text-primary-strong hover:underline"
                >Semua tugas</RouterLink
              >
            </div>
            <p class="mt-3 text-sm tabular-nums">
              <strong>{{ taskTotals.done }}</strong> dari {{ taskTotals.total }} tugas selesai
              <span v-if="taskTotals.overdue.length" class="text-danger">
                · {{ taskTotals.overdue.length }} terlambat</span
              >
            </p>
            <ProgressBar
              class="mt-2"
              :value="taskTotals.done"
              :max="taskTotals.total || 1"
              tone="success"
              label="Progres checklist"
            />
            <ul v-if="taskTotals.upcoming.length" class="mt-4 flex flex-col gap-2">
              <li
                v-for="t in taskTotals.upcoming"
                :key="t.id"
                class="flex items-start gap-2 text-sm"
              >
                <Clock
                  :class="[
                    'mt-0.5 size-4 shrink-0',
                    (daysUntil(t.due_date) ?? 0) < 0 ? 'text-danger' : 'text-fg-muted',
                  ]"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1">{{ t.title }}</span>
                <span
                  :class="[
                    'shrink-0 text-xs whitespace-nowrap',
                    (daysUntil(t.due_date) ?? 0) < 0 ? 'font-medium text-danger' : 'text-fg-muted',
                  ]"
                  >{{ relativeDays(t.due_date) }}</span
                >
              </li>
            </ul>
          </BaseCard>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Next payments -->
        <BaseCard class="p-4 sm:p-5">
          <div class="flex items-baseline justify-between gap-2">
            <h2 class="font-semibold">Pembayaran berikutnya</h2>
            <RouterLink
              to="/pembayaran"
              class="-my-2.5 inline-flex min-h-11 items-center text-sm font-medium text-primary-strong hover:underline"
              >Jadwal lengkap</RouterLink
            >
          </div>
          <ul v-if="nextPayments.length" class="mt-3 divide-y divide-border">
            <li v-for="p in nextPayments" :key="p.id" class="flex items-center gap-3 py-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">
                  {{ p.vendor_id ? vendorName.get(p.vendor_id) : p.label }}
                </p>
                <p class="truncate text-xs text-fg-muted">
                  {{ p.vendor_id ? p.label : 'Tanpa vendor' }} · {{ formatDate(p.due_date) }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span class="text-sm font-medium whitespace-nowrap tabular-nums">{{
                  formatRupiah(p.amount)
                }}</span>
                <StatusBadge :tone="stateTone[paymentState(p)]">
                  {{ PAYMENT_STATE_LABEL[paymentState(p)] }}
                </StatusBadge>
              </div>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-fg-muted">
            Belum ada jadwal pembayaran. Buat jadwal termin dari halaman Vendor.
          </p>
        </BaseCard>

        <!-- Upcoming events -->
        <BaseCard class="p-4 sm:p-5">
          <div class="flex items-baseline justify-between gap-2">
            <h2 class="font-semibold">Acara mendatang</h2>
            <RouterLink
              to="/acara"
              class="-my-2.5 inline-flex min-h-11 items-center text-sm font-medium text-primary-strong hover:underline"
              >Semua acara</RouterLink
            >
          </div>
          <ol v-if="nextEvents.length" class="mt-3 flex flex-col gap-3">
            <li v-for="e in nextEvents" :key="e.id" class="flex items-start gap-3">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong"
                aria-hidden="true"
              >
                <CalendarHeart class="size-[18px]" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">{{ e.name }}</p>
                <p class="text-xs text-fg-muted">
                  {{
                    e.date
                      ? `${formatDate(e.date, 'day')} · ${relativeDays(e.date)}`
                      : 'Tanggal belum ditentukan'
                  }}
                  <template v-if="e.venue"> · {{ e.venue }}</template>
                </p>
              </div>
            </li>
          </ol>
          <p v-else class="mt-3 text-sm text-fg-muted">Belum ada acara terjadwal.</p>
        </BaseCard>
      </div>
    </template>
  </div>
</template>

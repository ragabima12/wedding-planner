<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import type { CategorySummary } from '@/composables/useSummary'
import { formatRupiah, formatRupiahShort } from '@/lib/format'

/**
 * Bullet-style bars: fill = projected cost, tick = category budget.
 * One hue for magnitude; over-budget switches to the danger status color + icon + text.
 */
const { rows } = defineProps<{ rows: CategorySummary[] }>()

const visible = computed(() =>
  rows
    .filter((r) => r.category.allocated > 0 || r.projected > 0)
    .sort(
      (a, b) =>
        Math.max(b.projected, b.category.allocated) - Math.max(a.projected, a.category.allocated),
    ),
)
const scale = computed(() =>
  Math.max(1, ...visible.value.map((r) => Math.max(r.projected, r.category.allocated))),
)
const pct = (v: number) => `${(v / scale.value) * 100}%`
</script>

<template>
  <div>
    <div
      class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted"
      aria-hidden="true"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-4 rounded-sm bg-primary" /> Proyeksi biaya
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-3 w-0.5 bg-fg" /> Batas anggaran
      </span>
    </div>
    <ul class="flex flex-col gap-3">
      <li
        v-for="r in visible"
        :key="r.category.id"
        class="grid grid-cols-1 gap-1 sm:grid-cols-[11rem_1fr_11.5rem] sm:items-center sm:gap-3"
      >
        <span class="truncate text-sm font-medium" :title="r.category.name">{{
          r.category.name
        }}</span>
        <span
          class="relative h-3 rounded-full bg-bg-subtle ring-1 ring-border ring-inset"
          role="img"
          :aria-label="`${r.category.name}: proyeksi ${formatRupiah(r.projected)} dari anggaran ${formatRupiah(r.category.allocated)}`"
        >
          <span
            :class="[
              'absolute inset-y-0 left-0 rounded-full',
              r.category.allocated && r.projected > r.category.allocated
                ? 'bg-danger'
                : 'bg-primary',
            ]"
            :style="{ width: pct(r.projected) }"
          />
          <span
            v-if="r.category.allocated"
            class="absolute -inset-y-1 w-0.5 rounded-full bg-fg"
            :style="{ left: `calc(${pct(r.category.allocated)} - 1px)` }"
          />
        </span>
        <span
          :class="[
            'flex items-center gap-1 text-sm whitespace-nowrap tabular-nums sm:justify-end',
            r.category.allocated && r.projected > r.category.allocated
              ? 'font-medium text-danger'
              : 'text-fg-muted',
          ]"
        >
          <AlertTriangle
            v-if="r.category.allocated && r.projected > r.category.allocated"
            class="size-3.5"
            aria-hidden="true"
          />
          {{ formatRupiahShort(r.projected) }}
          <span class="text-fg-muted">/ {{ formatRupiahShort(r.category.allocated) }}</span>
        </span>
      </li>
    </ul>
    <p v-if="!visible.length" class="py-6 text-center text-sm text-fg-muted">
      Isi anggaran atau estimasi biaya di halaman Anggaran untuk melihat grafik ini.
    </p>
  </div>
</template>

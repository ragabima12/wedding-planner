<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ListChecks, Plus, Search, User } from 'lucide-vue-next'
import PageHeader from '@/components/patterns/PageHeader.vue'
import EmptyState from '@/components/patterns/EmptyState.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import RowMenu from '@/components/patterns/RowMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TaskSheet from '@/components/checklist/TaskSheet.vue'
import { useRowMutations, useRows } from '@/composables/useRows'
import { useWorkspace } from '@/composables/useWorkspace'
import { PHASES, TASK_CATEGORIES } from '@/data/templates'
import { auth } from '@/lib/auth'
import { daysUntil, formatDate, percent, relativeDays } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NewRow, Task } from '@/types'

const { canEdit, wedding, members } = useWorkspace()
const tasks = useRows('tasks')
const { insert, update, remove } = useRowMutations('tasks', 'Tugas')

const status = ref<'semua' | 'belum' | 'selesai'>('belum')
const category = ref('')
const mine = ref(false)

const all = computed(() => tasks.data.value ?? [])
const doneCount = computed(() => all.value.filter((t) => t.done).length)
const progress = computed(() => percent(doneCount.value, all.value.length))

const myName = computed(() => auth.me?.name.trim().toLowerCase() ?? '')
const isMine = (t: Task) => {
  const a = t.assignee.trim().toLowerCase()
  return !!a && !!myName.value && (a === myName.value || myName.value.startsWith(a))
}
const hasMine = computed(() => all.value.some(isMine))

const filtered = computed(() =>
  all.value.filter((t) => {
    if (status.value === 'belum' && t.done) return false
    if (status.value === 'selesai' && !t.done) return false
    if (category.value && t.category !== category.value) return false
    if (mine.value && !isMine(t)) return false
    return true
  }),
)
const hasFilters = computed(() => status.value !== 'semua' || !!category.value || mine.value)
function clearFilters() {
  status.value = 'semua'
  category.value = ''
  mine.value = false
}

const groups = computed(() =>
  PHASES.map((p) => {
    const inPhase = all.value.filter((t) => (t.phase || 'lainnya') === p.value)
    const visible = filtered.value
      .filter((t) => (t.phase || 'lainnya') === p.value)
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          (a.due_date ?? '9').localeCompare(b.due_date ?? '9') ||
          a.sort - b.sort,
      )
    return {
      ...p,
      tasks: visible,
      total: inPhase.length,
      done: inPhase.filter((t) => t.done).length,
    }
  }).filter((g) => g.tasks.length),
)

// Finished phases start collapsed so attention goes to open work (Zeigarnik).
const collapsed = ref<Set<string>>(new Set())
const expanded = ref<Set<string>>(new Set())
function isOpen(g: { value: string; done: number; total: number }) {
  if (expanded.value.has(g.value)) return true
  if (collapsed.value.has(g.value)) return false
  return g.done < g.total || status.value === 'selesai'
}
function toggleGroup(g: { value: string; done: number; total: number }) {
  const open = isOpen(g)
  const c = new Set(collapsed.value)
  const e = new Set(expanded.value)
  if (open) {
    c.add(g.value)
    e.delete(g.value)
  } else {
    e.add(g.value)
    c.delete(g.value)
  }
  collapsed.value = c
  expanded.value = e
}

const people = computed(() =>
  [...new Set((members.data.value ?? []).map((m) => m.display_name).filter(Boolean))].sort(),
)

function toggleDone(t: Task, done: boolean) {
  update.mutate({
    id: t.id,
    patch: { done, done_at: done ? new Date().toISOString() : null },
  })
}

function dueInfo(t: Task) {
  if (!t.due_date) return null
  const d = daysUntil(t.due_date) ?? 0
  if (t.done) return { tone: 'neutral' as const, text: formatDate(t.due_date) }
  if (d < 0) return { tone: 'danger' as const, text: `Terlambat · ${relativeDays(t.due_date)}` }
  if (d <= 14) return { tone: 'warning' as const, text: relativeDays(t.due_date) }
  return { tone: 'neutral' as const, text: formatDate(t.due_date) }
}

const sheetOpen = ref(false)
const editing = ref<Task | null>(null)
function openNew() {
  editing.value = null
  sheetOpen.value = true
}
function openEdit(t: Task) {
  editing.value = t
  sheetOpen.value = true
}
async function save(row: Omit<NewRow<'tasks'>, 'sort' | 'done' | 'done_at'>) {
  if (editing.value) {
    await update.mutateAsync({ id: editing.value.id, patch: row })
  } else {
    const maxSort = Math.max(-1, ...all.value.map((t) => t.sort))
    await insert.mutateAsync([{ ...row, done: false, done_at: null, sort: maxSort + 1 }])
  }
  sheetOpen.value = false
}

const statusOptions = [
  { value: 'semua', label: 'Semua' },
  { value: 'belum', label: 'Belum' },
  { value: 'selesai', label: 'Selesai' },
] as const
const categoryOptions = [
  { value: '', label: 'Semua kategori' },
  ...TASK_CATEGORIES.map((c) => ({ value: c, label: c })),
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Checklist"
      description="Tugas persiapan dari 12 bulan sebelum sampai setelah acara, termasuk berkas KUA dan upacara adat."
    >
      <template #actions>
        <BaseButton v-if="canEdit" variant="primary" @click="openNew">
          <Plus aria-hidden="true" /> Tambah tugas
        </BaseButton>
      </template>
    </PageHeader>

    <BaseCard v-if="all.length" class="p-4 sm:p-5">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-sm font-medium">
          <span class="text-2xl font-semibold tracking-tight tabular-nums">{{ doneCount }}</span>
          <span class="text-fg-muted"> dari {{ all.length }} tugas selesai</span>
        </p>
        <p class="text-sm font-semibold text-primary-strong tabular-nums">{{ progress }}%</p>
      </div>
      <ProgressBar
        class="mt-3"
        :value="doneCount"
        :max="all.length"
        :tone="progress === 100 ? 'success' : 'primary'"
        label="Progres checklist"
      />
    </BaseCard>

    <p v-if="!canEdit" class="rounded-md bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
      Kamu punya akses lihat saja. Minta pemilik mengubah peranmu agar bisa mencentang tugas.
    </p>

    <!-- Filters -->
    <div v-if="all.length" class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div
        class="inline-flex w-full rounded-md border border-border bg-bg-subtle p-1 sm:w-auto"
        role="radiogroup"
        aria-label="Status tugas"
      >
        <button
          v-for="o in statusOptions"
          :key="o.value"
          type="button"
          role="radio"
          :aria-checked="status === o.value"
          :class="
            cn(
              'h-9 flex-1 rounded-sm px-4 text-sm font-medium sm:flex-none touch:h-10',
              status === o.value
                ? 'bg-surface text-fg shadow-xs ring-1 ring-border'
                : 'text-fg-muted hover:text-fg',
            )
          "
          @click="status = o.value"
        >
          {{ o.label }}
        </button>
      </div>
      <SelectInput
        v-model="category"
        :options="categoryOptions"
        aria-label="Filter kategori"
        class="sm:w-52"
      />
      <label
        v-if="hasMine || mine"
        class="flex min-h-11 cursor-pointer items-center gap-2 text-sm sm:min-h-10"
      >
        <BaseCheckbox v-model="mine" />
        Hanya tugas saya
      </label>
      <p class="text-sm text-fg-muted sm:ml-auto" role="status" aria-live="polite">
        {{ filtered.length }} tugas tampil
      </p>
    </div>

    <ErrorState v-if="tasks.isError.value" :error="tasks.error.value" @retry="tasks.refetch()" />
    <SkeletonRows v-else-if="tasks.isPending.value" :rows="8" />
    <EmptyState
      v-else-if="!all.length"
      :icon="ListChecks"
      title="Belum ada tugas"
      description="Tambahkan tugas persiapan seperti booking venue atau daftar ke KUA, lengkap dengan tenggatnya."
    >
      <BaseButton v-if="canEdit" variant="primary" @click="openNew">
        <Plus aria-hidden="true" /> Tambah tugas pertama
      </BaseButton>
    </EmptyState>
    <EmptyState
      v-else-if="!filtered.length && status === 'belum' && !category && !mine"
      :icon="ListChecks"
      title="Semua tugas selesai"
      description="Tidak ada tugas yang tersisa. Selamat, persiapan beres!"
    >
      <BaseButton @click="status = 'semua'">Lihat semua tugas</BaseButton>
    </EmptyState>
    <EmptyState
      v-else-if="!filtered.length"
      :icon="Search"
      title="Tidak ada tugas yang cocok"
      description="Ubah atau hapus filter untuk melihat tugas lain."
    >
      <BaseButton v-if="hasFilters" @click="clearFilters">Hapus semua filter</BaseButton>
    </EmptyState>

    <div v-else class="flex flex-col gap-4">
      <BaseCard v-for="g in groups" :key="g.value" class="overflow-hidden">
        <h2>
          <button
            type="button"
            class="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg-subtle/60 sm:px-5"
            :aria-expanded="isOpen(g)"
            :aria-controls="`phase-${g.value}`"
            @click="toggleGroup(g)"
          >
            <ChevronDown
              :class="
                cn('size-4 shrink-0 text-fg-muted transition-transform', !isOpen(g) && '-rotate-90')
              "
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 font-semibold">{{ g.label }}</span>
            <StatusBadge :tone="g.done === g.total ? 'success' : 'neutral'">
              <span class="tabular-nums">{{ g.done }}/{{ g.total }}</span>
              <span>selesai</span>
            </StatusBadge>
          </button>
        </h2>

        <ul
          v-show="isOpen(g)"
          :id="`phase-${g.value}`"
          class="divide-y divide-border border-t border-border"
        >
          <li v-for="t in g.tasks" :key="t.id" class="flex items-start gap-3 px-4 py-3 sm:px-5">
            <label class="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3 sm:min-h-0">
              <BaseCheckbox
                class="mt-0.5"
                :model-value="t.done"
                :disabled="!canEdit"
                @update:model-value="toggleDone(t, $event)"
              />
              <span class="min-w-0 flex-1">
                <span
                  :class="
                    cn(
                      'block text-sm font-medium break-words',
                      t.done && 'text-fg-muted line-through',
                    )
                  "
                  >{{ t.title }}</span
                >
                <span
                  class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-muted"
                >
                  <StatusBadge v-if="t.category">{{ t.category }}</StatusBadge>
                  <StatusBadge v-if="dueInfo(t)" :tone="dueInfo(t)!.tone">
                    {{ dueInfo(t)!.text }}
                  </StatusBadge>
                  <span v-if="t.assignee" class="inline-flex items-center gap-1">
                    <User class="size-3.5" aria-hidden="true" />
                    <span class="sr-only">Penanggung jawab:</span>
                    {{ t.assignee }}
                  </span>
                </span>
                <span v-if="t.notes" class="mt-1.5 block text-xs text-pretty text-fg-muted">{{
                  t.notes
                }}</span>
              </span>
            </label>
            <RowMenu
              v-if="canEdit"
              :label="`Aksi untuk ${t.title}`"
              :items="[
                { label: 'Ubah tugas', run: () => openEdit(t) },
                { label: 'Hapus tugas', danger: true, run: () => remove.mutate([t]) },
              ]"
            />
          </li>
        </ul>
      </BaseCard>
    </div>

    <TaskSheet
      v-model:open="sheetOpen"
      :task="editing"
      :people="people"
      :wedding-date="wedding?.wedding_date ?? null"
      :saving="insert.isPending.value || update.isPending.value"
      @save="save"
    />
  </div>
</template>

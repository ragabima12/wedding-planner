<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useWorkspace } from '@/composables/useWorkspace'
import { errorMessage, toast } from '@/composables/useToast'
import { db } from '@/lib/db'
import { resetDemo } from '@/lib/db/demo'
import { env } from '@/lib/env'
import { todayIso } from '@/lib/format'
import type { TableName } from '@/types'

const { wedding, weddingId } = useWorkspace()
const TABLES: TableName[] = [
  'events',
  'budget_categories',
  'budget_items',
  'vendors',
  'payments',
  'guests',
  'tasks',
]

const exporting = ref(false)
async function exportJson() {
  if (!weddingId.value) return
  exporting.value = true
  try {
    const id = weddingId.value
    const [members, ...rows] = await Promise.all([
      db.listMembers(id),
      ...TABLES.map((t) => db.list(t, id)),
    ])
    const data = {
      exported_at: new Date().toISOString(),
      wedding: wedding.value,
      members,
      ...Object.fromEntries(TABLES.map((t, i) => [t, rows[i]])),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rencana-nikah-${todayIso()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Data diunduh', description: a.download, tone: 'success' })
  } catch (e) {
    toast({ title: 'Data belum terunduh', description: errorMessage(e), tone: 'danger' })
  } finally {
    exporting.value = false
  }
}

const resetOpen = ref(false)
function reset() {
  resetDemo()
  location.assign('/')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-fg-muted">
        Unduh semua anggaran, vendor, pembayaran, tamu, dan checklist sebagai file JSON untuk
        cadangan.
      </p>
      <BaseButton :loading="exporting" @click="exportJson">
        <Download aria-hidden="true" />
        Unduh data (JSON)
      </BaseButton>
    </div>
    <div
      v-if="env.isDemo"
      class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm text-fg-muted">
        Hapus semua data demo di browser ini dan mulai lagi dari awal.
      </p>
      <BaseButton variant="danger-ghost" @click="resetOpen = true">Reset data demo</BaseButton>
    </div>

    <ConfirmDialog
      v-model:open="resetOpen"
      title="Reset data demo?"
      description="Semua data demo di browser ini terhapus permanen. Unduh data dulu jika ingin menyimpannya."
      confirm-label="Reset data demo"
      @confirm="reset"
    />
  </div>
</template>

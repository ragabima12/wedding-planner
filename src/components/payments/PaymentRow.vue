<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import RowMenu, { type MenuItem } from '@/components/patterns/RowMenu.vue'
import { PAYMENT_STATE_LABEL, paymentState } from '@/composables/useSummary'
import { formatDate, formatRupiah, relativeDays } from '@/lib/format'
import type { Payment } from '@/types'
import { STATE_TONE } from './paymentOptions'

const { payment, vendorName, categoryName, canEdit } = defineProps<{
  payment: Payment
  vendorName?: string | null
  categoryName?: string | null
  canEdit: boolean
}>()
const emit = defineEmits<{ paid: [paid: boolean]; edit: []; remove: [] }>()

const state = computed(() => paymentState(payment))
const meta = computed(() => [vendorName, categoryName].filter(Boolean).join(' · '))
const menu = computed<MenuItem[]>(() => [
  { label: 'Ubah', run: () => emit('edit') },
  ...(payment.paid_at ? [{ label: 'Tandai belum lunas', run: () => emit('paid', false) }] : []),
  { label: 'Hapus', run: () => emit('remove'), danger: true },
])
</script>

<template>
  <li class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-5">
    <div class="min-w-0 flex-1 basis-48">
      <p class="truncate text-sm font-medium">{{ payment.label }}</p>
      <p v-if="meta" class="truncate text-xs text-fg-muted">{{ meta }}</p>
    </div>
    <div class="flex min-w-0 flex-col items-start gap-1 sm:w-44 sm:items-end">
      <StatusBadge :tone="STATE_TONE[state]">{{ PAYMENT_STATE_LABEL[state] }}</StatusBadge>
      <p class="text-xs text-fg-muted tabular-nums">
        <template v-if="payment.paid_at">Dibayar {{ formatDate(payment.paid_at) }}</template>
        <template v-else-if="payment.due_date">
          {{ formatDate(payment.due_date) }} · {{ relativeDays(payment.due_date) }}
        </template>
      </p>
    </div>
    <p class="ml-auto text-right text-sm font-semibold whitespace-nowrap tabular-nums sm:w-36">
      {{ formatRupiah(payment.amount) }}
    </p>
    <div v-if="canEdit" class="flex items-center gap-1">
      <BaseButton v-if="!payment.paid_at" size="sm" @click="emit('paid', true)">
        <Check aria-hidden="true" />
        Tandai lunas<span class="sr-only">: {{ payment.label }}</span>
      </BaseButton>
      <RowMenu :items="menu" :label="`Aksi untuk ${payment.label}`" />
    </div>
  </li>
</template>

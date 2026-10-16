import type { PaymentState } from '@/composables/useSummary'

export const PAYMENT_METHODS = [
  { value: '', label: 'Belum ditentukan' },
  { value: 'Transfer', label: 'Transfer bank' },
  { value: 'Tunai', label: 'Tunai' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'Kartu kredit', label: 'Kartu kredit' },
] as const

export const STATE_TONE: Record<
  PaymentState,
  'success' | 'danger' | 'warning' | 'info' | 'neutral'
> = {
  lunas: 'success',
  terlambat: 'danger',
  segera: 'warning',
  terjadwal: 'info',
  'tanpa-tanggal': 'neutral',
}

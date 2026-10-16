import { computed } from 'vue'
import { daysUntil } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { Category, Payment } from '@/types'
import { useRows } from './useRows'
import { useWorkspace } from './useWorkspace'

export interface CategorySummary {
  category: Category
  /** Sum of line-item estimates. */
  estimated: number
  /** Per line: final price when known, else estimate. */
  projected: number
  paid: number
  itemCount: number
}

export type PaymentState = 'lunas' | 'terlambat' | 'segera' | 'terjadwal' | 'tanpa-tanggal'

export function paymentState(p: Payment): PaymentState {
  if (p.paid_at) return 'lunas'
  const d = daysUntil(p.due_date)
  if (d === null) return 'tanpa-tanggal'
  if (d < 0) return 'terlambat'
  if (d <= 14) return 'segera'
  return 'terjadwal'
}

/**
 * Money terms used across the app:
 * - Anggaran: what you plan to spend (wedding total, per category allocation).
 * - Proyeksi: what it will likely cost (final price when known, else estimate).
 * - Dibayar: payments marked paid.
 */
export function useSummary() {
  const { wedding } = useWorkspace()
  const categories = useRows('budget_categories')
  const items = useRows('budget_items')
  const vendors = useRows('vendors')
  const payments = useRows('payments')
  const guests = useRows('guests')
  const tasks = useRows('tasks')

  const vendorCategory = computed(
    () => new Map((vendors.data.value ?? []).map((v) => [v.id, v.category_id])),
  )

  function paymentCategory(p: Payment) {
    return p.category_id ?? (p.vendor_id ? vendorCategory.value.get(p.vendor_id) : null) ?? null
  }

  const byCategory = computed<CategorySummary[]>(() => {
    const its = items.data.value ?? []
    const pays = payments.data.value ?? []
    return (categories.data.value ?? []).map((category) => {
      const mine = its.filter((i) => i.category_id === category.id)
      return {
        category,
        estimated: sum(mine, (i) => i.estimated),
        projected: sum(mine, (i) => i.actual ?? i.estimated),
        paid: sum(
          pays.filter((p) => p.paid_at && paymentCategory(p) === category.id),
          (p) => p.amount,
        ),
        itemCount: mine.length,
      }
    })
  })

  const totals = computed(() => {
    const budget = wedding.value?.total_budget ?? 0
    const allocated = sum(byCategory.value, (c) => c.category.allocated)
    const projected = sum(byCategory.value, (c) => c.projected)
    const pays = payments.data.value ?? []
    const paid = sum(
      pays.filter((p) => p.paid_at),
      (p) => p.amount,
    )
    const scheduledUnpaid = sum(
      pays.filter((p) => !p.paid_at),
      (p) => p.amount,
    )
    return {
      budget,
      allocated,
      unallocated: budget - allocated,
      projected,
      remaining: budget - projected,
      paid,
      scheduledUnpaid,
      overdue: pays.filter((p) => paymentState(p) === 'terlambat'),
      dueSoon: pays.filter((p) => paymentState(p) === 'segera'),
    }
  })

  const guestTotals = computed(() => {
    const list = guests.data.value ?? []
    const buffer = (wedding.value?.catering_buffer_pct ?? 10) / 100
    const pax = sum(list, (g) => g.pax)
    const confirmedPax = sum(
      list.filter((g) => g.rsvp === 'hadir'),
      (g) => g.pax,
    )
    const declinedPax = sum(
      list.filter((g) => g.rsvp === 'tidak'),
      (g) => g.pax,
    )
    const expectedPax = pax - declinedPax
    return {
      invitations: list.length,
      pax,
      confirmedPax,
      declinedPax,
      expectedPax,
      portions: Math.ceil(expectedPax * (1 + buffer)),
      sent: list.filter((g) => g.invite_sent).length,
      responded: list.filter((g) => g.rsvp !== 'belum').length,
      gifts: sum(list, (g) => g.gift_amount),
      bySide: (['wanita', 'pria', 'bersama'] as const).map((side) => ({
        side,
        pax: sum(
          list.filter((g) => g.side === side),
          (g) => g.pax,
        ),
      })),
    }
  })

  const taskTotals = computed(() => {
    const list = tasks.data.value ?? []
    const open = list.filter((t) => !t.done)
    return {
      total: list.length,
      done: list.length - open.length,
      overdue: open.filter((t) => (daysUntil(t.due_date) ?? 1) < 0),
      upcoming: open
        .filter((t) => t.due_date)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
        .slice(0, 5),
    }
  })

  const isPending = computed(
    () =>
      categories.isPending.value ||
      items.isPending.value ||
      payments.isPending.value ||
      vendors.isPending.value,
  )
  const error = computed(
    () => categories.error.value ?? items.error.value ?? payments.error.value ?? null,
  )
  const refetch = () => Promise.all([categories.refetch(), items.refetch(), payments.refetch()])

  return {
    wedding,
    categories,
    items,
    vendors,
    payments,
    guests,
    tasks,
    byCategory,
    totals,
    guestTotals,
    taskTotals,
    paymentCategory,
    isPending,
    error,
    refetch,
  }
}

export const SIDE_LABEL = {
  pria: 'Keluarga pria',
  wanita: 'Keluarga wanita',
  bersama: 'Bersama',
} as const
export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  lunas: 'Lunas',
  terlambat: 'Terlambat',
  segera: 'Segera jatuh tempo',
  terjadwal: 'Terjadwal',
  'tanpa-tanggal': 'Belum ada tanggal',
}

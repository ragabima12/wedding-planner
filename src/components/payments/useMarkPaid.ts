import { useRowMutations } from '@/composables/useRows'
import { toast } from '@/composables/useToast'
import { todayIso } from '@/lib/format'
import type { Payment } from '@/types'

/** Mark a payment paid today (or unpaid), with an undo toast. */
export function useMarkPaid() {
  const { update, remove } = useRowMutations('payments', 'Pembayaran')

  function setPaid(p: Payment, paid: boolean) {
    const before = p.paid_at
    update.mutate(
      { id: p.id, patch: { paid_at: paid ? todayIso() : null } },
      {
        onSuccess: () =>
          toast({
            title: paid ? `${p.label} ditandai lunas` : `${p.label} ditandai belum lunas`,
            tone: paid ? 'success' : 'default',
            action: {
              label: 'Batalkan',
              run: () => update.mutate({ id: p.id, patch: { paid_at: before } }),
            },
          }),
      },
    )
  }

  return { setPaid, update, remove }
}

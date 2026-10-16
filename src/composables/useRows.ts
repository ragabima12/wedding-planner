import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { db } from '@/lib/db'
import { errorMessage, toast } from '@/composables/useToast'
import type { NewRow, Patch, Row, TableName } from '@/types'
import { useWorkspace } from './useWorkspace'

export function rowsKey(weddingId: string | null, table: TableName) {
  return ['rows', weddingId, table] as const
}

export function useRows<K extends TableName>(table: K) {
  const { weddingId } = useWorkspace()
  return useQuery({
    queryKey: computed(() => rowsKey(weddingId.value, table)),
    queryFn: () => db.list(table, weddingId.value!),
    enabled: computed(() => !!weddingId.value),
  })
}

const META = ['wedding_id', 'created_by', 'created_at', 'updated_at'] as const

function strip<K extends TableName>(row: Row<K>): NewRow<K> {
  const copy: Record<string, unknown> = { ...row }
  for (const k of META) delete copy[k]
  return copy as NewRow<K>
}

/** Insert / update / remove with optimistic cache updates and undo for removals. */
export function useRowMutations<K extends TableName>(
  table: K,
  noun = 'Data',
  /** Set false when deleting cascades to child rows, so undo can't fully restore. */
  opts: { undo?: boolean } = {},
) {
  const undo = opts.undo ?? true
  const qc = useQueryClient()
  const { weddingId } = useWorkspace()
  const key = () => rowsKey(weddingId.value, table)

  function snapshot() {
    return qc.getQueryData<Row<K>[]>(key())
  }
  function rollback(prev: Row<K>[] | undefined, e: unknown) {
    qc.setQueryData(key(), prev)
    toast({ title: 'Perubahan tidak tersimpan', description: errorMessage(e), tone: 'danger' })
  }
  const settle = () => qc.invalidateQueries({ queryKey: key() })

  const insert = useMutation({
    mutationFn: (rows: NewRow<K>[]) => db.insert(table, weddingId.value!, rows),
    onSuccess: (created) => {
      qc.setQueryData<Row<K>[]>(key(), (list) => [...(list ?? []), ...created])
    },
    onError: (e) =>
      toast({ title: 'Data belum tersimpan', description: errorMessage(e), tone: 'danger' }),
    onSettled: settle,
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Patch<K> }) => db.update(table, id, patch),
    onMutate: ({ id, patch }) => {
      const prev = snapshot()
      qc.setQueryData<Row<K>[]>(key(), (list) =>
        list?.map((r) => (r.id === id ? ({ ...r, ...patch } as Row<K>) : r)),
      )
      return { prev }
    },
    onError: (e, _v, ctx) => rollback(ctx?.prev, e),
    onSettled: settle,
  })

  const remove = useMutation({
    mutationFn: (rows: Row<K>[]) =>
      db.remove(
        table,
        rows.map((r) => r.id),
      ),
    onMutate: (rows) => {
      const prev = snapshot()
      const ids = new Set(rows.map((r) => r.id))
      qc.setQueryData<Row<K>[]>(key(), (list) => list?.filter((r) => !ids.has(r.id)))
      return { prev }
    },
    onSuccess: (_d, rows) => {
      toast({
        title:
          rows.length === 1 ? `${noun} dihapus` : `${rows.length} ${noun.toLowerCase()} dihapus`,
        action: undo ? { label: 'Batalkan', run: () => insert.mutate(rows.map(strip)) } : undefined,
      })
    },
    onError: (e, _v, ctx) => rollback(ctx?.prev, e),
    onSettled: settle,
  })

  return { insert, update, remove }
}

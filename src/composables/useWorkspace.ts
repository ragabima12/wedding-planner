import { computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Wedding } from '@/types'

const currentId = useStorage<string | null>('wp-current-wedding', null)

/** The wedding being planned (a person can belong to more than one) + the viewer's role in it. */
export function useWorkspace() {
  const qc = useQueryClient()
  const userId = computed(() => auth.me?.id ?? null)

  const weddings = useQuery({
    queryKey: computed(() => ['weddings', userId.value]),
    queryFn: () => db.listWeddings(),
    enabled: computed(() => auth.isSignedIn && !!userId.value),
  })

  const wedding = computed<Wedding | null>(() => {
    const list = weddings.data.value ?? []
    return list.find((w) => w.id === currentId.value) ?? list[0] ?? null
  })
  const weddingId = computed(() => wedding.value?.id ?? null)

  watch(wedding, (w) => {
    if (w && w.id !== currentId.value) currentId.value = w.id
  })

  const members = useQuery({
    queryKey: computed(() => ['members', weddingId.value]),
    queryFn: () => db.listMembers(weddingId.value!),
    enabled: computed(() => !!weddingId.value),
  })

  const role = computed(
    () => members.data.value?.find((m) => m.user_id === userId.value)?.role ?? null,
  )
  const canEdit = computed(() => role.value === 'owner' || role.value === 'editor')
  const isOwner = computed(() => role.value === 'owner')

  const updateWedding = useMutation({
    mutationFn: (patch: Partial<Wedding>) => db.updateWedding(weddingId.value!, patch),
    onMutate: (patch) => {
      const key = ['weddings', userId.value]
      const prev = qc.getQueryData<Wedding[]>(key)
      qc.setQueryData<Wedding[]>(key, (list) =>
        list?.map((w) => (w.id === weddingId.value ? { ...w, ...patch } : w)),
      )
      return { prev, key }
    },
    onError: (_e, _p, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['weddings'] }),
  })

  return {
    weddings,
    wedding,
    weddingId,
    members,
    role,
    canEdit,
    isOwner,
    updateWedding,
    select: (id: string) => (currentId.value = id),
  }
}

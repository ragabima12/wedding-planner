<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Copy, Link2, UserPlus } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { useWorkspace } from '@/composables/useWorkspace'
import { errorMessage, toast } from '@/composables/useToast'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { formatDate } from '@/lib/format'
import type { Invite, Member, Role } from '@/types'

const qc = useQueryClient()
const { weddingId, members, isOwner } = useWorkspace()

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Pemilik',
  editor: 'Editor',
  viewer: 'Hanya lihat',
}
const ROLE_OPTIONS = [
  { value: 'owner', label: 'Pemilik: semua akses, kelola anggota' },
  { value: 'editor', label: 'Editor: ubah anggaran, vendor, tamu' },
  { value: 'viewer', label: 'Hanya lihat: cocok untuk orang tua' },
]
const INVITE_ROLE_OPTIONS = ROLE_OPTIONS.slice(1)

const list = computed(() => members.data.value ?? [])
const invalidateMembers = () => qc.invalidateQueries({ queryKey: ['members', weddingId.value] })

const changeRole = useMutation({
  mutationFn: ({ m, role }: { m: Member; role: Role }) =>
    db.updateMemberRole(m.wedding_id, m.user_id, role),
  onSuccess: (_d, { m, role }) =>
    toast({ title: `${m.display_name || m.email} sekarang ${ROLE_LABEL[role]}`, tone: 'success' }),
  onError: (e) =>
    toast({ title: 'Peran belum berubah', description: errorMessage(e), tone: 'danger' }),
  onSettled: invalidateMembers,
})

const removing = ref<Member | null>(null)
const removeOpen = computed({
  get: () => !!removing.value,
  set: (v) => !v && (removing.value = null),
})
const removeMember = useMutation({
  mutationFn: (m: Member) => db.removeMember(m.wedding_id, m.user_id),
  onSuccess: (_d, m) => {
    toast({ title: `${m.display_name || m.email} dikeluarkan` })
    removing.value = null
  },
  onError: (e) =>
    toast({ title: 'Anggota belum dikeluarkan', description: errorMessage(e), tone: 'danger' }),
  onSettled: invalidateMembers,
})

// Invites (owner only, cloud mode)
const invitesKey = computed(() => ['invites', weddingId.value])
const invites = useQuery({
  queryKey: invitesKey,
  queryFn: () => db.listInvites(weddingId.value!),
  enabled: computed(() => !!weddingId.value && isOwner.value && !env.isDemo),
})
const inviteRole = ref<'editor' | 'viewer'>('editor')
const inviteLabel = ref('')
const createInvite = useMutation({
  mutationFn: () => db.createInvite(weddingId.value!, inviteRole.value, inviteLabel.value.trim()),
  onSuccess: (inv) => {
    inviteLabel.value = ''
    toast({
      title: `Kode ${inv.code} dibuat`,
      description: 'Salin tautan lalu kirim lewat WhatsApp.',
      tone: 'success',
    })
  },
  onError: (e) =>
    toast({ title: 'Kode belum dibuat', description: errorMessage(e), tone: 'danger' }),
  onSettled: () => qc.invalidateQueries({ queryKey: invitesKey.value }),
})
const revoke = useMutation({
  mutationFn: (inv: Invite) => db.revokeInvite(inv.id),
  onSuccess: (_d, inv) => toast({ title: `Kode ${inv.code} dinonaktifkan` }),
  onSettled: () => qc.invalidateQueries({ queryKey: invitesKey.value }),
})

const { copy, isSupported } = useClipboard()
const linkFor = (inv: Invite) => `${location.origin}/gabung/${inv.code}`
async function copyLink(inv: Invite) {
  await copy(linkFor(inv))
  toast({ title: 'Tautan undangan disalin', tone: 'success' })
}

const initials = (m: Member) =>
  (m.display_name || m.email || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
</script>

<template>
  <div class="flex flex-col gap-6">
    <ul class="divide-y divide-border rounded-md border border-border">
      <li
        v-for="m in list"
        :key="m.user_id"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-strong"
          aria-hidden="true"
          >{{ initials(m) }}</span
        >
        <div class="min-w-0 flex-1 basis-40">
          <p class="truncate text-sm font-medium">
            {{ m.display_name || 'Tanpa nama' }}
            <span v-if="m.user_id === auth.me?.id" class="font-normal text-fg-muted">(kamu)</span>
          </p>
          <p class="truncate text-xs text-fg-muted">{{ m.email }}</p>
        </div>
        <template v-if="isOwner && m.user_id !== auth.me?.id">
          <SelectInput
            :model-value="m.role"
            :options="ROLE_OPTIONS"
            :aria-label="`Peran ${m.display_name || m.email}`"
            class="w-full sm:w-72"
            @update:model-value="changeRole.mutate({ m, role: $event as Role })"
          />
          <BaseButton variant="danger-ghost" size="sm" @click="removing = m">
            Keluarkan<span class="sr-only"> {{ m.display_name || m.email }}</span>
          </BaseButton>
        </template>
        <StatusBadge v-else :tone="m.role === 'owner' ? 'primary' : 'neutral'">
          {{ ROLE_LABEL[m.role] }}
        </StatusBadge>
      </li>
    </ul>

    <div v-if="isOwner" class="flex flex-col gap-4 border-t border-border pt-6">
      <div>
        <h3 class="text-sm font-semibold">Undang pasangan atau keluarga</h3>
        <p class="mt-1 text-sm text-fg-muted">
          Buat kode, kirim tautannya. Penerima masuk dengan akunnya sendiri, lalu langsung
          bergabung. Kode berlaku 14 hari.
        </p>
      </div>

      <p v-if="env.isDemo" class="rounded-md bg-warning-soft p-3 text-sm text-fg">
        Undangan butuh mode cloud. Isi kunci Clerk dan Supabase di
        <code class="rounded-sm bg-surface px-1">.env</code> agar data bisa dipakai bersama.
      </p>

      <template v-else>
        <form
          class="grid gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end"
          novalidate
          @submit.prevent="createInvite.mutate()"
        >
          <FormField v-slot="f" label="Untuk siapa" optional>
            <TextInput
              :id="f.id"
              v-model="inviteLabel"
              placeholder="Contoh: Ibu, Mas Andi"
              autocomplete="off"
            />
          </FormField>
          <FormField v-slot="f" label="Peran">
            <SelectInput :id="f.id" v-model="inviteRole" :options="INVITE_ROLE_OPTIONS" />
          </FormField>
          <BaseButton type="submit" :loading="createInvite.isPending.value">
            <UserPlus aria-hidden="true" />
            Buat kode
          </BaseButton>
        </form>

        <ul v-if="invites.data.value?.length" class="flex flex-col gap-2">
          <li
            v-for="inv in invites.data.value"
            :key="inv.id"
            class="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
          >
            <Link2 class="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
            <div class="min-w-0 flex-1 basis-40">
              <p class="font-mono text-sm font-semibold tracking-widest">{{ inv.code }}</p>
              <p class="truncate text-xs text-fg-muted">
                {{ inv.label ? `${inv.label} · ` : '' }}{{ ROLE_LABEL[inv.role] }} · berlaku s.d.
                {{ formatDate(inv.expires_at.slice(0, 10)) }}
              </p>
            </div>
            <BaseButton v-if="isSupported" size="sm" @click="copyLink(inv)">
              <Copy aria-hidden="true" />
              Salin tautan<span class="sr-only"> {{ inv.code }}</span>
            </BaseButton>
            <span v-else class="text-xs break-all text-fg-muted">{{ linkFor(inv) }}</span>
            <BaseButton
              variant="ghost"
              size="sm"
              :loading="revoke.isPending.value"
              @click="revoke.mutate(inv)"
            >
              Nonaktifkan<span class="sr-only"> {{ inv.code }}</span>
            </BaseButton>
          </li>
        </ul>
      </template>
    </div>

    <ConfirmDialog
      v-model:open="removeOpen"
      :title="`Keluarkan ${removing?.display_name || removing?.email || 'anggota'}?`"
      description="Orang ini tidak bisa lagi melihat atau mengubah rencana. Kamu bisa mengundangnya lagi kapan saja."
      confirm-label="Keluarkan anggota"
      :loading="removeMember.isPending.value"
      @confirm="removing && removeMember.mutate(removing)"
    />
  </div>
</template>

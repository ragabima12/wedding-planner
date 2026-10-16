<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { useWorkspace } from '@/composables/useWorkspace'
import { errorMessage, toast } from '@/composables/useToast'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const router = useRouter()
const qc = useQueryClient()
const { wedding, weddingId, isOwner } = useWorkspace()

async function afterLeave() {
  await qc.invalidateQueries({ queryKey: ['weddings'] })
  router.replace('/')
}

const deleteOpen = ref(false)
const typed = ref('')
watch(deleteOpen, () => (typed.value = ''))
const matches = computed(() => typed.value.trim() === wedding.value?.name.trim())

const del = useMutation({
  mutationFn: () => db.deleteWedding(weddingId.value!),
  onSuccess: async () => {
    deleteOpen.value = false
    toast({ title: 'Rencana pernikahan dihapus' })
    await afterLeave()
  },
  onError: (e) =>
    toast({ title: 'Rencana belum terhapus', description: errorMessage(e), tone: 'danger' }),
})

const leaveOpen = ref(false)
const leave = useMutation({
  mutationFn: () => db.removeMember(weddingId.value!, auth.me!.id),
  onSuccess: async () => {
    leaveOpen.value = false
    toast({ title: 'Kamu sudah keluar dari rencana ini' })
    await afterLeave()
  },
  onError: (e) =>
    toast({ title: 'Belum bisa keluar', description: errorMessage(e), tone: 'danger' }),
})
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <template v-if="isOwner">
      <p class="text-sm text-fg-muted">
        Menghapus rencana beserta seluruh anggaran, vendor, pembayaran, tamu, dan checklist untuk
        semua anggota.
      </p>
      <BaseButton variant="danger" @click="deleteOpen = true">Hapus rencana pernikahan</BaseButton>
    </template>
    <template v-else>
      <p class="text-sm text-fg-muted">
        Kamu tidak akan bisa melihat rencana ini lagi sampai diundang ulang.
      </p>
      <BaseButton variant="danger" @click="leaveOpen = true">Keluar dari rencana</BaseButton>
    </template>
  </div>

  <BaseDialog
    v-model:open="deleteOpen"
    title="Hapus rencana pernikahan?"
    description="Semua data terhapus permanen untuk semua anggota. Tindakan ini tidak bisa dibatalkan."
    size="sm"
  >
    <form id="delete-wedding" novalidate @submit.prevent="matches && del.mutate()">
      <FormField
        v-slot="f"
        :label="`Ketik “${wedding?.name}” untuk konfirmasi`"
        hint="Unduh data dulu jika ingin menyimpan cadangan."
      >
        <TextInput
          :id="f.id"
          v-model="typed"
          :placeholder="wedding?.name ?? ''"
          autocomplete="off"
          :aria-describedby="f.describedby"
        />
      </FormField>
    </form>
    <template #footer>
      <BaseButton @click="deleteOpen = false">Batal</BaseButton>
      <BaseButton
        type="submit"
        form="delete-wedding"
        variant="danger"
        :disabled="!matches"
        :loading="del.isPending.value"
      >
        Hapus permanen
      </BaseButton>
    </template>
  </BaseDialog>

  <ConfirmDialog
    v-model:open="leaveOpen"
    :title="`Keluar dari ${wedding?.name ?? 'rencana'}?`"
    description="Kamu tidak bisa melihat atau mengubah rencana ini lagi sampai pemilik mengundangmu kembali."
    confirm-label="Keluar dari rencana"
    :loading="leave.isPending.value"
    @confirm="leave.mutate()"
  />
</template>

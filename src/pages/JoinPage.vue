<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { Loader2 } from 'lucide-vue-next'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { useWorkspace } from '@/composables/useWorkspace'
import { errorMessage } from '@/composables/useToast'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()
const { select } = useWorkspace()
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const id = await db.acceptInvite(String(route.params.code), auth.me!)
    select(id)
    await qc.invalidateQueries({ queryKey: ['weddings'] })
    router.replace('/')
  } catch (e) {
    error.value = errorMessage(e)
  }
})
</script>

<template>
  <AuthLayout title="Gabung ke rencana pernikahan">
    <BaseCard class="flex w-full max-w-md flex-col items-center gap-4 p-6 text-center">
      <template v-if="!error">
        <Loader2
          class="size-6 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p role="status">Memeriksa kode {{ route.params.code }}…</p>
      </template>
      <template v-else>
        <p role="alert" class="text-sm text-danger">{{ error }}</p>
        <BaseButton variant="primary" @click="router.replace('/mulai')"
          >Masukkan kode lain</BaseButton
        >
      </template>
    </BaseCard>
  </AuthLayout>
</template>

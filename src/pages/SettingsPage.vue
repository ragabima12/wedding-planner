<script setup lang="ts">
import { useDark } from '@vueuse/core'
import PageHeader from '@/components/patterns/PageHeader.vue'
import DangerZone from '@/components/settings/DangerZone.vue'
import DataSection from '@/components/settings/DataSection.vue'
import MembersSection from '@/components/settings/MembersSection.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import WeddingForm from '@/components/settings/WeddingForm.vue'
import { useWorkspace } from '@/composables/useWorkspace'

const { canEdit, isOwner } = useWorkspace()
const isDark = useDark()
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Pengaturan"
      description="Data pernikahan, anggota keluarga yang ikut mengelola, tampilan, dan cadangan data."
    />

    <SettingsSection
      title="Data pernikahan"
      :description="
        canEdit
          ? 'Total anggaran, tanggal, dan angka dasar untuk menghitung porsi katering.'
          : 'Kamu punya akses lihat saja. Minta pemilik mengubah peranmu menjadi Editor.'
      "
    >
      <WeddingForm />
    </SettingsSection>

    <SettingsSection
      title="Anggota"
      :description="
        isOwner
          ? 'Atur siapa yang bisa mengubah atau hanya melihat rencana ini.'
          : 'Orang yang ikut mengelola rencana ini. Hanya pemilik yang bisa mengubah peran.'
      "
    >
      <MembersSection />
    </SettingsSection>

    <SettingsSection title="Tampilan" description="Berlaku di perangkat ini saja.">
      <label class="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span class="text-sm font-medium">Mode gelap</span>
        <span class="relative inline-flex">
          <input
            v-model="isDark"
            type="checkbox"
            role="switch"
            :aria-checked="isDark"
            class="peer h-7 w-12 cursor-pointer appearance-none rounded-full border-2 border-border-strong bg-bg-subtle transition-colors checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <span
            class="pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-fg-muted transition-transform peer-checked:translate-x-5 peer-checked:bg-primary-fg"
            aria-hidden="true"
          />
        </span>
      </label>
    </SettingsSection>

    <SettingsSection title="Data" description="Cadangan dan pemulihan.">
      <DataSection />
    </SettingsSection>

    <SettingsSection title="Zona berbahaya" danger>
      <DangerZone />
    </SettingsSection>
  </div>
</template>

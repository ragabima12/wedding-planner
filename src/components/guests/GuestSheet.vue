<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextArea from '@/components/ui/TextArea.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { SIDE_LABEL } from '@/composables/useSummary'
import type { Guest, InviteType, NewRow, Rsvp, Side } from '@/types'
import { GIFT_CHANNEL_LABEL, RSVP_LABEL } from './guestUtils'

const { guest, saving, eventOptions, groups } = defineProps<{
  guest: Guest | null
  saving?: boolean
  eventOptions: { value: string; label: string }[]
  groups: string[]
}>()
const emit = defineEmits<{ save: [row: NewRow<'guests'>] }>()
const open = defineModel<boolean>('open', { default: false })

const name = ref('')
const groupName = ref('')
const side = ref<Side>('bersama')
const pax = ref('2')
const phone = ref('')
const inviteType = ref<InviteType>('digital')
const inviteSent = ref(false)
const rsvp = ref<Rsvp>('belum')
const events = ref<string[]>([])
const gift = ref<number | null>(null)
const giftChannel = ref<Guest['gift_channel']>('')
const notes = ref('')
const touched = ref(false)

watch(open, (o) => {
  if (!o) return
  touched.value = false
  const g = guest
  name.value = g?.name ?? ''
  groupName.value = g?.group_name ?? ''
  side.value = g?.side ?? 'bersama'
  pax.value = String(g?.pax ?? 2)
  phone.value = g?.phone ?? ''
  inviteType.value = g?.invite_type ?? 'digital'
  inviteSent.value = g?.invite_sent ?? false
  rsvp.value = g?.rsvp ?? 'belum'
  events.value = [...(g?.events ?? eventOptions.map((e) => e.value))]
  gift.value = g?.gift_amount ?? null
  giftChannel.value = g?.gift_channel ?? ''
  notes.value = g?.notes ?? ''
})

const errors = computed(() => {
  const n = Number(pax.value)
  return {
    name: name.value.trim() ? null : 'Isi nama tamu atau keluarga.',
    pax: Number.isInteger(n) && n >= 1 && n <= 50 ? null : 'Isi jumlah orang antara 1 dan 50.',
  }
})

function toggleEvent(v: string, on: boolean) {
  events.value = on ? [...events.value, v] : events.value.filter((x) => x !== v)
}

function submit() {
  touched.value = true
  if (errors.value.name || errors.value.pax) {
    document.querySelector<HTMLElement>('#guest-form [aria-invalid="true"]')?.focus()
    return
  }
  emit('save', {
    name: name.value.trim(),
    group_name: groupName.value.trim(),
    side: side.value,
    pax: Number(pax.value),
    phone: phone.value.trim(),
    invite_type: inviteType.value,
    invite_sent: inviteSent.value,
    rsvp: rsvp.value,
    events: events.value,
    gift_amount: gift.value,
    gift_channel: gift.value ? giftChannel.value || 'transfer' : giftChannel.value,
    notes: notes.value.trim(),
  })
}

const sideOptions = Object.entries(SIDE_LABEL).map(([value, label]) => ({ value, label }))
const rsvpOptions = Object.entries(RSVP_LABEL).map(([value, label]) => ({ value, label }))
const channelOptions = Object.entries(GIFT_CHANNEL_LABEL).map(([value, label]) => ({
  value,
  label: value ? label : 'Belum dicatat',
}))
</script>

<template>
  <BaseDialog
    v-model:open="open"
    side="right"
    :title="guest ? 'Ubah tamu' : 'Tambah tamu'"
    description="Satu baris per undangan. Jumlah orang dipakai untuk menghitung porsi katering."
  >
    <form id="guest-form" class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <FormField v-slot="f" label="Nama" :error="touched ? errors.name : null">
        <TextInput
          :id="f.id"
          v-model="name"
          placeholder="Contoh: Keluarga Bpk. Hadi"
          autocomplete="off"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Grup" optional hint="Contoh: Keluarga besar, Kantor ayah.">
          <TextInput
            :id="f.id"
            v-model="groupName"
            placeholder="Contoh: Teman kantor"
            list="guest-groups"
            autocomplete="off"
            :aria-describedby="f.describedby"
          />
          <datalist id="guest-groups">
            <option v-for="g in groups" :key="g" :value="g" />
          </datalist>
        </FormField>
        <FormField v-slot="f" label="Pihak">
          <SelectInput :id="f.id" v-model="side" :options="sideOptions" />
        </FormField>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Jumlah orang" :error="touched ? errors.pax : null">
          <TextInput
            :id="f.id"
            v-model="pax"
            placeholder="2"
            type="number"
            inputmode="numeric"
            min="1"
            max="50"
            :aria-invalid="f.invalid"
            :aria-describedby="f.describedby"
          />
        </FormField>
        <FormField v-slot="f" label="Nomor WhatsApp" optional hint="Boleh 08… atau +62…">
          <TextInput
            :id="f.id"
            v-model="phone"
            placeholder="Contoh: 0812 3456 7890"
            type="tel"
            inputmode="tel"
            autocomplete="off"
            :aria-describedby="f.describedby"
          />
        </FormField>
      </div>

      <fieldset class="flex flex-col gap-3">
        <legend class="mb-2 text-sm font-semibold">Undangan</legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField v-slot="f" label="Jenis undangan">
            <SelectInput
              :id="f.id"
              v-model="inviteType"
              :options="[
                { value: 'digital', label: 'Digital' },
                { value: 'cetak', label: 'Cetak' },
              ]"
            />
          </FormField>
          <FormField v-slot="f" label="RSVP">
            <SelectInput :id="f.id" v-model="rsvp" :options="rsvpOptions" />
          </FormField>
        </div>
        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <BaseCheckbox v-model="inviteSent" />
          Undangan sudah dikirim
        </label>
      </fieldset>

      <fieldset v-if="eventOptions.length">
        <legend class="text-sm font-semibold">Diundang ke</legend>
        <div class="mt-2 flex flex-wrap gap-x-6">
          <label
            v-for="e in eventOptions"
            :key="e.value"
            class="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
          >
            <BaseCheckbox
              :model-value="events.includes(e.value)"
              @update:model-value="toggleEvent(e.value, $event)"
            />
            {{ e.label }}
          </label>
        </div>
      </fieldset>

      <fieldset class="grid gap-4 sm:grid-cols-2">
        <legend class="mb-2 text-sm font-semibold">Angpao/kado</legend>
        <FormField v-slot="f" label="Nominal" optional hint="Dicatat setelah acara.">
          <MoneyInput
            :id="f.id"
            v-model="gift"
            placeholder="Contoh: 500rb"
            :aria-describedby="f.describedby"
          />
        </FormField>
        <FormField v-slot="f" label="Bentuk">
          <SelectInput :id="f.id" v-model="giftChannel" :options="channelOptions" />
        </FormField>
      </fieldset>

      <FormField v-slot="f" label="Catatan" optional>
        <TextArea :id="f.id" v-model="notes" placeholder="Contoh: Duduk di meja keluarga" />
      </FormField>
    </form>
    <template #footer>
      <BaseButton @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="guest-form" variant="primary" :loading="saving">
        {{ guest ? 'Simpan perubahan' : 'Tambah tamu' }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

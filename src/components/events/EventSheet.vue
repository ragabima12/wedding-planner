<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextArea from '@/components/ui/TextArea.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { EVENT_KINDS } from '@/data/templates'
import { SIDE_LABEL } from '@/composables/useSummary'
import type { NewRow, Side, WeddingEvent } from '@/types'

const { event, saving } = defineProps<{ event: WeddingEvent | null; saving?: boolean }>()
const emit = defineEmits<{ save: [row: Omit<NewRow<'events'>, 'sort'>] }>()
const open = defineModel<boolean>('open', { default: false })

const name = ref('')
const kind = ref('lainnya')
const side = ref<Side>('bersama')
const date = ref('')
const startTime = ref('')
const venue = ref('')
const notes = ref('')
const touched = ref(false)

watch(open, (o) => {
  if (!o) return
  touched.value = false
  name.value = event?.name ?? ''
  kind.value = event?.kind ?? 'lainnya'
  side.value = event?.side ?? 'bersama'
  date.value = event?.date ?? ''
  startTime.value = event?.start_time ?? ''
  venue.value = event?.venue ?? ''
  notes.value = event?.notes ?? ''
})

// Picking a kind on a new, still-unnamed event fills the name (Tesler: system absorbs work).
watch(kind, (k) => {
  if (!event && !name.value.trim() && k !== 'lainnya') name.value = EVENT_KINDS[k] ?? ''
})

const nameError = computed(() => (name.value.trim() ? null : 'Isi nama acara.'))
const kindOptions = Object.entries(EVENT_KINDS).map(([value, label]) => ({ value, label }))
const sideOptions = Object.entries(SIDE_LABEL).map(([value, label]) => ({ value, label }))

function submit() {
  touched.value = true
  if (nameError.value) {
    document.querySelector<HTMLElement>('#event-form [aria-invalid="true"]')?.focus()
    return
  }
  emit('save', {
    name: name.value.trim(),
    kind: kind.value,
    side: side.value,
    date: date.value || null,
    start_time: startTime.value,
    venue: venue.value.trim(),
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    side="right"
    :title="event ? 'Ubah acara' : 'Tambah acara'"
    description="Tanggal dan tempat tiap rangkaian acara."
  >
    <form id="event-form" class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <FormField v-slot="f" label="Jenis acara">
        <SelectInput :id="f.id" v-model="kind" :options="kindOptions" />
      </FormField>
      <FormField v-slot="f" label="Nama acara" :error="touched ? nameError : null">
        <TextInput
          :id="f.id"
          v-model="name"
          placeholder="Contoh: Siraman"
          autocomplete="off"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Tanggal" optional>
          <TextInput :id="f.id" v-model="date" placeholder="dd/mm/yyyy" type="date" />
        </FormField>
        <FormField v-slot="f" label="Jam mulai" optional>
          <TextInput :id="f.id" v-model="startTime" placeholder="08.00" type="time" />
        </FormField>
      </div>
      <FormField v-slot="f" label="Tempat" optional>
        <TextInput
          :id="f.id"
          v-model="venue"
          placeholder="Contoh: Masjid Agung, Yogyakarta"
          autocomplete="off"
        />
      </FormField>
      <FormField v-slot="f" label="Penyelenggara">
        <SelectInput :id="f.id" v-model="side" :options="sideOptions" />
      </FormField>
      <FormField v-slot="f" label="Catatan" optional>
        <TextArea
          :id="f.id"
          v-model="notes"
          placeholder="Contoh: Dress code batik, keluarga hadir 07.30"
        />
      </FormField>
    </form>
    <template #footer>
      <BaseButton @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="event-form" variant="primary" :loading="saving">
        {{ event ? 'Simpan perubahan' : 'Tambah acara' }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

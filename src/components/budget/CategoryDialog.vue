<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextArea from '@/components/ui/TextArea.vue'
import TextInput from '@/components/ui/TextInput.vue'
import type { Category } from '@/types'

const { category, saving } = defineProps<{ category: Category | null; saving?: boolean }>()
const emit = defineEmits<{
  save: [value: { name: string; icon: string; allocated: number; notes: string }]
}>()
const open = defineModel<boolean>('open', { default: false })

const name = ref('')
const icon = ref('wallet')
const allocated = ref<number | null>(null)
const notes = ref('')
const touched = ref(false)

watch(open, (o) => {
  if (!o) return
  touched.value = false
  name.value = category?.name ?? ''
  icon.value = category?.icon ?? 'wallet'
  allocated.value = category?.allocated ?? null
  notes.value = category?.notes ?? ''
})

const nameError = computed(() => (name.value.trim() ? null : 'Isi nama kategori.'))

const icons = [
  { value: 'wallet', label: 'Umum' },
  { value: 'utensils', label: 'Makanan' },
  { value: 'building', label: 'Gedung' },
  { value: 'flower', label: 'Dekorasi' },
  { value: 'shirt', label: 'Busana' },
  { value: 'camera', label: 'Dokumentasi' },
  { value: 'music', label: 'Hiburan' },
  { value: 'mail', label: 'Undangan' },
  { value: 'gift', label: 'Hadiah' },
  { value: 'clipboard', label: 'Koordinasi' },
  { value: 'gem', label: 'Perhiasan' },
  { value: 'sparkles', label: 'Adat' },
  { value: 'landmark', label: 'Administrasi' },
  { value: 'shield', label: 'Cadangan' },
  { value: 'plane', label: 'Perjalanan' },
]

function submit() {
  touched.value = true
  if (nameError.value) return
  emit('save', {
    name: name.value.trim(),
    icon: icon.value,
    allocated: allocated.value ?? 0,
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="category ? `Ubah kategori ${category.name}` : 'Tambah kategori'"
    size="sm"
  >
    <form id="category-form" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <FormField v-slot="f" label="Nama kategori" :error="touched ? nameError : null">
        <TextInput
          :id="f.id"
          v-model="name"
          placeholder="Contoh: Katering"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <FormField v-slot="f" label="Ikon">
        <SelectInput :id="f.id" v-model="icon" :options="icons" />
      </FormField>
      <FormField
        v-slot="f"
        label="Anggaran kategori"
        hint="Batas yang ingin dipakai untuk kategori ini."
      >
        <MoneyInput
          :id="f.id"
          v-model="allocated"
          placeholder="Contoh: 80jt"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <FormField v-slot="f" label="Catatan" optional>
        <TextArea
          :id="f.id"
          v-model="notes"
          placeholder="Contoh: Termasuk food tasting dan gubukan"
        />
      </FormField>
    </form>
    <template #footer>
      <BaseButton @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="category-form" variant="primary" :loading="saving">
        {{ category ? 'Simpan perubahan' : 'Tambah kategori' }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextArea from '@/components/ui/TextArea.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { PHASES, TASK_CATEGORIES } from '@/data/templates'
import { addDaysIso } from '@/lib/format'
import type { NewRow, Task } from '@/types'

const { task, saving, people, weddingDate } = defineProps<{
  task: Task | null
  saving?: boolean
  people: string[]
  weddingDate: string | null
}>()
const emit = defineEmits<{ save: [row: Omit<NewRow<'tasks'>, 'sort' | 'done' | 'done_at'>] }>()
const open = defineModel<boolean>('open', { default: false })

const title = ref('')
const phase = ref('lainnya')
const category = ref('Perencanaan')
const due = ref('')
const assignee = ref('')
const notes = ref('')
const touched = ref(false)
let dueTouched = false
const markDueTouched = () => (dueTouched = true)

watch(open, (o) => {
  if (!o) return
  touched.value = false
  dueTouched = !!task?.due_date
  title.value = task?.title ?? ''
  phase.value = task?.phase ?? 'lainnya'
  category.value = task?.category || 'Perencanaan'
  due.value = task?.due_date ?? ''
  assignee.value = task?.assignee ?? ''
  notes.value = task?.notes ?? ''
})

// Suggest a due date from the phase until the person picks one themselves.
watch(phase, (p) => {
  if (dueTouched || !weddingDate) return
  const offset = PHASES.find((x) => x.value === p)?.offset ?? null
  due.value = offset === null ? '' : addDaysIso(weddingDate, offset)
})

const titleError = computed(() => (title.value.trim() ? null : 'Isi nama tugas.'))
const phaseOptions = PHASES.map((p) => ({ value: p.value, label: p.label }))
const categoryOptions = TASK_CATEGORIES.map((c) => ({ value: c, label: c }))

function submit() {
  touched.value = true
  if (titleError.value) {
    document.querySelector<HTMLElement>('#task-form [aria-invalid="true"]')?.focus()
    return
  }
  emit('save', {
    title: title.value.trim(),
    phase: phase.value,
    category: category.value,
    due_date: due.value || null,
    assignee: assignee.value.trim(),
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    side="right"
    :title="task ? 'Ubah tugas' : 'Tambah tugas'"
    description="Tugas persiapan beserta tenggat dan penanggung jawab."
  >
    <form id="task-form" class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <FormField v-slot="f" label="Tugas" :error="touched ? titleError : null">
        <TextInput
          :id="f.id"
          v-model="title"
          placeholder="Contoh: Booking MUA"
          autocomplete="off"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Waktu">
          <SelectInput :id="f.id" v-model="phase" :options="phaseOptions" />
        </FormField>
        <FormField v-slot="f" label="Kategori">
          <SelectInput :id="f.id" v-model="category" :options="categoryOptions" />
        </FormField>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField
          v-slot="f"
          label="Tenggat"
          optional
          :hint="weddingDate ? 'Terisi otomatis dari pilihan waktu.' : undefined"
        >
          <TextInput
            :id="f.id"
            v-model="due"
            placeholder="dd/mm/yyyy"
            type="date"
            :aria-describedby="f.describedby"
            @input="markDueTouched"
          />
        </FormField>
        <FormField v-slot="f" label="Penanggung jawab" optional>
          <TextInput
            :id="f.id"
            v-model="assignee"
            placeholder="Contoh: Ayu"
            list="task-people"
            autocomplete="off"
          />
          <datalist id="task-people">
            <option v-for="p in people" :key="p" :value="p" />
          </datalist>
        </FormField>
      </div>
      <FormField v-slot="f" label="Catatan" optional>
        <TextArea :id="f.id" v-model="notes" placeholder="Contoh: Minta penawaran dari 3 vendor" />
      </FormField>
    </form>
    <template #footer>
      <BaseButton @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="task-form" variant="primary" :loading="saving">
        {{ task ? 'Simpan perubahan' : 'Tambah tugas' }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

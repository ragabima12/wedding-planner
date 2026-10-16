<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { CEREMONY_OPTIONS } from '@/data/templates'
import { useWorkspace } from '@/composables/useWorkspace'
import { errorMessage, toast } from '@/composables/useToast'
import type { Ceremony, Wedding } from '@/types'

const { wedding, updateWedding, canEdit } = useWorkspace()

const name = ref('')
const partnerB = ref('')
const partnerA = ref('')
const date = ref('')
const city = ref('')
const total = ref<number | null>(null)
const guestTarget = ref('')
const paxPerInvite = ref('')
const buffer = ref('')
const contingency = ref('')
const ceremonies = ref<Ceremony[]>([])
const touched = ref(false)

function fill(w: Wedding | null) {
  if (!w) return
  name.value = w.name
  partnerB.value = w.partner_b
  partnerA.value = w.partner_a
  date.value = w.wedding_date ?? ''
  city.value = w.city
  total.value = w.total_budget || null
  guestTarget.value = w.guest_target ? String(w.guest_target) : ''
  paxPerInvite.value = String(w.pax_per_invite)
  buffer.value = String(w.catering_buffer_pct)
  contingency.value = String(w.contingency_pct)
  ceremonies.value = [...w.ceremonies]
}
watch(
  () => wedding.value?.id,
  () => fill(wedding.value),
  { immediate: true },
)

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))

const errors = computed(() => {
  const pax = num(paxPerInvite.value)
  const buf = num(buffer.value)
  const con = num(contingency.value)
  return {
    name: name.value.trim() ? null : 'Isi nama rencana, misalnya "Ayu & Bima".',
    pax: pax >= 1 && pax <= 10 ? null : 'Isi angka 1 sampai 10.',
    buffer: Number.isInteger(buf) && buf >= 0 && buf <= 100 ? null : 'Isi 0 sampai 100.',
    contingency: Number.isInteger(con) && con >= 0 && con <= 50 ? null : 'Isi 0 sampai 50.',
    ceremonies: ceremonies.value.length ? null : 'Pilih minimal satu jenis acara.',
  }
})

function toggle(c: Ceremony, on: boolean) {
  ceremonies.value = on ? [...ceremonies.value, c] : ceremonies.value.filter((x) => x !== c)
}

async function save() {
  touched.value = true
  if (Object.values(errors.value).some(Boolean)) {
    document.querySelector<HTMLElement>('#wedding-form [aria-invalid="true"]')?.focus()
    return
  }
  try {
    await updateWedding.mutateAsync({
      name: name.value.trim(),
      partner_b: partnerB.value.trim(),
      partner_a: partnerA.value.trim(),
      wedding_date: date.value || null,
      city: city.value.trim(),
      total_budget: total.value ?? 0,
      guest_target: Number(guestTarget.value) || 0,
      pax_per_invite: num(paxPerInvite.value),
      catering_buffer_pct: num(buffer.value),
      contingency_pct: num(contingency.value),
      ceremonies: ceremonies.value,
    })
    toast({ title: 'Data pernikahan tersimpan', tone: 'success' })
  } catch (e) {
    toast({ title: 'Belum tersimpan', description: errorMessage(e), tone: 'danger' })
  }
}
</script>

<template>
  <form id="wedding-form" class="flex flex-col gap-5" novalidate @submit.prevent="save">
    <fieldset :disabled="!canEdit" class="flex flex-col gap-5">
      <FormField v-slot="f" label="Nama rencana" :error="touched ? errors.name : null">
        <TextInput
          :id="f.id"
          v-model="name"
          placeholder="Contoh: Ayu & Rizky"
          autocomplete="off"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Mempelai wanita">
          <TextInput
            :id="f.id"
            v-model="partnerB"
            placeholder="Contoh: Ayu Lestari"
            autocomplete="off"
          />
        </FormField>
        <FormField v-slot="f" label="Mempelai pria">
          <TextInput
            :id="f.id"
            v-model="partnerA"
            placeholder="Contoh: Rizky Pratama"
            autocomplete="off"
          />
        </FormField>
        <FormField v-slot="f" label="Tanggal akad" optional>
          <TextInput :id="f.id" v-model="date" placeholder="dd/mm/yyyy" type="date" />
        </FormField>
        <FormField v-slot="f" label="Kota" optional>
          <TextInput
            :id="f.id"
            v-model="city"
            placeholder="Contoh: Yogyakarta"
            autocomplete="address-level2"
          />
        </FormField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Total anggaran" hint="Boleh ketik 150jt atau 1,2M.">
          <MoneyInput
            :id="f.id"
            v-model="total"
            placeholder="Contoh: 150jt"
            :aria-describedby="f.describedby"
          />
        </FormField>
        <FormField v-slot="f" label="Target jumlah undangan" optional>
          <TextInput
            :id="f.id"
            v-model="guestTarget"
            placeholder="Contoh: 300"
            type="number"
            inputmode="numeric"
            min="0"
          />
        </FormField>
        <FormField
          v-slot="f"
          label="Orang per undangan"
          hint="Umumnya 2 orang per undangan."
          :error="touched ? errors.pax : null"
        >
          <TextInput
            :id="f.id"
            v-model="paxPerInvite"
            placeholder="2"
            type="number"
            inputmode="decimal"
            min="1"
            max="10"
            step="0.5"
            :aria-invalid="f.invalid"
            :aria-describedby="f.describedby"
          />
        </FormField>
        <FormField
          v-slot="f"
          label="Cadangan porsi katering (%)"
          hint="Umumnya 10% untuk keluarga, panitia, kru vendor."
          :error="touched ? errors.buffer : null"
        >
          <TextInput
            :id="f.id"
            v-model="buffer"
            placeholder="10"
            type="number"
            inputmode="numeric"
            min="0"
            max="100"
            :aria-invalid="f.invalid"
            :aria-describedby="f.describedby"
          />
        </FormField>
        <FormField
          v-slot="f"
          label="Dana cadangan (%)"
          hint="Disarankan 5–10% dari total anggaran."
          :error="touched ? errors.contingency : null"
        >
          <TextInput
            :id="f.id"
            v-model="contingency"
            placeholder="10"
            type="number"
            inputmode="numeric"
            min="0"
            max="50"
            :aria-invalid="f.invalid"
            :aria-describedby="f.describedby"
          />
        </FormField>
      </div>

      <fieldset>
        <legend class="text-sm font-medium">Jenis acara</legend>
        <p class="mt-1 text-xs text-fg-muted">
          Mengubah ini tidak menambah acara atau tugas yang sudah dibuat.
        </p>
        <div class="mt-3 grid gap-2 sm:grid-cols-3">
          <label
            v-for="c in CEREMONY_OPTIONS"
            :key="c.value"
            class="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-bg-subtle has-[:checked]:border-primary"
          >
            <BaseCheckbox
              :model-value="ceremonies.includes(c.value)"
              class="mt-0.5"
              @update:model-value="toggle(c.value, $event)"
            />
            <span class="min-w-0">
              <span class="block text-sm font-medium">{{ c.label }}</span>
              <span class="block text-xs text-fg-muted">{{ c.hint }}</span>
            </span>
          </label>
        </div>
        <p v-if="touched && errors.ceremonies" class="mt-2 text-xs font-medium text-danger">
          {{ errors.ceremonies }}
        </p>
      </fieldset>
    </fieldset>

    <div v-if="canEdit" class="flex justify-end">
      <BaseButton type="submit" variant="primary" :loading="updateWedding.isPending.value">
        Simpan data pernikahan
      </BaseButton>
    </div>
  </form>
</template>

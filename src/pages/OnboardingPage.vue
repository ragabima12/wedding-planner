<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { CEREMONY_OPTIONS } from '@/data/templates'
import { useWorkspace } from '@/composables/useWorkspace'
import { errorMessage } from '@/composables/useToast'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { seedWedding } from '@/lib/seed'
import { todayIso } from '@/lib/format'
import type { Ceremony } from '@/types'

const router = useRouter()
const qc = useQueryClient()
const { select, weddings } = useWorkspace()

const mode = ref<'create' | 'join'>('create')

const partnerA = ref('')
const partnerB = ref('')
const date = ref('')
const city = ref('')
const total = ref<number | null>(null)
const guests = ref('')
const ceremonies = ref<Ceremony[]>(['islam'])

const touched = ref(false)
const saving = ref(false)
const formError = ref<string | null>(null)

const errors = computed(() => ({
  partnerA: partnerA.value.trim() ? null : 'Isi nama mempelai pria.',
  partnerB: partnerB.value.trim() ? null : 'Isi nama mempelai wanita.',
  date:
    date.value && date.value < todayIso() ? 'Tanggal sudah lewat. Pilih tanggal mendatang.' : null,
  ceremonies: ceremonies.value.length ? null : 'Pilih minimal satu jenis acara.',
}))
const valid = computed(() => Object.values(errors.value).every((e) => !e))

function toggleCeremony(c: Ceremony, on: boolean) {
  ceremonies.value = on ? [...ceremonies.value, c] : ceremonies.value.filter((x) => x !== c)
}

async function create() {
  touched.value = true
  if (!valid.value || !auth.me) {
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  saving.value = true
  formError.value = null
  try {
    const w = await db.createWedding(
      {
        name: `${partnerB.value.trim().split(' ')[0]} & ${partnerA.value.trim().split(' ')[0]}`,
        partner_a: partnerA.value.trim(),
        partner_b: partnerB.value.trim(),
        wedding_date: date.value || null,
        city: city.value.trim(),
        total_budget: total.value ?? 0,
        guest_target: Number(guests.value) || 0,
        ceremonies: ceremonies.value,
      },
      auth.me,
    )
    await seedWedding(w.id, {
      totalBudget: total.value ?? 0,
      weddingDate: date.value || null,
      ceremonies: ceremonies.value,
    })
    select(w.id)
    await qc.invalidateQueries({ queryKey: ['weddings'] })
    router.replace('/')
  } catch (e) {
    formError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

const code = ref('')
const joinError = ref<string | null>(null)
function join() {
  if (!code.value.trim()) {
    joinError.value = 'Masukkan kode undangan 8 karakter dari pemilik rencana.'
    return
  }
  router.push(`/gabung/${code.value.trim().toUpperCase()}`)
}
</script>

<template>
  <AuthLayout
    title="Mulai rencana pernikahan"
    description="Isi data dasar. Kategori anggaran, acara adat, dan checklist akan disiapkan otomatis, semuanya bisa diubah nanti."
  >
    <BaseCard class="w-full max-w-xl">
      <div class="grid grid-cols-2 border-b border-border p-1" role="tablist" aria-label="Pilihan">
        <button
          v-for="m in [
            { v: 'create', l: 'Buat rencana baru' },
            { v: 'join', l: 'Punya kode undangan' },
          ] as const"
          :key="m.v"
          type="button"
          role="tab"
          :aria-selected="mode === m.v"
          :class="[
            'h-11 rounded-md text-sm font-medium',
            mode === m.v ? 'bg-primary-soft text-primary-strong' : 'text-fg-muted hover:text-fg',
          ]"
          @click="mode = m.v"
        >
          {{ m.l }}
        </button>
      </div>

      <form
        v-if="mode === 'create'"
        class="flex flex-col gap-6 p-5 sm:p-6"
        novalidate
        @submit.prevent="create"
      >
        <fieldset class="grid gap-4 sm:grid-cols-2">
          <legend class="mb-3 text-sm font-semibold">Mempelai</legend>
          <FormField
            v-slot="f"
            label="Nama mempelai wanita"
            :error="touched ? errors.partnerB : null"
          >
            <TextInput
              :id="f.id"
              v-model="partnerB"
              placeholder="Contoh: Ayu Lestari"
              autocomplete="off"
              :aria-invalid="f.invalid"
              :aria-describedby="f.describedby"
            />
          </FormField>
          <FormField
            v-slot="f"
            label="Nama mempelai pria"
            :error="touched ? errors.partnerA : null"
          >
            <TextInput
              :id="f.id"
              v-model="partnerA"
              placeholder="Contoh: Rizky Pratama"
              autocomplete="off"
              :aria-invalid="f.invalid"
              :aria-describedby="f.describedby"
            />
          </FormField>
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormField
            v-slot="f"
            label="Tanggal akad"
            optional
            hint="Dipakai untuk menghitung tenggat checklist."
            :error="touched ? errors.date : null"
          >
            <TextInput
              :id="f.id"
              v-model="date"
              placeholder="dd/mm/yyyy"
              type="date"
              :min="todayIso()"
              :aria-invalid="f.invalid"
              :aria-describedby="f.describedby"
            />
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

        <fieldset>
          <legend class="text-sm font-semibold">Jenis acara</legend>
          <p class="mt-1 text-xs text-fg-muted">
            Menentukan urutan acara dan tugas adat yang disiapkan.
          </p>
          <div class="mt-3 grid gap-2">
            <label
              v-for="c in CEREMONY_OPTIONS"
              :key="c.value"
              class="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-bg-subtle has-[:checked]:border-primary has-[:checked]:bg-primary-soft/50"
            >
              <BaseCheckbox
                :model-value="ceremonies.includes(c.value)"
                class="mt-0.5"
                @update:model-value="toggleCeremony(c.value, $event)"
              />
              <span>
                <span class="block text-sm font-medium">{{ c.label }}</span>
                <span class="block text-xs text-fg-muted">{{ c.hint }}</span>
              </span>
            </label>
          </div>
          <p v-if="touched && errors.ceremonies" class="mt-2 text-xs font-medium text-danger">
            {{ errors.ceremonies }}
          </p>
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormField
            v-slot="f"
            label="Total anggaran"
            optional
            hint="Boleh ketik 150jt atau 1,2M. Bisa diisi nanti."
          >
            <MoneyInput
              :id="f.id"
              v-model="total"
              placeholder="Contoh: 150jt"
              :aria-describedby="f.describedby"
            />
          </FormField>
          <FormField
            v-slot="f"
            label="Perkiraan jumlah undangan"
            optional
            hint="1 undangan ≈ 2 orang."
          >
            <TextInput
              :id="f.id"
              v-model="guests"
              placeholder="Contoh: 300"
              type="number"
              inputmode="numeric"
              min="0"
              :aria-describedby="f.describedby"
            />
          </FormField>
        </div>

        <p v-if="formError" role="alert" class="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {{ formError }}
        </p>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <BaseButton v-if="weddings.data.value?.length" variant="ghost" @click="router.push('/')">
            Kembali ke rencana yang ada
          </BaseButton>
          <span v-else />
          <BaseButton type="submit" variant="primary" size="lg" :loading="saving">
            {{ saving ? 'Menyiapkan…' : 'Buat rencana' }}
          </BaseButton>
        </div>
      </form>

      <form v-else class="flex flex-col gap-4 p-5 sm:p-6" novalidate @submit.prevent="join">
        <FormField
          v-slot="f"
          label="Kode undangan"
          hint="Minta kode ke pemilik rencana (menu Pengaturan → Anggota)."
          :error="joinError"
        >
          <TextInput
            :id="f.id"
            v-model="code"
            placeholder="Contoh: A1B2C3D4"
            autocomplete="off"
            autocapitalize="characters"
            maxlength="8"
            class="font-mono tracking-widest uppercase"
            :aria-invalid="f.invalid"
            :aria-describedby="f.describedby"
          />
        </FormField>
        <BaseButton type="submit" variant="primary" size="lg">Gabung</BaseButton>
      </form>
    </BaseCard>
  </AuthLayout>
</template>

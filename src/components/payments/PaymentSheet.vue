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
import { useRowMutations } from '@/composables/useRows'
import { toast } from '@/composables/useToast'
import { todayIso } from '@/lib/format'
import type { Category, Payment, Vendor } from '@/types'
import { PAYMENT_METHODS } from './paymentOptions'

const { payment, vendors, categories, vendorId, categoryId } = defineProps<{
  /** Existing payment to edit; null creates a new one. */
  payment: Payment | null
  vendors: Vendor[]
  categories: Category[]
  /** Defaults for a new payment. */
  vendorId?: string | null
  categoryId?: string | null
}>()
const open = defineModel<boolean>('open', { default: false })

const { insert, update } = useRowMutations('payments', 'Pembayaran')

const label = ref('')
const amount = ref<number | null>(null)
const dueDate = ref('')
const paid = ref(false)
const paidAt = ref('')
const method = ref('')
const vendor = ref('')
const category = ref('')
const notes = ref('')
const touched = ref(false)

watch(open, (o) => {
  if (!o) return
  touched.value = false
  const p = payment
  label.value = p?.label ?? ''
  amount.value = p?.amount ?? null
  dueDate.value = p?.due_date ?? ''
  paid.value = !!p?.paid_at
  paidAt.value = p?.paid_at ?? todayIso()
  method.value = p?.method ?? ''
  vendor.value = p?.vendor_id ?? vendorId ?? ''
  category.value = p?.category_id ?? categoryId ?? ''
  notes.value = p?.notes ?? ''
})

// Picking a vendor fills its category when none is chosen yet.
watch(vendor, (v) => {
  const cat = vendors.find((x) => x.id === v)?.category_id
  if (cat && !category.value) category.value = cat
})

const vendorOptions = computed(() => [
  { value: '', label: 'Tanpa vendor' },
  ...vendors.map((v) => ({ value: v.id, label: v.name })),
])
const categoryOptions = computed(() => [
  { value: '', label: 'Tanpa kategori' },
  ...categories.map((c) => ({ value: c.id, label: c.name })),
])

const errors = computed(() => ({
  label: label.value.trim() ? null : 'Isi nama pembayaran, misalnya "DP" atau "Mahar".',
  amount: amount.value && amount.value > 0 ? null : 'Isi jumlah lebih dari Rp 0.',
}))
const saving = computed(() => insert.isPending.value || update.isPending.value)

async function save() {
  touched.value = true
  if (errors.value.label || errors.value.amount) return
  const row = {
    label: label.value.trim(),
    amount: amount.value ?? 0,
    due_date: dueDate.value || null,
    paid_at: paid.value ? paidAt.value || todayIso() : null,
    method: method.value,
    vendor_id: vendor.value || null,
    category_id: category.value || null,
    notes: notes.value.trim(),
  }
  if (payment) await update.mutateAsync({ id: payment.id, patch: row })
  else await insert.mutateAsync([row])
  toast({ title: payment ? 'Pembayaran diperbarui' : 'Pembayaran ditambahkan', tone: 'success' })
  open.value = false
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    side="right"
    :title="payment ? 'Ubah pembayaran' : 'Tambah pembayaran'"
    description="Catat DP, termin, pelunasan, atau biaya lain seperti mahar dan biaya KUA."
  >
    <form id="payment-form" class="flex flex-col gap-4" novalidate @submit.prevent="save">
      <FormField
        v-slot="f"
        label="Nama pembayaran"
        :error="touched ? errors.label : null"
        hint="Contoh: DP (30%), Pelunasan, Biaya nikah di luar KUA."
      >
        <TextInput
          :id="f.id"
          v-model="label"
          placeholder="Contoh: DP 30%"
          autocomplete="off"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <FormField v-slot="f" label="Jumlah" :error="touched ? errors.amount : null">
        <MoneyInput
          :id="f.id"
          v-model="amount"
          placeholder="Contoh: 15jt"
          :aria-invalid="f.invalid"
          :aria-describedby="f.describedby"
        />
      </FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Jatuh tempo" optional>
          <TextInput :id="f.id" v-model="dueDate" placeholder="dd/mm/yyyy" type="date" />
        </FormField>
        <FormField v-slot="f" label="Metode" optional>
          <SelectInput :id="f.id" v-model="method" :options="PAYMENT_METHODS" />
        </FormField>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="f" label="Vendor" optional>
          <SelectInput :id="f.id" v-model="vendor" :options="vendorOptions" />
        </FormField>
        <FormField v-slot="f" label="Kategori anggaran" optional>
          <SelectInput :id="f.id" v-model="category" :options="categoryOptions" />
        </FormField>
      </div>
      <div class="flex flex-col gap-3 rounded-md border border-border p-3">
        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <BaseCheckbox v-model="paid" />
          Sudah dibayar
        </label>
        <FormField v-if="paid" v-slot="f" label="Tanggal bayar">
          <TextInput
            :id="f.id"
            v-model="paidAt"
            placeholder="dd/mm/yyyy"
            type="date"
            :max="todayIso()"
          />
        </FormField>
      </div>
      <FormField
        v-slot="f"
        label="Catatan"
        optional
        hint="Misalnya nomor rekening tujuan atau bukti transfer."
      >
        <TextArea
          :id="f.id"
          v-model="notes"
          placeholder="Contoh: Transfer ke rekening atas nama usaha vendor"
          :aria-describedby="f.describedby"
        />
      </FormField>
    </form>
    <template #footer>
      <BaseButton @click="open = false">Batal</BaseButton>
      <BaseButton type="submit" form="payment-form" variant="primary" :loading="saving">
        {{ payment ? 'Simpan perubahan' : 'Tambah pembayaran' }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

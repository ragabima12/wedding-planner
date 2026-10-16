<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { CalendarPlus, ExternalLink, Plus, ShieldCheck } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import TextArea from '@/components/ui/TextArea.vue'
import TextInput from '@/components/ui/TextInput.vue'
import PaymentRow from '@/components/payments/PaymentRow.vue'
import PaymentSheet from '@/components/payments/PaymentSheet.vue'
import { useMarkPaid } from '@/components/payments/useMarkPaid'
import { useRowMutations } from '@/composables/useRows'
import { toast } from '@/composables/useToast'
import { paymentPlan } from '@/data/templates'
import { formatNumber, formatRupiah, todayIso } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { Category, Payment, Vendor, VendorStatus } from '@/types'
import { instagramUrl, VENDOR_STATUS, whatsappUrl } from './vendorOptions'

const { vendor, categories, vendors, payments, weddingDate, canEdit } = defineProps<{
  vendor: Vendor | null
  categories: Category[]
  vendors: Vendor[]
  /** Payments of this vendor. */
  payments: Payment[]
  weddingDate: string | null
  canEdit: boolean
}>()
const emit = defineEmits<{ created: [vendor: Vendor]; deleted: [] }>()
const open = defineModel<boolean>('open', { default: false })

const qc = useQueryClient()
const vendorsMut = useRowMutations('vendors', 'Vendor', { undo: false })
const paymentsMut = useRowMutations('payments', 'Pembayaran')
const { setPaid } = useMarkPaid()

const name = ref('')
const category = ref('')
const status = ref<VendorStatus>('survei')
const contract = ref<number | null>(null)
const contactName = ref('')
const phone = ref('')
const instagram = ref('')
const notes = ref('')
const touched = ref(false)

function fill() {
  touched.value = false
  name.value = vendor?.name ?? ''
  category.value = vendor?.category_id ?? ''
  status.value = vendor?.status ?? 'survei'
  contract.value = vendor ? vendor.contract_total || null : null
  contactName.value = vendor?.contact_name ?? ''
  phone.value = vendor?.phone ?? ''
  instagram.value = vendor?.instagram ?? ''
  notes.value = vendor?.notes ?? ''
}
watch(open, (o) => o && fill())
watch(
  () => vendor?.id,
  () => open.value && fill(),
)

const categoryOptions = computed(() => [
  { value: '', label: 'Pilih kategori' },
  ...categories.map((c) => ({ value: c.id, label: c.name })),
])
const nameError = computed(() => (name.value.trim() ? null : 'Isi nama vendor.'))
const wa = computed(() => whatsappUrl(phone.value))
const ig = computed(() => instagramUrl(instagram.value))

const paid = computed(() =>
  sum(
    payments.filter((p) => p.paid_at),
    (p) => p.amount,
  ),
)
const scheduled = computed(() => sum(payments, (p) => p.amount))
const contractTotal = computed(() => vendor?.contract_total ?? 0)
const sortedPayments = computed(() =>
  payments.slice().sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')),
)

async function save() {
  touched.value = true
  if (nameError.value) return
  const row = {
    name: name.value.trim(),
    category_id: category.value || null,
    status: status.value,
    contract_total: contract.value ?? 0,
    contact_name: contactName.value.trim(),
    phone: phone.value.trim(),
    instagram: instagram.value.trim(),
    notes: notes.value.trim(),
  }
  if (vendor) {
    await vendorsMut.update.mutateAsync({ id: vendor.id, patch: row })
    toast({ title: 'Vendor disimpan', tone: 'success' })
  } else {
    const [created] = await vendorsMut.insert.mutateAsync([row])
    toast({ title: `${row.name} ditambahkan`, tone: 'success' })
    if (created) emit('created', created)
  }
}

const planBlocked = computed(() =>
  !contractTotal.value
    ? 'Isi dan simpan nilai kontrak dulu untuk membuat jadwal termin.'
    : !weddingDate
      ? 'Isi tanggal akad di Pengaturan agar tanggal termin bisa dihitung.'
      : null,
)

async function makePlan() {
  if (!vendor || planBlocked.value) return
  const plan = paymentPlan(contractTotal.value, weddingDate, todayIso())
  await paymentsMut.insert.mutateAsync(
    plan.map((p) => ({
      ...p,
      vendor_id: vendor.id,
      category_id: vendor.category_id,
      paid_at: null,
      method: '',
      notes: '',
    })),
  )
  toast({ title: `Jadwal ${plan.length} termin dibuat untuk ${vendor.name}`, tone: 'success' })
}

const paymentOpen = ref(false)
const editingPayment = ref<Payment | null>(null)
function addPayment() {
  editingPayment.value = null
  paymentOpen.value = true
}
function editPayment(p: Payment) {
  editingPayment.value = p
  paymentOpen.value = true
}

const confirmOpen = ref(false)
async function deleteVendor() {
  if (!vendor) return
  await vendorsMut.remove.mutateAsync([vendor])
  // payments cascade-deleted, linked budget items unlinked
  await qc.invalidateQueries({ queryKey: ['rows'] })
  confirmOpen.value = false
  open.value = false
  emit('deleted')
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    side="right"
    :title="vendor ? vendor.name : 'Tambah vendor'"
    :description="
      vendor
        ? 'Detail, kontak, dan jadwal pembayaran vendor.'
        : 'Catat vendor yang sedang disurvei atau sudah deal.'
    "
  >
    <div class="flex flex-col gap-8">
      <form id="vendor-form" class="flex flex-col gap-4" novalidate @submit.prevent="save">
        <fieldset :disabled="!canEdit" class="flex flex-col gap-4">
          <FormField v-slot="f" label="Nama vendor" :error="touched ? nameError : null">
            <TextInput
              :id="f.id"
              v-model="name"
              placeholder="Contoh: Dapur Ndalem Catering"
              autocomplete="organization"
              :aria-invalid="f.invalid"
              :aria-describedby="f.describedby"
            />
          </FormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-slot="f" label="Kategori anggaran" optional>
              <SelectInput :id="f.id" v-model="category" :options="categoryOptions" />
            </FormField>
            <FormField v-slot="f" label="Status">
              <SelectInput :id="f.id" v-model="status" :options="VENDOR_STATUS" />
            </FormField>
          </div>
          <FormField
            v-slot="f"
            label="Nilai kontrak"
            optional
            hint="Total harga yang disepakati. Dipakai untuk jadwal termin."
          >
            <MoneyInput
              :id="f.id"
              v-model="contract"
              placeholder="Contoh: 45jt"
              :aria-describedby="f.describedby"
            />
          </FormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <FormField v-slot="f" label="Nama kontak" optional>
              <TextInput
                :id="f.id"
                v-model="contactName"
                placeholder="Contoh: Bu Ratna"
                autocomplete="name"
              />
            </FormField>
            <FormField v-slot="f" label="No. WhatsApp" optional>
              <TextInput
                :id="f.id"
                v-model="phone"
                placeholder="Contoh: 0812 3456 7890"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
              />
            </FormField>
          </div>
          <FormField v-slot="f" label="Instagram" optional hint="Contoh: @namavendor">
            <TextInput
              :id="f.id"
              v-model="instagram"
              placeholder="Contoh: @namavendor"
              autocomplete="off"
              :aria-describedby="f.describedby"
            />
          </FormField>
          <div v-if="wa || ig" class="flex flex-wrap gap-2">
            <a
              v-if="wa"
              :href="wa"
              target="_blank"
              rel="noopener"
              class="inline-flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-primary-strong hover:bg-bg-subtle"
            >
              Chat WhatsApp
              <ExternalLink class="size-4" aria-hidden="true" />
              <span class="sr-only">(tab baru)</span>
            </a>
            <a
              v-if="ig"
              :href="ig.url"
              target="_blank"
              rel="noopener"
              class="inline-flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-primary-strong hover:bg-bg-subtle"
            >
              {{ ig.handle }}
              <ExternalLink class="size-4" aria-hidden="true" />
              <span class="sr-only">(tab baru)</span>
            </a>
          </div>
          <FormField
            v-slot="f"
            label="Catatan"
            optional
            hint="Isi paket, hasil negosiasi, syarat pembatalan."
          >
            <TextArea
              :id="f.id"
              v-model="notes"
              placeholder="Contoh: Sudah termasuk 2x food tasting"
              :aria-describedby="f.describedby"
            />
          </FormField>
        </fieldset>
      </form>

      <section v-if="vendor" aria-labelledby="vendor-payments" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 id="vendor-payments" class="text-sm font-semibold">Pembayaran</h3>
          <div v-if="canEdit" class="flex flex-wrap gap-2">
            <BaseButton
              v-if="!payments.length"
              size="sm"
              :disabled="!!planBlocked"
              :loading="paymentsMut.insert.isPending.value"
              aria-describedby="plan-hint"
              @click="makePlan"
            >
              <CalendarPlus aria-hidden="true" />
              Buat jadwal termin
            </BaseButton>
            <BaseButton size="sm" @click="addPayment">
              <Plus aria-hidden="true" />
              Tambah
            </BaseButton>
          </div>
        </div>
        <p v-if="canEdit && !payments.length" id="plan-hint" class="text-xs text-fg-muted">
          {{
            planBlocked ??
            'DP 30% hari ini, termin 40% di H-45, pelunasan 30% di H-14. Bisa diubah setelah dibuat.'
          }}
        </p>

        <div v-if="contractTotal" class="flex flex-col gap-2 rounded-md bg-bg-subtle p-3">
          <div class="flex items-baseline justify-between gap-4 text-sm">
            <span class="text-fg-muted">Dibayar</span>
            <span class="font-semibold tabular-nums">
              {{ formatRupiah(paid) }}
              <span class="font-normal text-fg-muted">dari {{ formatRupiah(contractTotal) }}</span>
            </span>
          </div>
          <ProgressBar
            :value="paid"
            :max="contractTotal"
            tone="success"
            :label="`Dibayar ${formatRupiah(paid)} dari ${formatRupiah(contractTotal)}`"
          />
          <p v-if="scheduled !== contractTotal && payments.length" class="text-xs text-warning">
            Total jadwal {{ formatRupiah(scheduled) }} berbeda dengan nilai kontrak.
          </p>
        </div>

        <ul
          v-if="payments.length"
          class="-mx-4 divide-y divide-border rounded-md border border-border sm:mx-0"
        >
          <PaymentRow
            v-for="p in sortedPayments"
            :key="p.id"
            :payment="p"
            :can-edit="canEdit"
            @paid="setPaid(p, $event)"
            @edit="editPayment(p)"
            @remove="paymentsMut.remove.mutate([p])"
          />
        </ul>
        <p v-else-if="!canEdit" class="text-sm text-fg-muted">Belum ada pembayaran.</p>

        <p class="flex gap-2 rounded-md bg-info-soft p-3 text-xs text-fg">
          <ShieldCheck class="size-4 shrink-0 text-info" aria-hidden="true" />
          <span>
            Bayar langsung ke rekening vendor atas nama usahanya, simpan bukti transfer. Pastikan
            vendor sudah menerima DP, terutama jika lewat WO.
          </span>
        </p>
      </section>

      <section v-if="vendor && canEdit" class="border-t border-border pt-6">
        <BaseButton variant="danger-ghost" @click="confirmOpen = true">Hapus vendor</BaseButton>
      </section>
    </div>

    <template v-if="canEdit" #footer>
      <BaseButton @click="open = false">{{ vendor ? 'Tutup' : 'Batal' }}</BaseButton>
      <BaseButton
        type="submit"
        form="vendor-form"
        variant="primary"
        :loading="vendorsMut.insert.isPending.value || vendorsMut.update.isPending.value"
      >
        {{ vendor ? 'Simpan perubahan' : 'Tambah vendor' }}
      </BaseButton>
    </template>
  </BaseDialog>

  <PaymentSheet
    v-model:open="paymentOpen"
    :payment="editingPayment"
    :vendors="vendors"
    :categories="categories"
    :vendor-id="vendor?.id ?? null"
    :category-id="vendor?.category_id ?? null"
  />

  <ConfirmDialog
    v-if="vendor"
    v-model:open="confirmOpen"
    :title="`Hapus ${vendor.name}?`"
    :description="
      payments.length
        ? `${formatNumber(payments.length)} pembayaran milik vendor ini ikut terhapus. Tindakan ini tidak bisa dibatalkan.`
        : 'Vendor dihapus dari daftar. Rincian anggaran yang terhubung tetap ada. Tindakan ini tidak bisa dibatalkan.'
    "
    confirm-label="Hapus vendor"
    :loading="vendorsMut.remove.isPending.value"
    @confirm="deleteVendor"
  />
</template>

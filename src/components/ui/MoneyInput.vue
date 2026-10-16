<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatNumber, formatRupiah, parseRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { inputClass } from './inputClass'

defineOptions({ inheritAttrs: false })
const { class: klass } = defineProps<{ class?: string }>()
const emit = defineEmits<{ commit: [value: number | null] }>()
const model = defineModel<number | null>({ default: null })

const text = ref(model.value === null ? '' : formatNumber(model.value))
const focused = ref(false)
const parsed = ref<number | null>(model.value)

watch(model, (v) => {
  if (!focused.value) text.value = v === null ? '' : formatNumber(v)
})

function onInput(e: Event) {
  text.value = (e.target as HTMLInputElement).value
  parsed.value = parseRupiah(text.value)
  model.value = parsed.value
}

function onBlur() {
  focused.value = false
  text.value = model.value === null ? '' : formatNumber(model.value)
  emit('commit', model.value)
}
</script>

<template>
  <div :class="cn('relative min-w-0', klass)">
    <span
      class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-fg-muted"
      aria-hidden="true"
      >Rp</span
    >
    <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- label comes from the caller via id/aria -->
    <input
      v-bind="$attrs"
      :value="text"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :class="cn(inputClass, 'pl-9 text-right tabular-nums')"
      @input="onInput"
      @focus="focused = true"
      @blur="onBlur"
      @keydown.enter="($event.target as HTMLInputElement).blur()"
    />
    <span
      v-if="focused && text && parsed !== null && /[a-z]/i.test(text)"
      class="absolute top-full right-0 z-10 mt-1 rounded-sm bg-fg px-2 py-0.5 text-xs text-bg tabular-nums"
      >= {{ formatRupiah(parsed) }}</span
    >
  </div>
</template>

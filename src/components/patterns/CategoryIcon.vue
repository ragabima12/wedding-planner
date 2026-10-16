<script setup lang="ts">
import { computed } from 'vue'
import {
  Building2,
  Camera,
  ClipboardList,
  Flower2,
  Gem,
  Gift,
  Landmark,
  Mail,
  Music,
  Plane,
  Shield,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from 'lucide-vue-next'

const { name } = defineProps<{ name: string }>()

const map = {
  utensils: UtensilsCrossed,
  building: Building2,
  flower: Flower2,
  shirt: Shirt,
  camera: Camera,
  music: Music,
  mail: Mail,
  gift: Gift,
  clipboard: ClipboardList,
  gem: Gem,
  sparkles: Sparkles,
  landmark: Landmark,
  shield: Shield,
  plane: Plane,
  wallet: Wallet,
}
const icon = computed(() => map[name as keyof typeof map] ?? Wallet)
</script>

<template>
  <span
    class="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong"
    aria-hidden="true"
  >
    <component :is="icon" class="size-[18px]" />
  </span>
</template>

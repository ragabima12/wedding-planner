<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import AppToaster from '@/components/patterns/AppToaster.vue'
import { env } from '@/lib/env'

const ClerkBridge = env.isDemo
  ? null
  : defineAsyncComponent(() => import('@/components/patterns/ClerkBridge.vue'))
</script>

<template>
  <component :is="ClerkBridge" v-if="ClerkBridge" />
  <RouterView />
  <AppToaster />
</template>

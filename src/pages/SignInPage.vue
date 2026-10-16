<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SignIn } from '@clerk/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const redirect = computed(() => (route.query.redirect as string) || '/')
</script>

<template>
  <AuthLayout
    title="Masuk ke Rencana Nikah"
    description="Anggaran, vendor, tamu, dan checklist pernikahan, dikelola bersama keluarga."
  >
    <SignIn path="/masuk" routing="path" sign-up-url="/daftar" :force-redirect-url="redirect" />
  </AuthLayout>
</template>

<script setup lang="ts">
import { SignUp } from '@clerk/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
</script>

<template>
  <AuthLayout
    title="Buat akun"
    description="Satu akun per orang. Pasangan dan keluarga bisa diundang setelah ini."
  >
    <SignUp path="/daftar" routing="path" sign-in-url="/masuk" fallback-redirect-url="/mulai" />
  </AuthLayout>
</template>

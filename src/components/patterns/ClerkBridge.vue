<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAuth, useClerk, useUser } from '@clerk/vue'
import { auth, connectAuth } from '@/lib/auth'

// Copies Clerk state into the app-wide auth store so the rest of the app stays Clerk-agnostic.
const { isLoaded, isSignedIn, getToken } = useAuth()
const { user } = useUser()
const clerk = useClerk()

connectAuth(
  async () => (await getToken.value()) ?? null,
  async () => {
    await clerk.value?.signOut({ redirectUrl: '/masuk' })
  },
)

watchEffect(() => {
  const u = user.value
  auth.me = u
    ? {
        id: u.id,
        name:
          u.fullName ||
          u.firstName ||
          u.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'Tanpa nama',
        email: u.primaryEmailAddress?.emailAddress ?? '',
        imageUrl: u.imageUrl ?? null,
      }
    : null
  auth.isSignedIn = !!isSignedIn.value
  auth.isLoaded = !!isLoaded.value
})
</script>

<template>
  <span hidden />
</template>

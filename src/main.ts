import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { clerkPlugin } from '@clerk/vue'
import { idID } from '@clerk/localizations'
import App from './App.vue'
import { router } from './router'
import { env } from './lib/env'
import './assets/main.css'

const app = createApp(App)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
  },
})
app.use(VueQueryPlugin, { queryClient })

if (!env.isDemo) {
  app.use(clerkPlugin, {
    publishableKey: env.clerkKey,
    localization: {
      ...idID,
      formFieldInputPlaceholder__emailAddress: 'nama@email.com',
      formFieldInputPlaceholder__emailAddress_username: 'nama@email.com',
      formFieldInputPlaceholder__password: 'Masukkan kata sandi',
      formFieldInputPlaceholder__signUpPassword: 'Buat kata sandi',
      formFieldInputPlaceholder__firstName: 'Contoh: Ayu',
      formFieldInputPlaceholder__lastName: 'Contoh: Lestari',
      formFieldInputPlaceholder__username: 'Contoh: ayulestari',
      formFieldInputPlaceholder__phoneNumber: 'Contoh: 0812 3456 7890',
      formFieldInputPlaceholder__backupCode: 'Masukkan kode cadangan',
    },
    signInUrl: '/masuk',
    signUpUrl: '/daftar',
    signInFallbackRedirectUrl: '/',
    signUpFallbackRedirectUrl: '/mulai',
    appearance: {
      variables: { colorPrimary: '#6d3a96', borderRadius: '8px', fontFamily: 'Inter Variable' },
    },
  })
}

app.use(router)
app.mount('#app')

import { createRouter, createWebHistory } from 'vue-router'
import { auth, whenAuthLoaded } from './lib/auth'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/masuk/:rest(.*)*',
      name: 'masuk',
      component: () => import('./pages/SignInPage.vue'),
      meta: { public: true, title: 'Masuk' },
    },
    {
      path: '/daftar/:rest(.*)*',
      name: 'daftar',
      component: () => import('./pages/SignUpPage.vue'),
      meta: { public: true, title: 'Daftar' },
    },
    {
      path: '/mulai',
      name: 'mulai',
      component: () => import('./pages/OnboardingPage.vue'),
      meta: { title: 'Mulai rencana' },
    },
    {
      path: '/gabung/:code',
      name: 'gabung',
      component: () => import('./pages/JoinPage.vue'),
      meta: { title: 'Gabung' },
    },
    {
      path: '/',
      component: () => import('./layouts/AppShell.vue'),
      children: [
        {
          path: '',
          name: 'ringkasan',
          component: () => import('./pages/OverviewPage.vue'),
          meta: { title: 'Ringkasan' },
        },
        {
          path: 'acara',
          name: 'acara',
          component: () => import('./pages/EventsPage.vue'),
          meta: { title: 'Acara' },
        },
        {
          path: 'anggaran',
          name: 'anggaran',
          component: () => import('./pages/BudgetPage.vue'),
          meta: { title: 'Anggaran' },
        },
        {
          path: 'vendor',
          name: 'vendor',
          component: () => import('./pages/VendorsPage.vue'),
          meta: { title: 'Vendor' },
        },
        {
          path: 'pembayaran',
          name: 'pembayaran',
          component: () => import('./pages/PaymentsPage.vue'),
          meta: { title: 'Pembayaran' },
        },
        {
          path: 'tamu',
          name: 'tamu',
          component: () => import('./pages/GuestsPage.vue'),
          meta: { title: 'Tamu' },
        },
        {
          path: 'checklist',
          name: 'checklist',
          component: () => import('./pages/ChecklistPage.vue'),
          meta: { title: 'Checklist' },
        },
        {
          path: 'panduan',
          name: 'panduan',
          component: () => import('./pages/GuidePage.vue'),
          meta: { title: 'Panduan' },
        },
        {
          path: 'pengaturan',
          name: 'pengaturan',
          component: () => import('./pages/SettingsPage.vue'),
          meta: { title: 'Pengaturan' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  await whenAuthLoaded()
  if (!to.meta.public && !auth.isSignedIn)
    return { name: 'masuk', query: { redirect: to.fullPath } }
  if (to.meta.public && auth.isSignedIn && to.name === 'masuk') return '/'
})

router.afterEach((to) => {
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} · Rencana Nikah` : 'Rencana Nikah'
})

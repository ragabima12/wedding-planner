<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIsMutating, useQueryClient } from '@tanstack/vue-query'
import { useDark, useDebounceFn, useMediaQuery, useToggle } from '@vueuse/core'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import {
  BookOpen,
  CalendarHeart,
  Check,
  CloudOff,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  Store,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-vue-next'
import { useOnline } from '@vueuse/core'
import { useWorkspace } from '@/composables/useWorkspace'
import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { daysUntil, formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import SkeletonRows from '@/components/patterns/SkeletonRows.vue'
import ErrorState from '@/components/patterns/ErrorState.vue'

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()
const { weddings, wedding, weddingId, role } = useWorkspace()

const nav = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/acara', label: 'Acara', icon: CalendarHeart },
  { to: '/anggaran', label: 'Anggaran', icon: Wallet },
  { to: '/vendor', label: 'Vendor', icon: Store },
  { to: '/pembayaran', label: 'Pembayaran', icon: Receipt },
  { to: '/tamu', label: 'Tamu', icon: Users },
  { to: '/checklist', label: 'Checklist', icon: ListChecks },
  { to: '/panduan', label: 'Panduan', icon: BookOpen },
]

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

// No wedding yet: go to onboarding.
watch(
  () => weddings.isSuccess.value && !weddings.data.value?.length,
  (empty) => empty && router.replace('/mulai'),
  { immediate: true },
)

// Realtime: someone else changed data, refresh that table.
const refresh = useDebounceFn((table: string) => {
  if (table === '*' || table === 'weddings') qc.invalidateQueries({ queryKey: ['weddings'] })
  if (table === '*' || table === 'wedding_members') qc.invalidateQueries({ queryKey: ['members'] })
  qc.invalidateQueries({
    queryKey: table === '*' ? ['rows', weddingId.value] : ['rows', weddingId.value, table],
  })
}, 300)
watch(
  weddingId,
  (id, _old, onCleanup) => {
    if (!id) return
    onCleanup(db.subscribe(id, refresh))
  },
  { immediate: true },
)

const mutating = useIsMutating()
const online = useOnline()

const countdown = computed(() => {
  const d = daysUntil(wedding.value?.wedding_date)
  if (d === null) return null
  if (d > 0) return `${formatNumber(d)} hari lagi`
  if (d === 0) return 'Hari ini!'
  return 'Sudah berlangsung'
})

const isDark = useDark()
const toggleDark = useToggle(isDark)

const menuOpen = ref(false)
const isDesktop = useMediaQuery('(min-width: 64rem)')
watch(isDesktop, (d) => d && (menuOpen.value = false))
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)

const initials = computed(() =>
  (auth.me?.name ?? '?')
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
const roleLabel = computed(
  () => ({ owner: 'Pemilik', editor: 'Editor', viewer: 'Hanya lihat' })[role.value ?? 'viewer'],
)
</script>

<template>
  <a
    href="#main"
    class="sr-only z-[70] rounded-md bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >Lewati ke konten</a
  >

  <div class="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
    <!-- Sidebar (desktop) -->
    <aside
      class="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex"
      aria-label="Navigasi utama"
    >
      <div class="flex h-16 items-center gap-2.5 px-5">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        <span class="font-semibold tracking-tight">Rencana Nikah</span>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 py-2" aria-label="Menu">
        <ul class="flex flex-col gap-0.5">
          <li v-for="item in nav" :key="item.to">
            <RouterLink
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              :class="
                cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg',
                  isActive(item.to) &&
                    'bg-primary-soft text-primary-strong hover:bg-primary-soft hover:text-primary-strong',
                )
              "
            >
              <component :is="item.icon" class="size-[18px]" aria-hidden="true" />
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="border-t border-border p-3">
        <RouterLink
          to="/pengaturan"
          :aria-current="isActive('/pengaturan') ? 'page' : undefined"
          :class="
            cn(
              'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg',
              isActive('/pengaturan') && 'bg-primary-soft text-primary-strong',
            )
          "
        >
          <Settings class="size-[18px]" aria-hidden="true" />
          Pengaturan
        </RouterLink>
        <div class="mt-2 flex items-center gap-3 rounded-md px-3 py-2">
          <img
            v-if="auth.me?.imageUrl"
            :src="auth.me.imageUrl"
            alt=""
            width="32"
            height="32"
            class="size-8 rounded-full"
          />
          <span
            v-else
            class="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-strong"
            aria-hidden="true"
            >{{ initials }}</span
          >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ auth.me?.name }}</p>
            <p class="truncate text-xs text-fg-muted">{{ roleLabel }}</p>
          </div>
          <button
            v-if="!env.isDemo"
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
            aria-label="Keluar"
            title="Keluar"
            @click="signOut()"
          >
            <LogOut class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-col">
      <!-- Top bar -->
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur sm:px-6 short:static"
      >
        <button
          type="button"
          class="-ml-2 inline-flex size-11 items-center justify-center rounded-md hover:bg-bg-subtle lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-nav"
          @click="menuOpen = true"
        >
          <Menu class="size-5" aria-hidden="true" />
          <span class="sr-only">Buka menu</span>
        </button>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ wedding?.name ?? 'Memuat…' }}</p>
          <p v-if="wedding?.wedding_date" class="truncate text-xs text-fg-muted">
            {{ formatDate(wedding.wedding_date, 'long') }}
            <template v-if="countdown"> · {{ countdown }}</template>
          </p>
        </div>

        <p class="flex items-center gap-1.5 text-xs text-fg-muted" role="status" aria-live="polite">
          <template v-if="!online">
            <CloudOff class="size-4 text-warning" aria-hidden="true" />
            <span class="hidden sm:inline">Offline</span>
            <span class="sr-only sm:hidden">Offline</span>
          </template>
          <template v-else-if="mutating">
            <Loader2 class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span class="hidden sm:inline">Menyimpan…</span>
          </template>
          <template v-else-if="weddingId">
            <Check class="size-4 text-success" aria-hidden="true" />
            <span class="hidden sm:inline">Tersimpan</span>
          </template>
        </p>

        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg touch:size-11"
          :aria-label="isDark ? 'Mode terang' : 'Mode gelap'"
          :title="isDark ? 'Mode terang' : 'Mode gelap'"
          @click="toggleDark()"
        >
          <Sun v-if="isDark" class="size-5" aria-hidden="true" />
          <Moon v-else class="size-5" aria-hidden="true" />
        </button>
      </header>

      <div
        v-if="env.isDemo"
        class="border-b border-warning/30 bg-warning-soft px-4 py-2 text-xs text-fg sm:px-6"
      >
        <strong class="font-semibold">Mode demo.</strong>
        Data hanya tersimpan di browser ini. Isi kunci Clerk dan Supabase di
        <code class="rounded-sm bg-surface px-1">.env.local</code> agar bisa dipakai bersama keluarga.
      </div>

      <main
        id="main"
        tabindex="-1"
        class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
      >
        <ErrorState
          v-if="weddings.isError.value"
          :error="weddings.error.value"
          @retry="weddings.refetch()"
        />
        <SkeletonRows v-else-if="!wedding" :rows="6" />
        <RouterView v-else v-slot="{ Component }">
          <component :is="Component" :key="weddingId" />
        </RouterView>
      </main>
    </div>
  </div>

  <!-- Mobile nav drawer -->
  <DialogRoot v-model:open="menuOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-scrim lg:hidden" />
      <DialogContent
        id="mobile-nav"
        class="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col bg-surface shadow-2xl data-[state=open]:animate-[fade-in_150ms_ease-out] lg:hidden"
        :aria-describedby="undefined"
      >
        <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <DialogTitle class="flex-1 font-semibold">Rencana Nikah</DialogTitle>
          <button
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-md hover:bg-bg-subtle"
            @click="menuOpen = false"
          >
            <X class="size-5" aria-hidden="true" />
            <span class="sr-only">Tutup menu</span>
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto p-3" aria-label="Menu">
          <ul class="flex flex-col gap-0.5">
            <li
              v-for="item in [...nav, { to: '/pengaturan', label: 'Pengaturan', icon: Settings }]"
              :key="item.to"
            >
              <RouterLink
                :to="item.to"
                :aria-current="isActive(item.to) ? 'page' : undefined"
                :class="
                  cn(
                    'flex h-12 items-center gap-3 rounded-md px-3 text-base font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg',
                    isActive(item.to) && 'bg-primary-soft text-primary-strong',
                  )
                "
              >
                <component :is="item.icon" class="size-5" aria-hidden="true" />
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>
        <div
          class="flex items-center gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ auth.me?.name }}</p>
            <p class="truncate text-xs text-fg-muted">{{ roleLabel }}</p>
          </div>
          <button
            v-if="!env.isDemo"
            type="button"
            class="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-bg-subtle"
            @click="signOut()"
          >
            <LogOut class="size-4" aria-hidden="true" />
            Keluar
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

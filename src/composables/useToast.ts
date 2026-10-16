import { ref } from 'vue'

export interface Toast {
  id: number
  title: string
  description?: string
  tone: 'default' | 'success' | 'danger'
  action?: { label: string; run: () => void }
  duration: number
}

const toasts = ref<Toast[]>([])
let seq = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
  clearTimeout(timers.get(id))
  timers.delete(id)
}

function schedule(t: Toast) {
  clearTimeout(timers.get(t.id))
  timers.set(
    t.id,
    setTimeout(() => dismiss(t.id), t.duration),
  )
}

export function toast(input: Omit<Toast, 'id' | 'tone' | 'duration'> & Partial<Toast>) {
  const t: Toast = { tone: 'default', duration: 6000, ...input, id: ++seq }
  toasts.value = [...toasts.value.slice(-3), t]
  schedule(t)
  return t.id
}

export function useToasts() {
  return {
    toasts,
    dismiss,
    pause: (id: number) => clearTimeout(timers.get(id)),
    resume: (id: number) => {
      const t = toasts.value.find((x) => x.id === id)
      if (t) schedule(t)
    },
  }
}

/** Turns DB / network errors into a sentence people can act on. */
export function errorMessage(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e)
  if (/fetch|network/i.test(msg)) return 'Koneksi terputus. Periksa internet lalu coba lagi.'
  if (/row-level security|permission|42501/i.test(msg))
    return 'Kamu hanya punya akses lihat. Minta pemilik mengubah peranmu menjadi Editor.'
  if (/invite invalid or expired/i.test(msg))
    return 'Kode undangan tidak valid atau sudah kedaluwarsa. Minta kode baru ke pemilik.'
  if (/JWT|jwt/.test(msg)) return 'Sesi login berakhir. Masuk lagi untuk melanjutkan.'
  return msg
}

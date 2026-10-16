import type { Guest, Rsvp } from '@/types'
import { SIDE_LABEL } from '@/composables/useSummary'

export const RSVP_LABEL: Record<Rsvp, string> = {
  belum: 'Belum jawab',
  hadir: 'Hadir',
  mungkin: 'Mungkin',
  tidak: 'Tidak hadir',
}

export const RSVP_TONE = {
  belum: 'neutral',
  hadir: 'success',
  mungkin: 'warning',
  tidak: 'danger',
} as const

export const GIFT_CHANNEL_LABEL = { '': '—', tunai: 'Tunai', transfer: 'Transfer', kado: 'Kado' }

/** Accepts "0812-3456-789", "+62 812 3456 789", "812..." and returns "628123456789" (Postel). */
export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function waLink(phone: string) {
  const p = normalizePhone(phone)
  return p.length >= 9 ? `https://wa.me/${p}` : null
}

function cell(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV with `;` separator + UTF-8 BOM so Excel in Indonesian locale opens it correctly. */
export function downloadGuestsCsv(guests: Guest[], filename: string) {
  const header = [
    'Nama',
    'Grup',
    'Pihak',
    'Jumlah orang',
    'Telepon',
    'Jenis undangan',
    'Undangan terkirim',
    'RSVP',
    'Acara',
    'Angpao/kado (Rp)',
    'Bentuk',
    'Catatan',
  ]
  const rows = guests.map((g) => [
    g.name,
    g.group_name,
    SIDE_LABEL[g.side],
    g.pax,
    g.phone,
    g.invite_type === 'cetak' ? 'Cetak' : 'Digital',
    g.invite_sent ? 'Ya' : 'Belum',
    RSVP_LABEL[g.rsvp],
    g.events.join(', '),
    g.gift_amount ?? '',
    GIFT_CHANNEL_LABEL[g.gift_channel],
    g.notes,
  ])
  const csv = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

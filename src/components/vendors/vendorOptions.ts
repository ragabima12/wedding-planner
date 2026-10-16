import type { VendorStatus } from '@/types'

export const VENDOR_STATUS: {
  value: VendorStatus
  label: string
  tone: 'neutral' | 'info' | 'success' | 'danger'
}[] = [
  { value: 'survei', label: 'Survei', tone: 'neutral' },
  { value: 'negosiasi', label: 'Negosiasi', tone: 'info' },
  { value: 'deal', label: 'Deal', tone: 'success' },
  { value: 'batal', label: 'Batal', tone: 'danger' },
]

export const statusMeta = (s: VendorStatus) => VENDOR_STATUS.find((x) => x.value === s)!

/** 0812-3456-789 / +62 812… / 62812… → https://wa.me/62812… (Postel's law). */
export function whatsappUrl(phone: string) {
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) digits = `62${digits}`
  return `https://wa.me/${digits}`
}

export function instagramUrl(handle: string) {
  const h = handle
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
  return h ? { url: `https://instagram.com/${h}`, handle: `@${h}` } : null
}

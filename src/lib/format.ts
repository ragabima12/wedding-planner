const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const plain = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })

/** "Rp 150.000.000" */
export function formatRupiah(value: number | null | undefined) {
  return rupiah.format(value ?? 0).replace(/\s/g, ' ')
}

/** "Rp 150 jt", "Rp 1,2 M", "Rp 850 rb". Full value belongs in a tooltip or nearby. */
export function formatRupiahShort(value: number | null | undefined) {
  const v = value ?? 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1e9) return `${sign}Rp ${decimal.format(abs / 1e9)} M`
  if (abs >= 1e6) return `${sign}Rp ${decimal.format(abs / 1e6)} jt`
  if (abs >= 1e3) return `${sign}Rp ${decimal.format(abs / 1e3)} rb`
  return `${sign}Rp ${plain.format(abs)}`
}

export function formatNumber(value: number | null | undefined) {
  return plain.format(value ?? 0)
}

/**
 * Accepts what people type (Postel): "150000000", "150.000.000", "Rp 150jt",
 * "1,5 M", "850rb", "2.5jt". Returns null when nothing numeric is found.
 */
export function parseRupiah(input: string): number | null {
  const s = input.toLowerCase().replace(/rp\.?/g, '').replace(/\s/g, '')
  if (!s) return null
  const m = s.match(/^([\d.,]+)(m|miliar|jt|juta|rb|ribu|k)?$/)
  if (!m) return null
  const [, num = '', unit] = m
  const mult = unit
    ? { m: 1e9, miliar: 1e9, jt: 1e6, juta: 1e6, rb: 1e3, ribu: 1e3, k: 1e3 }[unit]!
    : 1
  let n: number
  if (unit) {
    // with a unit, "," or "." before 1–2 trailing digits is a decimal mark
    n = Number(
      num
        .replace(/[.,](?=\d{1,2}$)/, '#')
        .replace(/[.,]/g, '')
        .replace('#', '.'),
    )
  } else {
    n = Number(num.replace(/[.,]/g, ''))
  }
  return Number.isFinite(n) ? Math.round(n * mult) : null
}

const dateLong = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dateShort = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateDay = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** ISO date "2027-05-08" parsed as a local date, not UTC midnight. */
export function toDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDaysIso(iso: string, days: number) {
  const d = toDate(iso)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(
  iso: string | null | undefined,
  style: 'long' | 'short' | 'day' = 'short',
) {
  if (!iso) return '—'
  const d = toDate(iso)
  return { long: dateLong, short: dateShort, day: dateDay }[style].format(d)
}

/** Whole days from today to the date. Negative = past. */
export function daysUntil(iso: string | null | undefined) {
  if (!iso) return null
  const ms = toDate(iso).getTime() - toDate(todayIso()).getTime()
  return Math.round(ms / 864e5)
}

export function relativeDays(iso: string | null | undefined) {
  const d = daysUntil(iso)
  if (d === null) return ''
  if (d === 0) return 'hari ini'
  if (d === 1) return 'besok'
  if (d === -1) return 'kemarin'
  return d > 0 ? `${formatNumber(d)} hari lagi` : `${formatNumber(-d)} hari lalu`
}

export function percent(part: number, whole: number) {
  if (!whole) return 0
  return Math.round((part / whole) * 100)
}

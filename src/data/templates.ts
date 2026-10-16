import type { Ceremony, NewRow, Side } from '@/types'

/**
 * Starter data from research on Indonesian weddings (2025–2026): Islamic akad + resepsi,
 * Javanese and Sundanese adat. Percentages are suggested defaults, not rules.
 * Sources are listed on the Panduan page.
 */

export const CEREMONY_OPTIONS: { value: Ceremony; label: string; hint: string }[] = [
  { value: 'islam', label: 'Akad nikah + resepsi', hint: 'KUA, mahar, seserahan, pengajian' },
  { value: 'jawa', label: 'Adat Jawa', hint: 'Siraman, midodareni, panggih' },
  { value: 'sunda', label: 'Adat Sunda', hint: 'Siraman, ngeuyeuk seureuh, sawer' },
]

export interface CategoryTemplate {
  name: string
  icon: string
  /** Suggested share of the total budget, in percent. */
  pct: number
  items: string[]
  only?: Ceremony[]
}

export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    name: 'Katering',
    icon: 'utensils',
    pct: 33,
    items: ['Prasmanan', 'Gubukan / food stall', 'Food tasting', 'Konsumsi keluarga & panitia'],
  },
  { name: 'Venue / gedung', icon: 'building', pct: 14, items: ['Sewa gedung', 'Venue akad'] },
  {
    name: 'Dekorasi & pelaminan',
    icon: 'flower',
    pct: 11,
    items: ['Pelaminan', 'Dekorasi akad', 'Bunga & meja tamu', 'Lighting & sound'],
  },
  {
    name: 'Busana & rias',
    icon: 'shirt',
    pct: 7,
    items: ['MUA & busana pengantin', 'Busana orang tua', 'Seragam keluarga', 'Pagar ayu & bagus'],
  },
  {
    name: 'Dokumentasi',
    icon: 'camera',
    pct: 6,
    items: ['Foto & video hari H', 'Prewedding', 'Album & cetak'],
  },
  { name: 'Hiburan & MC', icon: 'music', pct: 3, items: ['MC', 'Band / organ tunggal'] },
  {
    name: 'Undangan',
    icon: 'mail',
    pct: 1,
    items: ['Undangan cetak', 'Undangan digital', 'Ongkos kirim'],
  },
  { name: 'Souvenir', icon: 'gift', pct: 2, items: ['Souvenir tamu'] },
  {
    name: 'Wedding organizer',
    icon: 'clipboard',
    pct: 3,
    items: ['WO / koordinator hari H'],
  },
  {
    name: 'Mahar, seserahan & cincin',
    icon: 'gem',
    pct: 5,
    items: ['Mahar', 'Seserahan', 'Hias seserahan', 'Cincin nikah'],
  },
  {
    name: 'Upacara adat',
    icon: 'sparkles',
    pct: 4,
    items: ['Lamaran', 'Pengajian'],
  },
  {
    name: 'KUA & administrasi',
    icon: 'landmark',
    pct: 1,
    items: ['Biaya nikah di luar KUA (PNBP)', 'Transport penghulu', 'Berkas & fotokopi'],
  },
  {
    name: 'Dana cadangan',
    icon: 'shield',
    pct: 10,
    items: ['Tak terduga', 'Amplop tip vendor'],
  },
  { name: 'Bulan madu', icon: 'plane', pct: 0, items: ['Tiket', 'Penginapan'] },
]

/** Adat line items added to "Upacara adat" based on chosen ceremonies. */
export const ADAT_ITEMS: Record<Ceremony, string[]> = {
  islam: [],
  jawa: ['Siraman (Jawa)', 'Midodareni', 'Pemaes & pranatacara', 'Tarub, bleketepe, tuwuhan'],
  sunda: ['Siraman (Sunda)', 'Ngeuyeuk seureuh', 'Juru sawer & lengser'],
}

export const EVENT_KINDS: Record<string, string> = {
  lamaran: 'Lamaran',
  pengajian: 'Pengajian',
  siraman: 'Siraman',
  midodareni: 'Midodareni',
  ngeuyeuk: 'Ngeuyeuk seureuh',
  akad: 'Akad nikah',
  panggih: 'Panggih',
  sawer: 'Sawer & huap lingkung',
  resepsi: 'Resepsi',
  ngunduh: 'Ngunduh mantu',
  lainnya: 'Lainnya',
}

interface EventTemplate {
  name: string
  kind: keyof typeof EVENT_KINDS
  side: Side
  /** Days relative to the wedding day (akad). */
  offset: number | null
  notes: string
  only?: Ceremony[]
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    name: 'Lamaran',
    kind: 'lamaran',
    side: 'bersama',
    offset: null,
    notes: 'Keluarga pria datang ke keluarga wanita. Biasanya 6–12 bulan sebelum.',
  },
  {
    name: 'Pengajian',
    kind: 'pengajian',
    side: 'wanita',
    offset: -2,
    notes: 'Ustadz/ustadzah, konsumsi, seragam. Biasanya H-7 s.d. H-1.',
  },
  {
    name: 'Siraman',
    kind: 'siraman',
    side: 'wanita',
    offset: -1,
    notes: 'Air kembang setaman, kendi, penyiram berjumlah ganjil (7 atau 9).',
    only: ['jawa', 'sunda'],
  },
  {
    name: 'Midodareni',
    kind: 'midodareni',
    side: 'wanita',
    offset: -1,
    notes: 'Malam H-1. Keluarga pria berkunjung, calon pengantin wanita dipingit.',
    only: ['jawa'],
  },
  {
    name: 'Ngeuyeuk seureuh',
    kind: 'ngeuyeuk',
    side: 'wanita',
    offset: -1,
    notes: 'Dipimpin pangeuyeuk. Di beberapa daerah dilakukan di hari H.',
    only: ['sunda'],
  },
  {
    name: 'Akad nikah',
    kind: 'akad',
    side: 'bersama',
    offset: 0,
    notes: 'Penghulu, wali, 2 saksi, mahar. Daftar ke KUA minimal 10 hari kerja sebelumnya.',
  },
  {
    name: 'Panggih',
    kind: 'panggih',
    side: 'bersama',
    offset: 0,
    notes: 'Balangan gantal, wiji dadi, sindur, kacar-kucur, dulangan, sungkeman.',
    only: ['jawa'],
  },
  {
    name: 'Sawer & huap lingkung',
    kind: 'sawer',
    side: 'bersama',
    offset: 0,
    notes: 'Sawer, meuleum harupat, nincak endog, buka pintu, huap lingkung.',
    only: ['sunda'],
  },
  {
    name: 'Resepsi',
    kind: 'resepsi',
    side: 'wanita',
    offset: 0,
    notes: 'Biasanya diselenggarakan keluarga wanita.',
  },
  {
    name: 'Ngunduh mantu',
    kind: 'ngunduh',
    side: 'pria',
    offset: 14,
    notes: 'Resepsi di pihak keluarga pria. Umumnya 20–50% biaya resepsi utama.',
    only: ['jawa', 'sunda'],
  },
]

export const PHASES = [
  { value: 'b12', label: '12 bulan sebelum', offset: -365 },
  { value: 'b9', label: '9 bulan sebelum', offset: -270 },
  { value: 'b6', label: '6 bulan sebelum', offset: -180 },
  { value: 'b3', label: '3 bulan sebelum', offset: -90 },
  { value: 'b1', label: '1–2 bulan sebelum', offset: -45 },
  { value: 'm2', label: 'H-14 s.d. H-7', offset: -10 },
  { value: 'h1', label: 'H-1', offset: -1 },
  { value: 'hh', label: 'Hari H', offset: 0 },
  { value: 'after', label: 'Setelah acara', offset: 14 },
  { value: 'lainnya', label: 'Lainnya', offset: null },
] as const

export type Phase = (typeof PHASES)[number]['value']

export const TASK_CATEGORIES = [
  'Perencanaan',
  'Anggaran',
  'Administrasi',
  'Adat',
  'Venue',
  'Katering',
  'Busana',
  'Dekorasi',
  'Dokumentasi',
  'Hiburan',
  'Undangan',
  'Souvenir',
  'Mahar & seserahan',
  'Tamu',
  'WO',
  'Bulan madu',
]

type TaskTemplate = [phase: Phase, category: string, title: string, only?: Ceremony[]]

const T: TaskTemplate[] = [
  ['b12', 'Anggaran', 'Sepakati total anggaran dan siapa menanggung apa'],
  ['b12', 'Perencanaan', 'Tentukan tanggal dan adat yang dipakai'],
  ['b12', 'Tamu', 'Susun daftar tamu awal per pihak keluarga'],
  ['b12', 'Venue', 'Survei dan buat daftar pilihan venue'],
  ['b12', 'Adat', 'Lamaran / pertemuan keluarga'],
  ['b12', 'Anggaran', 'Mulai rencana tabungan bulanan'],
  ['b9', 'Venue', 'Booking venue dan bayar DP'],
  ['b9', 'Katering', 'Booking katering setelah food tasting'],
  ['b9', 'WO', 'Booking wedding organizer'],
  ['b9', 'Busana', 'Booking MUA dan busana'],
  ['b9', 'Dokumentasi', 'Booking foto & video'],
  ['b9', 'Dekorasi', 'Booking dekorasi & pelaminan'],
  ['b6', 'Adat', 'Pilih paket adat, perias/pemaes, dan sanggar', ['jawa', 'sunda']],
  ['b6', 'Hiburan', 'Booking hiburan dan MC'],
  ['b6', 'Mahar & seserahan', 'Pesan cincin nikah'],
  ['b6', 'Mahar & seserahan', 'Sepakati mahar dan isi seserahan'],
  ['b6', 'Dokumentasi', 'Foto prewedding'],
  ['b6', 'Undangan', 'Pilih desain undangan'],
  ['b6', 'Souvenir', 'Pesan souvenir'],
  ['b6', 'Administrasi', 'Cek kesehatan pranikah (puskesmas)'],
  ['b3', 'Administrasi', 'Minta surat pengantar RT/RW dan berkas kelurahan (N1–N4)'],
  ['b3', 'Administrasi', 'Minta rekomendasi nikah dari KUA asal (jika beda kecamatan)'],
  ['b3', 'Administrasi', 'Daftar nikah di SIMKAH atau langsung ke KUA'],
  ['b3', 'Administrasi', 'Ikut bimbingan perkawinan (Bimwin)'],
  ['b3', 'Bulan madu', 'Pesan tiket dan penginapan bulan madu'],
  ['b3', 'Busana', 'Fitting pertama'],
  ['b3', 'Anggaran', 'Bayar termin kedua vendor'],
  ['b3', 'Undangan', 'Cetak undangan'],
  ['b1', 'Undangan', 'Sebar undangan cetak dan digital'],
  ['b1', 'Tamu', 'Pantau RSVP tamu'],
  ['b1', 'WO', 'Finalisasi rundown acara'],
  ['b1', 'Tamu', 'Atur denah duduk dan tamu VIP'],
  ['b1', 'Busana', 'Fitting terakhir'],
  ['b1', 'Mahar & seserahan', 'Siapkan dan hias seserahan'],
  ['b1', 'Perencanaan', 'Bentuk panitia keluarga (among tamu, pagar ayu)'],
  ['m2', 'Katering', 'Konfirmasi jumlah porsi final ke katering'],
  ['m2', 'Anggaran', 'Pelunasan semua vendor'],
  ['m2', 'WO', 'Technical meeting dengan semua vendor'],
  ['m2', 'Adat', 'Pengajian'],
  ['m2', 'Anggaran', 'Siapkan amplop tip vendor dan transport penghulu'],
  ['m2', 'Tamu', 'Siapkan kotak angpao dan buku tamu'],
  ['h1', 'Adat', 'Siraman', ['jawa', 'sunda']],
  ['h1', 'Adat', 'Midodareni', ['jawa']],
  ['h1', 'Adat', 'Ngeuyeuk seureuh', ['sunda']],
  ['h1', 'Dekorasi', 'Pasang tarub dan loading dekorasi'],
  ['h1', 'Administrasi', 'Serahkan cincin, mahar, dan berkas ke penanggung jawab'],
  ['hh', 'Adat', 'Akad nikah'],
  ['hh', 'Adat', 'Panggih', ['jawa']],
  ['hh', 'Adat', 'Sawer, nincak endog, huap lingkung', ['sunda']],
  ['hh', 'Tamu', 'Resepsi'],
  ['hh', 'Tamu', 'Awasi pengumpulan angpao'],
  ['after', 'Tamu', 'Hitung dan catat angpao'],
  ['after', 'Anggaran', 'Bayar sisa termin vendor'],
  ['after', 'Administrasi', 'Ambil buku nikah / kartu nikah'],
  ['after', 'Administrasi', 'Perbarui KK dan KTP di Dukcapil'],
  ['after', 'Adat', 'Ngunduh mantu', ['jawa', 'sunda']],
  ['after', 'Tamu', 'Kirim ucapan terima kasih dan ulasan vendor'],
  ['after', 'Dokumentasi', 'Terima file foto dan video'],
]

const applies = (only: Ceremony[] | undefined, chosen: Ceremony[]) =>
  !only || only.some((c) => chosen.includes(c))

function shift(dateIso: string | null, offset: number | null) {
  if (!dateIso || offset === null) return null
  const [y, m, d] = dateIso.split('-').map(Number)
  const dt = new Date(y!, m! - 1, d! + offset)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function buildCategories(totalBudget: number, ceremonies: Ceremony[]) {
  return CATEGORY_TEMPLATES.filter((c) => applies(c.only, ceremonies)).map((c, i) => ({
    row: {
      id: crypto.randomUUID(),
      name: c.name,
      icon: c.icon,
      allocated: Math.round((totalBudget * c.pct) / 100 / 100_000) * 100_000,
      notes: c.pct ? `Saran ${c.pct}% dari total anggaran` : 'Di luar anggaran utama',
      sort: i,
    } satisfies NewRow<'budget_categories'>,
    items:
      c.name === 'Upacara adat'
        ? [...c.items, ...ceremonies.flatMap((x) => ADAT_ITEMS[x])]
        : c.items,
  }))
}

export function buildEvents(weddingDate: string | null, ceremonies: Ceremony[]) {
  return EVENT_TEMPLATES.filter((e) => applies(e.only, ceremonies)).map(
    (e, i): NewRow<'events'> => ({
      name: e.name,
      kind: e.kind,
      side: e.side,
      date: shift(weddingDate, e.offset),
      start_time: '',
      venue: '',
      notes: e.notes,
      sort: i,
    }),
  )
}

export function buildTasks(weddingDate: string | null, ceremonies: Ceremony[]) {
  return T.filter(([, , , only]) => applies(only, ceremonies)).map(
    ([phase, category, title], i): NewRow<'tasks'> => ({
      title,
      phase,
      category,
      due_date: shift(weddingDate, PHASES.find((p) => p.value === phase)?.offset ?? null),
      assignee: '',
      done: false,
      done_at: null,
      notes: '',
      sort: i,
    }),
  )
}

/** Research-based payment schedule: DP at booking, termin at H-45, pelunasan at H-14. */
export function paymentPlan(total: number, weddingDate: string | null, today: string) {
  const parts = [
    { label: 'DP (30%)', pct: 30, due: today },
    { label: 'Termin 2 (40%)', pct: 40, due: shift(weddingDate, -45) },
    { label: 'Pelunasan (30%)', pct: 30, due: shift(weddingDate, -14) },
  ]
  let left = total
  return parts.map((p, i) => {
    const amount = i === parts.length - 1 ? left : Math.round((total * p.pct) / 100 / 1000) * 1000
    left -= amount
    return { label: p.label, amount, due_date: p.due }
  })
}

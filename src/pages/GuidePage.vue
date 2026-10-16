<script setup lang="ts">
import { AlertTriangle, ExternalLink } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import PageHeader from '@/components/patterns/PageHeader.vue'

const sections = [
  { id: 'kua', label: 'Daftar nikah di KUA' },
  { id: 'urutan', label: 'Urutan acara' },
  { id: 'anggaran', label: 'Pembagian anggaran' },
  { id: 'harga', label: 'Kisaran harga' },
  { id: 'vendor', label: 'Pembayaran vendor' },
  { id: 'tamu', label: 'Tamu & katering' },
  { id: 'sumber', label: 'Sumber' },
]

const documents = [
  'Surat pengantar RT/RW, lalu surat pengantar dari desa/kelurahan (berkas N1–N4)',
  'Fotokopi akta kelahiran, KTP, dan KK kedua calon',
  'Pas foto latar biru (ukuran tergantung KUA, umumnya 2×3 dan 4×6)',
  'Surat keterangan sehat dari puskesmas (beberapa daerah juga meminta imunisasi TT untuk calon istri)',
  'Surat persetujuan kedua calon',
  'Rekomendasi nikah dari KUA asal, jika akad di luar kecamatan tempat tinggal',
]
const conditional = [
  'Izin orang tua jika usia di bawah 21 tahun',
  'Dispensasi pengadilan jika usia di bawah 19 tahun',
  'Izin atasan untuk anggota TNI/Polri',
  'Akta cerai atau surat kematian pasangan untuk duda/janda',
]

const sequence = [
  {
    name: 'Lamaran / khitbah',
    when: '6–12 bulan sebelum',
    who: 'Semua',
    note: 'Sunda: neundeun omong, narosan. Cincin tunangan, hantaran.',
  },
  {
    name: 'Seserahan / peningset',
    when: 'Saat lamaran atau H-1/hari H',
    who: 'Semua',
    note: 'Pakaian, alat sholat, kosmetik, sepatu, makanan.',
  },
  {
    name: 'Pengajian',
    when: 'H-7 s.d. H-1',
    who: 'Semua',
    note: 'Ustadz/ustadzah, konsumsi, seragam.',
  },
  {
    name: 'Pasang tarub, bleketepe',
    when: 'H-2 s.d. H-1',
    who: 'Jawa',
    note: 'Janur, pisang, dan tuwuhan lainnya.',
  },
  {
    name: 'Siraman',
    when: 'H-1 (Sunda kadang H-3)',
    who: 'Jawa, Sunda',
    note: 'Air kembang setaman, penyiram ganjil (7 atau 9). Jawa: dodol dawet.',
  },
  {
    name: 'Midodareni',
    when: 'Malam H-1',
    who: 'Jawa',
    note: 'Calon pengantin wanita dipingit, keluarga pria berkunjung.',
  },
  {
    name: 'Ngeuyeuk seureuh',
    when: 'H-1',
    who: 'Sunda',
    note: 'Dipimpin pangeuyeuk, sirih dan perlengkapan adat.',
  },
  {
    name: 'Akad nikah',
    when: 'Hari H, pagi',
    who: 'Semua',
    note: 'Penghulu, wali, 2 saksi, mahar.',
  },
  {
    name: 'Panggih',
    when: 'Setelah akad',
    who: 'Jawa',
    note: 'Balangan gantal, wiji dadi, sindur, kacar-kucur, dulangan, sungkeman.',
  },
  {
    name: 'Sawer & huap lingkung',
    when: 'Setelah akad',
    who: 'Sunda',
    note: 'Sawer, meuleum harupat, nincak endog, buka pintu, huap lingkung.',
  },
  {
    name: 'Resepsi',
    when: 'Hari H',
    who: 'Semua',
    note: 'Biaya terbesar. Biasanya diselenggarakan keluarga wanita.',
  },
  {
    name: 'Ngunduh mantu',
    when: 'Beberapa hari s.d. minggu setelahnya',
    who: 'Jawa, Sunda',
    note: 'Di keluarga pria, umumnya 20–50% biaya resepsi utama.',
  },
]

const allocation = [
  ['Katering (prasmanan + gubukan)', '30–40%', '33%'],
  ['Venue / gedung', '10–20%', '14%'],
  ['Dekorasi & pelaminan', '10–20%', '11%'],
  ['Busana & rias (pengantin, orang tua, pagar ayu)', '6–10%', '7%'],
  ['Dokumentasi foto/video', '5–8%', '6%'],
  ['Mahar, seserahan & cincin', '4–7%', '5%'],
  ['Upacara adat', '3–6%', '4%'],
  ['Hiburan & MC', '2–4%', '3%'],
  ['Wedding organizer', '3–5%', '3%'],
  ['Souvenir', '1–3%', '2%'],
  ['Undangan', '0,5–2%', '1%'],
  ['KUA & administrasi', '< 1%', '1%'],
  ['Dana cadangan', '5–10%', '10%'],
]

const prices = [
  [
    'Katering per orang, Jakarta',
    'Rp85.000–150.000',
    'Vendor hemat Jabodetabek mulai Rp20.000–50.000',
  ],
  ['Aula masjid', 'Rp3–10 jt', ''],
  ['Gedung serbaguna pemerintah', 'Rp7–15 jt', ''],
  ['Restoran', 'Rp20–50 jt', ''],
  ['Ballroom hotel', 'Rp100 jt+', ''],
  ['Dekorasi, Jakarta 500 tamu', 'Rp25–70 jt', 'Yogyakarta mulai Rp3,5–10 jt'],
  ['MUA & busana', 'Rp10–30 jt (Jakarta)', 'Kota lain Rp5–15 jt'],
  ['Foto & video', 'Mulai Rp7 jt', ''],
  ['Undangan cetak', 'Rp650–4.000 /lembar', 'Digital Rp150–500 rb'],
  ['Souvenir', 'Rp5.000–15.000 /buah', ''],
  ['Cincin emas sederhana (pasang)', 'Rp2–3 jt', 'Cek harga emas harian Antam/Pegadaian'],
]

const sources = [
  [
    'Kemenag Sulteng: syarat nikah PMA 30/2024',
    'https://sulteng.kemenag.go.id/artikel/mm7g/07-05-2025-syarat-administrasi-daftar-nikah-berdasarkan-pma-nomor-30-tahun-2024',
  ],
  [
    'Kemenag Kebumen: tahapan pendaftaran nikah',
    'https://kebumen.kemenag.go.id/mau-menikah-ini-syarat-dan-tahapan-pendaftaran-nikah-di-kua-sesuai-pma-30-tahun-2024/',
  ],
  [
    'RRI: aturan terbaru pencatatan nikah',
    'https://rri.co.id/info-kementerian/1236789/aturan-terbaru-pencatatan-nikah-kemenag-pma-30-2024',
  ],
  [
    'CIMB Niaga: biaya nikah di KUA',
    'https://www.cimbniaga.co.id/id/inspirasi/perencanaan/biaya-nikah-di-kua',
  ],
  [
    'pernikahan.or.id: paket wedding Jakarta 2026',
    'https://pernikahan.or.id/paket-wedding-jakarta-panduan-lengkap',
  ],
  [
    'nikahiaku: rincian biaya nikah 2026',
    'https://nikahiaku.id/artikel/biaya-nikah-2026-rincian-kua-gedung-katering-souvenir',
  ],
  [
    'QM Financial: anggaran menikah di bawah 100 juta',
    'https://qmfinancial.com/anggaran-menikah-di-bawah-100-juta-bisa/',
  ],
  [
    'Antara: estimasi biaya cetak undangan',
    'https://www.antaranews.com/berita/4223735/estimasi-biaya-cetak-undangan-pernikahan',
  ],
  [
    'Hipwee: rumus jumlah katering',
    'https://www.hipwee.com/tips/5-kumpulan-rumus-jitu-siapkan-pernikahan-dari-cara-tentukan-jumlah-katering-sampai-tamu-undangan/',
  ],
  [
    'Bisnis.com: cermat menyerahkan uang ke WO',
    'https://finansial.bisnis.com/read/20150601/55/439047/cermat-sebelum-menyerahkan-uang-ke-wedding-organizer',
  ],
  [
    'Fimela: urutan prosesi adat Jawa',
    'https://www.fimela.com/relationship/read/5150106/tata-urutan-prosesi-pernikahan-adat-jawa-yogyakarta-yang-unik-dan-penuh-makna',
  ],
  ['Gramedia: upacara adat Sunda', 'https://www.gramedia.com/literasi/upacara-adat-sunda/'],
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader
      title="Panduan"
      description="Ringkasan riset persiapan pernikahan Islam, adat Jawa, dan adat Sunda (data 2025–2026). Harga hanya gambaran, selalu minta penawaran langsung ke vendor."
    />

    <div class="lg:grid lg:grid-cols-[13rem_1fr] lg:gap-8">
      <nav aria-label="Isi panduan" class="mb-6 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
        <ul
          class="relative flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible"
        >
          <li v-for="s in sections" :key="s.id" class="shrink-0">
            <a
              :href="`#${s.id}`"
              class="flex h-10 items-center rounded-md border border-border px-3 text-sm whitespace-nowrap text-fg-muted hover:bg-bg-subtle hover:text-fg lg:border-0"
              >{{ s.label }}</a
            >
          </li>
        </ul>
      </nav>

      <div class="flex min-w-0 flex-col gap-6 [&_h2]:scroll-mt-24">
        <BaseCard class="p-5 sm:p-6">
          <h2 id="kua" class="text-lg font-semibold">Daftar nikah di KUA</h2>
          <p class="mt-2 max-w-prose text-sm text-pretty text-fg-muted">
            Aturan terbaru: PMA 30/2024 tentang Pencatatan Pernikahan (berlaku 30 Desember 2024).
          </p>
          <dl class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="rounded-md bg-bg-subtle p-4">
              <dt class="text-sm font-medium">Akad di KUA, jam kerja</dt>
              <dd class="mt-1 text-2xl font-semibold tabular-nums">Rp0</dd>
              <dd class="text-xs text-fg-muted">Senin–Jumat, sekitar 08.00–16.00</dd>
            </div>
            <div class="rounded-md bg-bg-subtle p-4">
              <dt class="text-sm font-medium">Di luar KUA atau di luar jam kerja</dt>
              <dd class="mt-1 text-2xl font-semibold tabular-nums">Rp600.000</dd>
              <dd class="text-xs text-fg-muted">
                PNBP sesuai PP 59/2018, perlu persetujuan kepala KUA
              </dd>
            </div>
          </dl>
          <ul class="mt-4 flex max-w-prose list-disc flex-col gap-1 pl-5 text-sm">
            <li>
              Daftar minimal <strong>10 hari kerja</strong> sebelum akad lewat SIMKAH
              (simkah4.kemenag.go.id) atau langsung ke KUA tempat akad.
            </li>
            <li>
              Kurang dari 10 hari kerja: perlu dispensasi camat atau surat pernyataan alasan
              bermeterai.
            </li>
            <li>
              <strong>Bimbingan perkawinan (Bimwin) wajib</strong>. Buku nikah tidak dicetak sebelum
              Bimwin.
            </li>
            <li>Elsimil (BKKBN) diterapkan berbeda per daerah. Tanyakan ke KUA setempat.</li>
          </ul>
          <h3 class="mt-5 text-sm font-semibold">Berkas utama</h3>
          <ul class="mt-2 flex max-w-prose list-disc flex-col gap-1 pl-5 text-sm">
            <li v-for="d in documents" :key="d">{{ d }}</li>
          </ul>
          <h3 class="mt-4 text-sm font-semibold">Berkas tambahan jika berlaku</h3>
          <ul class="mt-2 flex max-w-prose list-disc flex-col gap-1 pl-5 text-sm">
            <li v-for="d in conditional" :key="d">{{ d }}</li>
          </ul>
          <p class="mt-4 text-xs text-fg-muted">
            Isi tiap formulir N1–N4 bisa berbeda antar kelurahan. Ikuti daftar dari kelurahanmu.
          </p>
        </BaseCard>

        <BaseCard class="p-5 sm:p-6">
          <h2 id="urutan" class="text-lg font-semibold">Urutan acara</h2>
          <ol class="mt-4 flex flex-col">
            <li
              v-for="(s, i) in sequence"
              :key="s.name"
              class="relative grid grid-cols-[2rem_1fr] gap-3 pb-5 last:pb-0"
            >
              <span
                class="relative z-10 flex size-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong tabular-nums"
                aria-hidden="true"
                >{{ i + 1 }}</span
              >
              <span
                v-if="i < sequence.length - 1"
                class="absolute top-8 bottom-0 left-4 w-px bg-border"
                aria-hidden="true"
              />
              <div class="min-w-0 pt-1">
                <p class="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
                  {{ s.name }}
                  <span class="text-xs font-normal text-fg-muted">{{ s.when }} · {{ s.who }}</span>
                </p>
                <p class="mt-0.5 text-sm text-fg-muted">{{ s.note }}</p>
              </div>
            </li>
          </ol>
        </BaseCard>

        <BaseCard class="p-5 sm:p-6">
          <h2 id="anggaran" class="text-lg font-semibold">Pembagian anggaran</h2>
          <p class="mt-2 max-w-prose text-sm text-fg-muted">
            Saran awal, disusun dari beberapa sumber. Jika katering sudah termasuk gedung, porsinya
            bisa 50–70%. Bulan madu sebaiknya dianggarkan terpisah.
          </p>
          <div class="relative mt-4 overflow-x-auto">
            <table class="w-full min-w-[28rem] text-sm">
              <caption class="sr-only">
                Pembagian anggaran pernikahan
              </caption>
              <thead class="text-left text-xs text-fg-muted">
                <tr>
                  <th scope="col" class="pb-2 font-medium">Kategori</th>
                  <th scope="col" class="pb-2 text-right font-medium">Kisaran</th>
                  <th scope="col" class="pb-2 text-right font-medium">Saran aplikasi</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="[name, range, def] in allocation"
                  :key="name"
                  class="border-t border-border"
                >
                  <th scope="row" class="py-2 pr-3 text-left font-normal">{{ name }}</th>
                  <td class="py-2 text-right whitespace-nowrap text-fg-muted tabular-nums">
                    {{ range }}
                  </td>
                  <td class="py-2 text-right font-medium tabular-nums">{{ def }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <BaseCard class="p-5 sm:p-6">
          <h2 id="harga" class="text-lg font-semibold">Kisaran harga</h2>
          <p class="mt-2 max-w-prose text-sm text-fg-muted">
            Data Bandung dan Yogyakarta masih sedikit; perkirakan 20–35% di bawah Jakarta lalu cek
            penawaran vendor lokal.
          </p>
          <div class="relative mt-4 overflow-x-auto">
            <table class="w-full min-w-[32rem] text-sm">
              <caption class="sr-only">
                Kisaran harga vendor
              </caption>
              <thead class="text-left text-xs text-fg-muted">
                <tr>
                  <th scope="col" class="pb-2 font-medium">Item</th>
                  <th scope="col" class="pb-2 text-right font-medium">Kisaran</th>
                  <th scope="col" class="pb-2 pl-4 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="[name, range, note] in prices"
                  :key="name"
                  class="border-t border-border"
                >
                  <th scope="row" class="py-2 pr-3 text-left font-normal">{{ name }}</th>
                  <td class="py-2 text-right whitespace-nowrap tabular-nums">{{ range }}</td>
                  <td class="py-2 pl-4 text-fg-muted">{{ note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <BaseCard class="p-5 sm:p-6">
          <h2 id="vendor" class="text-lg font-semibold">Pembayaran vendor</h2>
          <p class="mt-2 max-w-prose text-sm">
            Tidak ada standar baku. Pola yang umum: <strong>DP 20–30%</strong> saat booking,
            <strong>termin 30–40%</strong> di H-60 s.d. H-30, <strong>pelunasan</strong> di H-14
            s.d. H-7. Sebagian vendor menahan 5–10% sampai acara selesai. DP biasanya hangus jika
            batal.
          </p>
          <p class="mt-2 max-w-prose text-sm text-fg-muted">
            Tombol “Buat jadwal termin” di halaman Vendor memakai pola 30% / 40% (H-45) / 30%
            (H-14).
          </p>
          <div
            class="mt-4 flex gap-3 rounded-md border border-warning/40 bg-warning-soft p-4 text-sm"
          >
            <AlertTriangle class="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <p class="max-w-prose">
              Ada beberapa kasus WO yang menerima pembayaran penuh tapi tidak meneruskan ke vendor.
              Konfirmasi langsung ke tiap vendor bahwa DP sudah diterima, transfer ke rekening atas
              nama usaha, dan simpan bukti transfer.
            </p>
          </div>
        </BaseCard>

        <BaseCard class="p-5 sm:p-6">
          <h2 id="tamu" class="text-lg font-semibold">Tamu & katering</h2>
          <ul class="mt-3 flex max-w-prose list-disc flex-col gap-1 pl-5 text-sm">
            <li>1 undangan ≈ 2 orang. Kehadiran biasanya 80–90%.</li>
            <li>
              Porsi katering = perkiraan hadir + cadangan 5–20% untuk keluarga, panitia, dan kru
              vendor. Aplikasi memakai 10% (bisa diubah di Pengaturan).
            </li>
            <li>Pembagian prasmanan : gubukan sekitar 60 : 40.</li>
            <li>Konfirmasi jumlah porsi final ke katering paling lambat H-7.</li>
            <li>
              Catat angpao per pemberi (nama, jumlah, tunai/transfer) untuk membalas saat mereka
              punya hajat.
            </li>
          </ul>
        </BaseCard>

        <BaseCard class="p-5 sm:p-6">
          <h2 id="sumber" class="text-lg font-semibold">Sumber</h2>
          <ul class="mt-3 flex flex-col gap-1 text-sm">
            <li v-for="[label, url] in sources" :key="url">
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-8 items-center gap-1.5 text-primary-strong underline underline-offset-2 hover:no-underline"
              >
                {{ label }}
                <ExternalLink class="size-3.5 shrink-0" aria-hidden="true" />
                <span class="sr-only">(tab baru)</span>
              </a>
            </li>
          </ul>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

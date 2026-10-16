# Rencana Nikah

Wedding planning admin panel for Indonesian weddings (akad + resepsi, adat Jawa, adat Sunda).
Bahasa Indonesia UI, IDR, shared between partner and family.

Modules: Ringkasan (dashboard), Acara, Anggaran, Vendor, Pembayaran, Tamu (RSVP + angpao),
Checklist, Panduan (KUA requirements, adat sequence, price ranges, sources), Pengaturan
(members, invite codes, export).

Stack: Vue 3 + TypeScript + Vite, Tailwind CSS v4, Reka UI, TanStack Query, Clerk (login),
Supabase (Postgres + RLS + realtime). Hosting: Vercel. All on free tiers: Rp 0/month.

## Run locally

```bash
pnpm install
pnpm dev
```

Without keys in `.env.local` the app runs in **demo mode**: no login, data stored in this browser's
localStorage only. Good for trying it out.

## Go live (shared with family)

### 1. Clerk (login)

1. Create an application at https://dashboard.clerk.com (email + Google sign-in recommended).
2. Copy the **Publishable key** (`pk_...`).
3. Open **Integrations → Supabase** (or https://dashboard.clerk.com/setup/supabase) and activate it.
   Copy the **Clerk domain** it shows (e.g. `https://xxx.clerk.accounts.dev`).

### 2. Supabase (database)

1. Create a project at https://supabase.com/dashboard (region Singapore is closest).
2. **Authentication → Sign In / Providers → Third-party auth → Add provider → Clerk**, paste the
   Clerk domain.
3. **SQL Editor**: paste and run `supabase/migrations/0001_init.sql`.
4. **Project Settings → API**: copy the Project URL and the `anon` public key.

### 3. Environment

```bash
cp .env.example .env.local   # or: npx clerk@latest link --app <id> && npx clerk@latest env pull
# fill in:
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Vercel (hosting)

1. Push this folder to a GitHub repo, import it at https://vercel.com/new (framework: Vite).
2. Add the same three env vars in **Settings → Environment Variables**, deploy.
3. In Clerk, add the Vercel domain under **Domains** (production instance) when you switch from
   development keys to production keys.

### 5. Invite family

Pengaturan → Anggota → **Buat kode undangan** (Editor or Hanya lihat). Share the link
`https://<your-app>/gabung/<KODE>`; they sign in with Clerk and join. Codes expire after 14 days.

## Notes

- Free Supabase projects pause after 7 days without activity. Data stays; press **Restore** in
  the Supabase dashboard.
- Access is enforced in Postgres with row-level security (`my_role()` per wedding): owner, editor,
  viewer. The Clerk user id (`auth.jwt()->>'sub'`) is the member key.
- Money is stored as whole rupiah (`bigint`). Inputs accept `150jt`, `1,2M`, `850rb`.
- Starter categories, allocation percentages, adat events and the 50+ task checklist live in
  `src/data/templates.ts` (research from 2025–2026 sources, listed on the Panduan page).

## Scripts

`pnpm dev` · `pnpm build` · `pnpm typecheck` · `pnpm lint:check` · `pnpm format:check`

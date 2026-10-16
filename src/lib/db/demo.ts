import type { Invite, Member, TableName, Wedding } from '@/types'
import type { Db } from './types'

/**
 * Demo adapter: same contract as the cloud one, stored in this browser's localStorage.
 * Used when Clerk/Supabase keys are not configured.
 */
const KEY = 'wedding-planner-demo-v1'
export const DEMO_USER_ID = 'demo-user'

interface Store {
  weddings: Wedding[]
  members: Member[]
  invites: Invite[]
  rows: Record<string, Record<string, unknown>[]>
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    // corrupted or blocked storage: start fresh
  }
  return { weddings: [], members: [], invites: [], rows: {} }
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage full or blocked: keep working in memory
  }
}

/** JSON round-trip: also strips Vue reactive proxies, which structuredClone rejects. */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()
const tick = () => new Promise((r) => setTimeout(r, 120))
const SORTED = new Set(['events', 'budget_categories', 'budget_items', 'tasks'])

export function resetDemo() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function createDemoDb(): Db {
  let s = load()
  const commit = () => save(s)

  function rowsOf(table: TableName) {
    return (s.rows[table] ??= [])
  }

  return {
    mode: 'demo',

    async listWeddings() {
      await tick()
      return clone(s.weddings)
    },
    async createWedding(input, me) {
      await tick()
      const w: Wedding = {
        id: uid(),
        ...clone(input),
        pax_per_invite: 2,
        catering_buffer_pct: 10,
        contingency_pct: 10,
        created_by: me.id,
        created_at: now(),
        updated_at: now(),
      }
      s.weddings.push(w)
      s.members.push({
        wedding_id: w.id,
        user_id: me.id,
        role: 'owner',
        display_name: me.name,
        email: me.email,
        joined_at: now(),
      })
      commit()
      return clone(w)
    },
    async updateWedding(id, patch) {
      await tick()
      const w = s.weddings.find((x) => x.id === id)
      if (!w) throw new Error('Data pernikahan tidak ditemukan.')
      Object.assign(w, clone(patch), { updated_at: now() })
      commit()
      return clone(w)
    },
    async deleteWedding(id) {
      await tick()
      s.weddings = s.weddings.filter((w) => w.id !== id)
      s.members = s.members.filter((m) => m.wedding_id !== id)
      for (const t of Object.keys(s.rows)) s.rows[t] = s.rows[t]!.filter((r) => r.wedding_id !== id)
      commit()
    },

    async listMembers(weddingId) {
      await tick()
      return clone(s.members.filter((m) => m.wedding_id === weddingId))
    },
    async updateMemberRole(weddingId, userId, role) {
      const m = s.members.find((x) => x.wedding_id === weddingId && x.user_id === userId)
      if (m) m.role = role
      commit()
    },
    async removeMember(weddingId, userId) {
      s.members = s.members.filter((x) => !(x.wedding_id === weddingId && x.user_id === userId))
      commit()
    },
    async listInvites(weddingId) {
      await tick()
      return clone(
        s.invites.filter((i) => i.wedding_id === weddingId && !i.revoked && i.expires_at > now()),
      )
    },
    async createInvite(weddingId, role, label) {
      await tick()
      const inv: Invite = {
        id: uid(),
        wedding_id: weddingId,
        code: uid().slice(0, 8).toUpperCase(),
        role,
        label,
        expires_at: new Date(Date.now() + 14 * 864e5).toISOString(),
        revoked: false,
        created_by: DEMO_USER_ID,
        created_at: now(),
      }
      s.invites.unshift(inv)
      commit()
      return clone(inv)
    },
    async revokeInvite(id) {
      const inv = s.invites.find((i) => i.id === id)
      if (inv) inv.revoked = true
      commit()
    },
    async acceptInvite(code) {
      await tick()
      const inv = s.invites.find(
        (i) => i.code === code.trim().toUpperCase() && !i.revoked && i.expires_at > now(),
      )
      if (!inv) throw new Error('invite invalid or expired')
      return inv.wedding_id
    },

    async list(table, weddingId) {
      await tick()
      const rows = rowsOf(table).filter((r) => r.wedding_id === weddingId)
      const sorted = [...rows].sort((a, b) =>
        SORTED.has(table) && a.sort !== b.sort
          ? Number(a.sort) - Number(b.sort)
          : String(a.created_at).localeCompare(String(b.created_at)),
      )
      return clone(sorted) as never
    },
    async insert(table, weddingId, rows) {
      await tick()
      const created = clone(rows).map((r) => ({
        ...r,
        id: r.id ?? uid(),
        wedding_id: weddingId,
        created_by: DEMO_USER_ID,
        created_at: now(),
        updated_at: now(),
      }))
      rowsOf(table).push(...created)
      commit()
      return clone(created) as never
    },
    async update(table, id, patch) {
      await tick()
      const row = rowsOf(table).find((r) => r.id === id)
      if (!row) throw new Error('Data tidak ditemukan. Muat ulang halaman.')
      Object.assign(row, clone(patch), { updated_at: now() })
      commit()
      return clone(row) as never
    },
    async remove(table, ids) {
      await tick()
      const set = new Set(ids)
      s.rows[table] = rowsOf(table).filter((r) => !set.has(String(r.id)))
      // mimic FK rules from the SQL schema
      if (table === 'budget_categories') {
        s.rows.budget_items = rowsOf('budget_items').filter((r) => !set.has(String(r.category_id)))
        for (const t of ['vendors', 'payments'] as const)
          for (const r of rowsOf(t)) if (set.has(String(r.category_id))) r.category_id = null
      }
      if (table === 'vendors') {
        s.rows.payments = rowsOf('payments').filter((r) => !set.has(String(r.vendor_id)))
        for (const r of rowsOf('budget_items')) if (set.has(String(r.vendor_id))) r.vendor_id = null
      }
      if (table === 'events')
        for (const r of rowsOf('budget_items')) if (set.has(String(r.event_id))) r.event_id = null
      commit()
    },

    subscribe(_weddingId, onChange) {
      // other tabs of the same browser
      const handler = (e: StorageEvent) => {
        if (e.key !== KEY) return
        s = load()
        onChange('*')
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}

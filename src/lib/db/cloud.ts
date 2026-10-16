import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Invite, Member, Wedding } from '@/types'
import type { Db } from './types'

const TABLES = [
  'weddings',
  'wedding_members',
  'events',
  'budget_categories',
  'vendors',
  'budget_items',
  'payments',
  'guests',
  'tasks',
]

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

/** Supabase adapter. Clerk issues the JWT; Supabase verifies it as a third-party provider. */
export function createCloudDb(
  url: string,
  anonKey: string,
  getToken: () => Promise<string | null>,
): Db {
  const sb: SupabaseClient = createClient(url, anonKey, { accessToken: getToken })

  return {
    mode: 'cloud',

    async listWeddings() {
      return check(await sb.from('weddings').select('*').order('created_at')) as Wedding[]
    },
    async createWedding(input, me) {
      return check(
        await sb.rpc('create_wedding', { p: input, p_display_name: me.name, p_email: me.email }),
      ) as Wedding
    },
    async updateWedding(id, patch) {
      return check(
        await sb.from('weddings').update(patch).eq('id', id).select().single(),
      ) as Wedding
    },
    async deleteWedding(id) {
      check(await sb.from('weddings').delete().eq('id', id))
    },

    async listMembers(weddingId) {
      return check(
        await sb.from('wedding_members').select('*').eq('wedding_id', weddingId).order('joined_at'),
      ) as Member[]
    },
    async updateMemberRole(weddingId, userId, role) {
      check(
        await sb
          .from('wedding_members')
          .update({ role })
          .eq('wedding_id', weddingId)
          .eq('user_id', userId),
      )
    },
    async removeMember(weddingId, userId) {
      check(
        await sb.from('wedding_members').delete().eq('wedding_id', weddingId).eq('user_id', userId),
      )
    },
    async listInvites(weddingId) {
      return check(
        await sb
          .from('invites')
          .select('*')
          .eq('wedding_id', weddingId)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
      ) as Invite[]
    },
    async createInvite(weddingId, role, label) {
      return check(
        await sb.from('invites').insert({ wedding_id: weddingId, role, label }).select().single(),
      ) as Invite
    },
    async revokeInvite(id) {
      check(await sb.from('invites').update({ revoked: true }).eq('id', id))
    },
    async acceptInvite(code, me) {
      return check(
        await sb.rpc('accept_invite', { p_code: code, p_display_name: me.name, p_email: me.email }),
      ) as string
    },

    async list(table, weddingId) {
      const q = sb.from(table).select('*').eq('wedding_id', weddingId)
      return check(
        await (SORTED.has(table) ? q.order('sort').order('created_at') : q.order('created_at')),
      )
    },
    async insert(table, weddingId, rows) {
      if (!rows.length) return []
      return check(
        await sb
          .from(table)
          .insert(rows.map((r) => ({ ...r, wedding_id: weddingId })))
          .select(),
      )
    },
    async update(table, id, patch) {
      return check(
        await sb
          .from(table)
          .update(patch as never)
          .eq('id', id)
          .select()
          .single(),
      )
    },
    async remove(table, ids) {
      if (!ids.length) return
      check(await sb.from(table).delete().in('id', ids))
    },

    subscribe(weddingId, onChange) {
      const channel = sb.channel(`wedding:${weddingId}`)
      for (const table of TABLES) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: table === 'weddings' ? `id=eq.${weddingId}` : `wedding_id=eq.${weddingId}`,
          },
          () => onChange(table),
        )
      }
      channel.subscribe()
      return () => void sb.removeChannel(channel)
    },
  }
}

const SORTED = new Set(['events', 'budget_categories', 'budget_items', 'tasks'])

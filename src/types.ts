export type Side = 'pria' | 'wanita' | 'bersama'
export type Role = 'owner' | 'editor' | 'viewer'
export type VendorStatus = 'survei' | 'negosiasi' | 'deal' | 'batal'
export type Rsvp = 'belum' | 'hadir' | 'mungkin' | 'tidak'
export type InviteType = 'cetak' | 'digital'
export type Ceremony = 'islam' | 'jawa' | 'sunda'

interface Base {
  id: string
  wedding_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Wedding {
  id: string
  name: string
  partner_a: string
  partner_b: string
  wedding_date: string | null
  city: string
  total_budget: number
  guest_target: number
  pax_per_invite: number
  catering_buffer_pct: number
  contingency_pct: number
  ceremonies: Ceremony[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface Member {
  wedding_id: string
  user_id: string
  role: Role
  display_name: string
  email: string
  joined_at: string
}

export interface Invite {
  id: string
  wedding_id: string
  code: string
  role: Exclude<Role, 'owner'>
  label: string
  expires_at: string
  revoked: boolean
  created_by: string
  created_at: string
}

export interface WeddingEvent extends Base {
  name: string
  kind: string
  side: Side
  date: string | null
  start_time: string
  venue: string
  notes: string
  sort: number
}

export interface Category extends Base {
  name: string
  icon: string
  allocated: number
  notes: string
  sort: number
}

export interface Vendor extends Base {
  category_id: string | null
  name: string
  contact_name: string
  phone: string
  instagram: string
  status: VendorStatus
  contract_total: number
  notes: string
}

export interface BudgetItem extends Base {
  category_id: string
  event_id: string | null
  vendor_id: string | null
  name: string
  estimated: number
  actual: number | null
  notes: string
  sort: number
}

export interface Payment extends Base {
  vendor_id: string | null
  category_id: string | null
  label: string
  amount: number
  due_date: string | null
  paid_at: string | null
  method: string
  notes: string
}

export interface Guest extends Base {
  name: string
  side: Side
  group_name: string
  pax: number
  phone: string
  invite_type: InviteType
  invite_sent: boolean
  rsvp: Rsvp
  events: string[]
  gift_amount: number | null
  gift_channel: '' | 'tunai' | 'transfer' | 'kado'
  notes: string
}

export interface Task extends Base {
  title: string
  phase: string
  category: string
  due_date: string | null
  assignee: string
  done: boolean
  done_at: string | null
  notes: string
  sort: number
}

export interface TableMap {
  events: WeddingEvent
  budget_categories: Category
  vendors: Vendor
  budget_items: BudgetItem
  payments: Payment
  guests: Guest
  tasks: Task
}

export type TableName = keyof TableMap
export type Row<K extends TableName> = TableMap[K]
/** Fields the client sends on insert. Server fills id/timestamps when omitted. */
export type NewRow<K extends TableName> = Omit<
  TableMap[K],
  'id' | 'wedding_id' | 'created_by' | 'created_at' | 'updated_at'
> & { id?: string }
export type Patch<K extends TableName> = Partial<NewRow<K>>

export interface WeddingInput {
  name: string
  partner_a: string
  partner_b: string
  wedding_date: string | null
  city: string
  total_budget: number
  guest_target: number
  ceremonies: Ceremony[]
}

export interface Me {
  id: string
  name: string
  email: string
  imageUrl: string | null
}

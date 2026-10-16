import type {
  Invite,
  Me,
  Member,
  NewRow,
  Patch,
  Role,
  Row,
  TableName,
  Wedding,
  WeddingInput,
} from '@/types'

export interface Db {
  readonly mode: 'demo' | 'cloud'
  listWeddings(): Promise<Wedding[]>
  createWedding(input: WeddingInput, me: Me): Promise<Wedding>
  updateWedding(id: string, patch: Partial<Wedding>): Promise<Wedding>
  deleteWedding(id: string): Promise<void>

  listMembers(weddingId: string): Promise<Member[]>
  updateMemberRole(weddingId: string, userId: string, role: Role): Promise<void>
  removeMember(weddingId: string, userId: string): Promise<void>
  listInvites(weddingId: string): Promise<Invite[]>
  createInvite(weddingId: string, role: Invite['role'], label: string): Promise<Invite>
  revokeInvite(id: string): Promise<void>
  acceptInvite(code: string, me: Me): Promise<string>

  list<K extends TableName>(table: K, weddingId: string): Promise<Row<K>[]>
  insert<K extends TableName>(table: K, weddingId: string, rows: NewRow<K>[]): Promise<Row<K>[]>
  update<K extends TableName>(table: K, id: string, patch: Patch<K>): Promise<Row<K>>
  remove(table: TableName, ids: string[]): Promise<void>

  /** Calls back with the table name whenever another person changes data. */
  subscribe(weddingId: string, onChange: (table: string) => void): () => void
}

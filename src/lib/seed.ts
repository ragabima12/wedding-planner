import { buildCategories, buildEvents, buildTasks } from '@/data/templates'
import type { Ceremony, NewRow } from '@/types'
import { db } from './db'

/** Fills a new wedding with research-based categories, line items, events and checklist. */
export async function seedWedding(
  weddingId: string,
  opts: { totalBudget: number; weddingDate: string | null; ceremonies: Ceremony[] },
) {
  const cats = buildCategories(opts.totalBudget, opts.ceremonies)
  await db.insert(
    'budget_categories',
    weddingId,
    cats.map((c) => c.row),
  )
  const items: NewRow<'budget_items'>[] = cats.flatMap((c) =>
    c.items.map((name, i) => ({
      category_id: c.row.id,
      event_id: null,
      vendor_id: null,
      name,
      estimated: 0,
      actual: null,
      notes: '',
      sort: i,
    })),
  )
  await Promise.all([
    db.insert('budget_items', weddingId, items),
    db.insert('events', weddingId, buildEvents(opts.weddingDate, opts.ceremonies)),
    db.insert('tasks', weddingId, buildTasks(opts.weddingDate, opts.ceremonies)),
  ])
}

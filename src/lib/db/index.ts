import { env } from '@/lib/env'
import { getToken } from '@/lib/auth'
import { createCloudDb } from './cloud'
import { createDemoDb } from './demo'
import type { Db } from './types'

export const db: Db = env.isDemo
  ? createDemoDb()
  : createCloudDb(env.supabaseUrl, env.supabaseAnonKey, getToken)

export type { Db }

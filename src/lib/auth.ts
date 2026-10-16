import { reactive } from 'vue'
import type { Me } from '@/types'
import { env } from './env'
import { DEMO_USER_ID } from './db/demo'

/**
 * App-wide auth state. In cloud mode <ClerkBridge> fills it from Clerk;
 * in demo mode it is a fixed local user. Pages never import Clerk directly.
 */
export const auth = reactive({
  isLoaded: env.isDemo,
  isSignedIn: env.isDemo,
  me: (env.isDemo
    ? { id: DEMO_USER_ID, name: 'Saya (demo)', email: 'demo@lokal', imageUrl: null }
    : null) as Me | null,
})

let tokenGetter: () => Promise<string | null> = async () => null
let signOutFn: () => Promise<void> = async () => {}

export function connectAuth(getToken: typeof tokenGetter, signOut: typeof signOutFn) {
  tokenGetter = getToken
  signOutFn = signOut
}

export const getToken = () => tokenGetter()
export const signOut = () => signOutFn()

/** Resolves once Clerk has loaded (immediately in demo mode). */
export function whenAuthLoaded(): Promise<void> {
  if (auth.isLoaded) return Promise.resolve()
  return new Promise((resolve) => {
    const id = setInterval(() => {
      if (auth.isLoaded) {
        clearInterval(id)
        resolve()
      }
    }, 30)
  })
}

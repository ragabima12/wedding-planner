const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? ''
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** Cloud mode needs all three keys. Anything missing: demo mode, data in this browser only. */
export const env = {
  clerkKey,
  supabaseUrl,
  supabaseAnonKey,
  isDemo: !(clerkKey && supabaseUrl && supabaseAnonKey),
}

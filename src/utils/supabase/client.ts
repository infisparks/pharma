import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials are missing. Client will not be initialized.')
        // Return a dummy client or throw a more informative error only at runtime
        // During build (prerendering), we return a dummy to avoid crashing
        return createBrowserClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseAnonKey || 'placeholder'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

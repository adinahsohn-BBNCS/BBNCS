import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Public config for inline browser scripts (no secrets beyond anon key). */
export function getSupabasePublicConfig() {
  return {
    url: url ?? "",
    anonKey: anonKey ?? "",
    configured: isSupabaseConfigured(),
  };
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These two values are public by design (the publishable key only allows what
// the database security rules allow). They can be overridden with env vars.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hzhohfrjzufafgdzjnyw.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_CioEMCNQupijdmFTToinCw_0ae3kN4E";

let browserClient: SupabaseClient | null = null;

// For client components (cart, checkout, admin). Keeps the admin login session.
export function getBrowserClient(): SupabaseClient {
  if (!browserClient) browserClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return browserClient;
}

// For server components (public pages). No session.
export function getServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

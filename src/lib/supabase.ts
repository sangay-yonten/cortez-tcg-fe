import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes("YOUR_PROJECT_REF") &&
    !anonKey.includes("YOUR_SUPABASE_ANON_KEY"),
);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add your project URL + anon key.",
    );
  }
  if (!client) {
    client = createClient(url!, anonKey!);
  }
  return client;
}

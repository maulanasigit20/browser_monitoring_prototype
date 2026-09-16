import { createClient } from "@supabase/supabase-js";

// PENTING: file ini hanya dipakai di server (API routes).
// service role key bypass RLS -- jangan pernah kirim ke client.
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error("Supabase env vars belum di-set");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

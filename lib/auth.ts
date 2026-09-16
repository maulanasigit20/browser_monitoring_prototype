import { getSupabaseServerClient } from "./supabase";

/**
 * Validasi header Authorization: Bearer <api_key> yang dikirim dari Android.
 * Setiap employee/device punya api_key unik dari tabel employees.
 * Return employee record kalau valid, null kalau tidak.
 */
export async function verifyDeviceApiKey(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!apiKey) return null;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, device_id, is_active")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

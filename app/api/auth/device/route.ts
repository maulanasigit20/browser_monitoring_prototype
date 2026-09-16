import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// Dipanggil sekali saat Android app pertama kali setup / device baru didaftarkan
// oleh admin. Untuk demo: device didaftarkan manual dulu lewat Supabase table
// editor (insert row employees dengan device_id), lalu endpoint ini dipakai
// buat device "klaim" api_key-nya pakai device_id yang sudah admin daftarkan.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.device_id) {
    return NextResponse.json({ error: "device_id wajib diisi" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, api_key, is_active")
    .eq("device_id", body.device_id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Device belum terdaftar, hubungi admin" },
      { status: 404 }
    );
  }

  if (!data.is_active) {
    return NextResponse.json({ error: "Device dinonaktifkan" }, { status: 403 });
  }

  return NextResponse.json({
    employee_id: data.id,
    name: data.name,
    api_key: data.api_key,
  });
}

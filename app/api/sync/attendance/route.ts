import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { verifyDeviceApiKey } from "@/lib/auth";

// Body: { "type": "check_in", "latitude": -6.2, "longitude": 106.8, "photo_url": null, "occurred_at": "..." }
// Absensi biasanya 1 event per aksi (bukan ,batch), beda dari browser activity / location.
export async function POST(request: Request) {
  const employee = await verifyDeviceApiKey(request);
  if (!employee) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.type || !["check_in", "check_out"].includes(body.type) || !body?.occurred_at) {
    return NextResponse.json(
      { error: "type ('check_in'/'check_out') dan occurred_at wajib diisi" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendance_logs")
    .insert({
      employee_id: employee.id,
      type: body.type,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      photo_url: body.photo_url ?? null,
      occurred_at: body.occurred_at,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: true, record: data });
}

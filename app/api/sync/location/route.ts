import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { verifyDeviceApiKey } from "@/lib/auth";

// Body: { "entries": [{ "latitude": -6.2, "longitude": 106.8, "accuracy_m": 12.5, "occurred_at": "..." }] }
export async function POST(request: Request) {
  const employee = await verifyDeviceApiKey(request);
  if (!employee) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries = body?.entries;

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "entries wajib berupa array dan tidak kosong" }, { status: 400 });
  }

  const rows = entries.map((e: any) => ({
    employee_id: employee.id,
    latitude: e.latitude,
    longitude: e.longitude,
    accuracy_m: e.accuracy_m ?? null,
    occurred_at: e.occurred_at,
  }));

  const supabase = getSupabaseServerClient();
  const { error, count } = await supabase
    .from("location_logs")
    .insert(rows, { count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: count ?? rows.length });
}

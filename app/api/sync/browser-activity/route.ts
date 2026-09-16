import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { verifyDeviceApiKey } from "@/lib/auth";

// Body yang diharapkan dari Android (batch, sesuai WorkManager sync job):
// {
//   "entries": [
//     {
//       "browser_package": "com.android.chrome",
//       "url": "https://www.google.com/search?q=contoh",
//       "domain": "google.com",
//       "is_search": true,
//       "search_query": "contoh",
//       "event_type": "WINDOW_STATE_CHANGED",
//       "occurred_at": "2026-09-15T08:30:00Z"
//     }
//   ]
// }
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
    browser_package: e.browser_package,
    url: e.url,
    domain: e.domain ?? null,
    is_search: !!e.is_search,
    search_query: e.search_query ?? null,
    event_type: e.event_type,
    occurred_at: e.occurred_at,
  }));

  const supabase = getSupabaseServerClient();
  const { error, count } = await supabase
    .from("browser_activity")
    .insert(rows, { count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: count ?? rows.length });
}

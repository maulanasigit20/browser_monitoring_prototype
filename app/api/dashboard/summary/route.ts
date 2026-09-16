import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/dashboard/summary
// Dipanggil dari web dashboard (bukan Android)., Untuk demo tidak pakai auth
// admin yang kompleks -- lihat catatan keamanan di README sebelum production.
export async function GET() {
  const supabase = getSupabaseServerClient();

  const [{ count: employeeCount }, { count: browserCount }, { count: locationCount }, { count: attendanceCount }] =
    await Promise.all([
      supabase.from("employees").select("*", { count: "exact", head: true }),
      supabase.from("browser_activity").select("*", { count: "exact", head: true }),
      supabase.from("location_logs").select("*", { count: "exact", head: true }),
      supabase.from("attendance_logs").select("*", { count: "exact", head: true }),
    ]);

  return NextResponse.json({
    employees: employeeCount ?? 0,
    browser_events: browserCount ?? 0,
    location_events: locationCount ?? 0,
    attendance_events: attendanceCount ?? 0,
  });
}

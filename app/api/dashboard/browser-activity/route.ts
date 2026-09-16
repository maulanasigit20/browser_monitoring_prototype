import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/dashboard/browser-activity?employeeId=&isSearch=true&limit=50
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const isSearch = searchParams.get("isSearch");
  const limit = Number(searchParams.get("limit") ?? 50);

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("browser_activity")
    .select("id, employee_id, browser_package, url, domain, is_search, search_query, occurred_at, employees(name)")
    .order("occurred_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (isSearch === "true") query = query.eq("is_search", true);
  if (isSearch === "false") query = query.eq("is_search", false);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

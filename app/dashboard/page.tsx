import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isCriticalActivity } from "@/lib/flagging";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function timeAgo(iso: string | null) {
  if (!iso) return "Belum ada aktivitas";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

async function getEmployeeSummaries() {
  const supabase = getSupabaseServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, email, is_active")
    .order("name", { ascending: true });

  if (!employees || employees.length === 0) return [];

  const summaries = await Promise.all(
    employees.map(async (emp) => {
      const [{ data: lastBrowser }, { count: browserCount }, { data: criticalHits }, { data: lastAttendance }] =
        await Promise.all([
          supabase
            .from("browser_activity")
            .select("occurred_at")
            .eq("employee_id", emp.id)
            .order("occurred_at", { ascending: false })
            .limit(1),
          supabase
            .from("browser_activity")
            .select("*", { count: "exact", head: true })
            .eq("employee_id", emp.id),
          supabase
            .from("browser_activity")
            .select("url, domain, search_query")
            .eq("employee_id", emp.id)
            .order("occurred_at", { ascending: false })
            .limit(20),
          supabase
            .from("attendance_logs")
            .select("type, occurred_at")
            .eq("employee_id", emp.id)
            .order("occurred_at", { ascending: false })
            .limit(1),
        ]);

      const hasCritical = (criticalHits ?? []).some((row) => isCriticalActivity(row));

      return {
        ...emp,
        lastBrowserAt: lastBrowser?.[0]?.occurred_at ?? null,
        browserCount: browserCount ?? 0,
        hasCritical,
        lastAttendance: lastAttendance?.[0] ?? null,
      };
    })
  );

  return summaries;
}

export default async function EmployeesPage() {
  const employees = await getEmployeeSummaries();

  return (
    <>
      <h2 className="section-title">Karyawan</h2>

      {employees.length === 0 ? (
        <div className="empty-state">
          Belum ada karyawan terdaftar. Tambahkan lewat Supabase Table Editor &gt; employees.
        </div>
      ) : (
        <div className="employee-grid">
          {employees.map((emp) => (
            <Link href={`/dashboard/employees/${emp.id}`} key={emp.id} className="employee-card">
              <div className="employee-card-top">
                <div className="employee-name">{emp.name}</div>
                {emp.hasCritical && <span className="badge critical">critical</span>}
              </div>
              <div className="employee-meta">{emp.email ?? "-"}</div>
              <div className="employee-stats">
                <div>
                  <div className="employee-stat-value">{emp.browserCount}</div>
                  <div className="employee-stat-label">event browser</div>
                </div>
                <div>
                  <div className="employee-stat-value">
                    {emp.lastAttendance
                      ? emp.lastAttendance.type === "check_in"
                        ? "Masuk"
                        : "Pulang"
                      : "-"}
                  </div>
                  <div className="employee-stat-label">absensi terakhir</div>
                </div>
              </div>
              <div className="employee-lastseen">Terakhir browsing: {timeAgo(emp.lastBrowserAt)}</div>
              {!emp.is_active && <div className="employee-inactive">Nonaktif</div>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

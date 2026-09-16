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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

/** Batas awal "hari ini" dalam WIB (Asia/Jakarta, UTC+7, gak ada DST). */
function todayStartISO() {
  const now = new Date();
  const jakartaDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // "YYYY-MM-DD"
  return new Date(`${jakartaDateStr}T00:00:00+07:00`).toISOString();
}

async function getDashboardData() {
  const supabase = getSupabaseServerClient();
  const todayStart = todayStartISO();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, email, is_active")
    .order("name", { ascending: true });

  const employeeList = employees ?? [];

  const rows = await Promise.all(
    employeeList.map(async (emp) => {
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

  // Agregat buat summary cards
  const [{ count: checkInToday }, { count: checkOutToday }, { count: browserEventsToday }, { data: checkedInTodayRows }] =
    await Promise.all([
      supabase
        .from("attendance_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "check_in")
        .gte("occurred_at", todayStart),
      supabase
        .from("attendance_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "check_out")
        .gte("occurred_at", todayStart),
      supabase
        .from("browser_activity")
        .select("*", { count: "exact", head: true })
        .gte("occurred_at", todayStart),
      supabase.from("attendance_logs").select("employee_id").eq("type", "check_in").gte("occurred_at", todayStart),
    ]);

  const employeesCheckedInToday = new Set((checkedInTodayRows ?? []).map((r) => r.employee_id)).size;
  const criticalCount = rows.filter((r) => r.hasCritical).length;

  return {
    rows,
    summary: {
      totalEmployees: employeeList.length,
      criticalCount,
      normalCount: employeeList.length - criticalCount,
      checkInToday: checkInToday ?? 0,
      checkOutToday: checkOutToday ?? 0,
      notCheckedInToday: employeeList.length - employeesCheckedInToday,
      browserEventsToday: browserEventsToday ?? 0,
    },
  };
}

export default async function EmployeesPage() {
  const { rows, summary } = await getDashboardData();

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <div className="stat-value">{summary.totalEmployees}</div>
          <div className="stat-label">Total karyawan</div>
        </div>
        <div className="stat stat-critical">
          <div className="stat-value">{summary.criticalCount}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary.normalCount}</div>
          <div className="stat-label">Normal</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary.checkInToday}</div>
          <div className="stat-label">Check-in hari ini</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary.checkOutToday}</div>
          <div className="stat-label">Check-out hari ini</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary.notCheckedInToday}</div>
          <div className="stat-label">Belum absen hari ini</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary.browserEventsToday}</div>
          <div className="stat-label">Event browser hari ini</div>
        </div>
      </div>

      <h2 className="section-title">Karyawan</h2>

      {rows.length === 0 ? (
        <div className="empty-state">
          Belum ada karyawan terdaftar. Tambahkan lewat Supabase Table Editor &gt; employees.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Absensi terakhir</th>
              <th>Event browser</th>
              <th>Severity</th>
              <th>Terakhir browsing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <Link href={`/dashboard/employees/${emp.id}`} className="link">
                    {emp.name}
                  </Link>
                  {!emp.is_active && <span className="inline-inactive">nonaktif</span>}
                </td>
                <td className="mono">{emp.email ?? "-"}</td>
                <td className="mono">
                  {emp.lastAttendance
                    ? `${emp.lastAttendance.type === "check_in" ? "Masuk" : "Pulang"} ${formatTime(emp.lastAttendance.occurred_at)}`
                    : "-"}
                </td>
                <td className="mono">{emp.browserCount}</td>
                <td>
                  {emp.hasCritical ? (
                    <span className="badge critical">critical</span>
                  ) : (
                    <span className="badge">normal</span>
                  )}
                </td>
                <td className="mono">{timeAgo(emp.lastBrowserAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

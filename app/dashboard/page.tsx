import { getSupabaseServerClient } from "@/lib/supabase";

// Tiga baris ini sengaja tiga-tiganya dipasang (bukan cuma dynamic) sebagai
// pengaman berlapis supaya Vercel/Next.js beneran gak nge-cache halaman ini
// sama sekali -- data harus selalu fresh dari Supabase tiap kali dibuka.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getData() {
  const supabase = getSupabaseServerClient();

  const [{ count: employeeCount }, { count: browserCount }, { count: locationCount }, { count: attendanceCount }] =
    await Promise.all([
      supabase.from("employees").select("*", { count: "exact", head: true }),
      supabase.from("browser_activity").select("*", { count: "exact", head: true }),
      supabase.from("location_logs").select("*", { count: "exact", head: true }),
      supabase.from("attendance_logs").select("*", { count: "exact", head: true }),
    ]);

  const { data: recentActivity } = await supabase
    .from("browser_activity")
    .select("id, browser_package, url, domain, is_search, search_query, occurred_at, employees(name)")
    .order("occurred_at", { ascending: false })
    .limit(30);

  return {
    stats: {
      employees: employeeCount ?? 0,
      browser: browserCount ?? 0,
      location: locationCount ?? 0,
      attendance: attendanceCount ?? 0,
    },
    recentActivity: recentActivity ?? [],
  };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const { stats, recentActivity } = await getData();

  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <div className="stat-value">{stats.employees}</div>
          <div className="stat-label">Karyawan terdaftar</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.browser}</div>
          <div className="stat-label">Event browser</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.location}</div>
          <div className="stat-label">Titik lokasi</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.attendance}</div>
          <div className="stat-label">Record absensi</div>
        </div>
      </div>

      <h2 className="section-title">Aktivitas browser terbaru</h2>

      {recentActivity.length === 0 ? (
        <div className="empty-state">
          Belum ada data. Sync dari Android app dulu, atau insert manual di Supabase table editor untuk testing.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Karyawan</th>
              <th>Browser</th>
              <th>URL / pencarian</th>
              <th>Tipe</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((row: any) => (
              <tr key={row.id}>
                <td className="mono">{formatTime(row.occurred_at)}</td>
                <td>{row.employees?.name ?? "-"}</td>
                <td className="mono">{row.browser_package?.replace("com.android.", "")}</td>
                <td>
                  {row.is_search ? (
                    <span>{row.search_query}</span>
                  ) : (
                    <span className="mono">{row.domain ?? row.url}</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${row.is_search ? "flag" : ""}`}>
                    {row.is_search ? "search" : "website"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

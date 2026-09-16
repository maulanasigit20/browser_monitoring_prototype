import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function AttendancePage() {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from("attendance_logs")
    .select("id, type, latitude, longitude, occurred_at, employees(name)")
    .order("occurred_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];

  return (
    <>
      <h2 className="section-title">Riwayat absensi</h2>

      {rows.length === 0 ? (
        <div className="empty-state">Belum ada data absensi.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Karyawan</th>
              <th>Tipe</th>
              <th>Jam</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td className="mono">{formatDate(row.occurred_at)}</td>
                <td>{row.employees?.name ?? "-"}</td>
                <td>
                  <span className={`badge ${row.type === "check_in" ? "" : "flag"}`}>
                    {row.type === "check_in" ? "Masuk" : "Pulang"}
                  </span>
                </td>
                <td className="mono">{formatTime(row.occurred_at)}</td>
                <td className="mono">
                  {row.latitude != null && row.longitude != null ? (
                    <a
                      className="link"
                      href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      lihat
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LocationPage() {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from("location_logs")
    .select("id, latitude, longitude, accuracy_m, occurred_at, employees(name)")
    .order("occurred_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];

  return (
    <>
      <h2 className="section-title">Riwayat lokasi</h2>

      {rows.length === 0 ? (
        <div className="empty-state">
          Belum ada data lokasi. Ingat, LocationTrackingWorker capture tiap 15 menit (atau trigger manual lewat
          tombol "Sync sekarang" di app).
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Karyawan</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Akurasi</th>
              <th>Peta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td className="mono">{formatTime(row.occurred_at)}</td>
                <td>{row.employees?.name ?? "-"}</td>
                <td className="mono">{row.latitude.toFixed(5)}</td>
                <td className="mono">{row.longitude.toFixed(5)}</td>
                <td className="mono">{row.accuracy_m ? `${Math.round(row.accuracy_m)}m` : "-"}</td>
                <td>
                  <a
                    className="mono link"
                    href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    buka peta
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

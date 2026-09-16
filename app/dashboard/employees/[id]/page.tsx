import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isCriticalActivity } from "@/lib/flagging";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";


function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

type Tab = "browser" | "location" | "attendance";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const supabase = getSupabaseServerClient();
  const tab: Tab = (searchParams.tab as Tab) ?? "browser";

  const { data: employee } = await supabase
    .from("employees")
    .select("id, name, email, device_id, is_active")
    .eq("id", params.id)
    .single();

  if (!employee) notFound();

  return (
    <>
      <Link href="/dashboard" className="link back-link">
        ← Semua karyawan
      </Link>

      <div className="employee-header">
        <h2 className="section-title">{employee.name}</h2>
        <div className="employee-meta">{employee.email ?? "-"}</div>
      </div>

      <div className="tab-row">
        <Link href={`?tab=browser`} className={`tab ${tab === "browser" ? "tab-active" : ""}`}>
          Browser Activity
        </Link>
        <Link href={`?tab=location`} className={`tab ${tab === "location" ? "tab-active" : ""}`}>
          Lokasi
        </Link>
        <Link href={`?tab=attendance`} className={`tab ${tab === "attendance" ? "tab-active" : ""}`}>
          Absensi
        </Link>
      </div>

      {tab === "browser" && <BrowserTab employeeId={employee.id} />}
      {tab === "location" && <LocationTab employeeId={employee.id} />}
      {tab === "attendance" && <AttendanceTab employeeId={employee.id} />}
    </>
  );
}

async function BrowserTab({ employeeId }: { employeeId: string }) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("browser_activity")
    .select("id, browser_package, url, domain, is_search, search_query, occurred_at")
    .eq("employee_id", employeeId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  if (rows.length === 0) return <div className="empty-state">Belum ada aktivitas browser.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Waktu</th>
          <th>Browser</th>
          <th>URL / pencarian</th>
          <th>Tipe</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const critical = isCriticalActivity(row);
          return (
            <tr key={row.id} className={critical ? "row-critical" : ""}>
              <td className="mono">{formatDateTime(row.occurred_at)}</td>
              <td className="mono">{row.browser_package?.replace("com.android.", "")}</td>
              <td>{row.is_search ? row.search_query : <span className="mono">{row.domain ?? row.url}</span>}</td>
              <td>
                {critical ? (
                  <span className="badge critical">critical</span>
                ) : (
                  <span className={`badge ${row.is_search ? "flag" : ""}`}>{row.is_search ? "search" : "website"}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

async function LocationTab({ employeeId }: { employeeId: string }) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("location_logs")
    .select("id, latitude, longitude, accuracy_m, occurred_at")
    .eq("employee_id", employeeId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  if (rows.length === 0) return <div className="empty-state">Belum ada data lokasi.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Waktu</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Akurasi</th>
          <th>Peta</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="mono">{formatDateTime(row.occurred_at)}</td>
            <td className="mono">{row.latitude != null ? row.latitude.toFixed(5) : "-"}</td>
            <td className="mono">{row.longitude != null ? row.longitude.toFixed(5) : "-"}</td>
            <td className="mono">{row.accuracy_m ? `${Math.round(row.accuracy_m)}m` : "-"}</td>
            <td>
              {row.latitude != null && row.longitude != null ? (
                <a className="link mono" href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer">
                  buka peta
                </a>
              ) : (
                "-"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function AttendanceTab({ employeeId }: { employeeId: string }) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("attendance_logs")
    .select("id, type, latitude, longitude, occurred_at")
    .eq("employee_id", employeeId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  if (rows.length === 0) return <div className="empty-state">Belum ada data absensi.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Tipe</th>
          <th>Jam</th>
          <th>Lokasi</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="mono">{formatDateTime(row.occurred_at)}</td>
            <td>
              <span className={`badge ${row.type === "check_in" ? "" : "flag"}`}>
                {row.type === "check_in" ? "Masuk" : "Pulang"}
              </span>
            </td>
            <td className="mono">
              {new Date(row.occurred_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
            </td>
            <td className="mono">
              {row.latitude != null && row.longitude != null ? (
                <a className="link" href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer">
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
  );
}

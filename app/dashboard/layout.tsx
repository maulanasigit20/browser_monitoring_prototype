import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav-brand">
          <strong>Monitoring</strong>
          demo dashboard
        </div>
        <Link href="/dashboard">Aktivitas browser</Link>
        <Link href="/dashboard/location">Lokasi</Link>
        <Link href="/dashboard/attendance">Absensi</Link>
      </nav>

      <main className="main">{children}</main>
    </div>
  );
}

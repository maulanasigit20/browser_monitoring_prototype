import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav-brand">
          <strong>Monitoring</strong>
          Dashboard
        </div>
        <Link href="/dashboard">Karyawan</Link>
      </nav>

      <main className="main">{children}</main>
    </div>
  );
}

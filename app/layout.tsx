import "./globals.css";

export const metadata = {
  title: "Monitoring Dashboard",
  description: "Dashboard monitoring aktivitas karyawan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

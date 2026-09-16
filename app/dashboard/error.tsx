"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="empty-state">
      Ada error waktu load halaman ini: {error.message}
      <br />
      <button
        onClick={() => reset()}
        style={{
          marginTop: 12,
          padding: "6px 14px",
          background: "transparent",
          border: "1px solid var(--border-strong)",
          color: "var(--text)",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Coba lagi
      </button>
    </div>
  );
}

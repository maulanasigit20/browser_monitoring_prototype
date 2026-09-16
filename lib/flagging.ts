// Kata kunci yang dianggap "critical" -- tinggal tambahin sendiri di array ini
// kalau mau extend (misal kata kunci judi lain, dll). Case-insensitive.
const CRITICAL_KEYWORDS = ["slot"];

/** Cek apakah sebuah teks (URL, domain, atau search query) mengandung kata kunci critical. */
export function isCriticalText(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRITICAL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/** Cek satu row browser_activity sekaligus (url + domain + search_query). */
export function isCriticalActivity(row: { url?: string | null; domain?: string | null; search_query?: string | null }): boolean {
  return isCriticalText(row.url) || isCriticalText(row.domain) || isCriticalText(row.search_query);
}

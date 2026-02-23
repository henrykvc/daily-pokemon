// ── Asia/Seoul 기준 오늘 날짜 (브라우저 타임존 의존 금지) ──

export function getSeoulDateString(): string {
  // Intl.DateTimeFormat으로 Seoul 시간 기준 날짜 문자열 반환
  const now = new Date();
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${d}`; // "YYYY-MM-DD"
}

export function formatDisplayDate(dateStr: string): string {
  // "2025-01-15" → "2025년 1월 15일"
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

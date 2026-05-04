export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(startDate: string, endDate: string | null = todayIso()) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate ?? todayIso()}T00:00:00`);
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function addDaysIso(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

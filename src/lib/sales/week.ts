/** The Monday on or before today, as an ISO date — the week_start
 * resource_allocations rows key on. */
export function currentWeekStart(now = new Date()): string {
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

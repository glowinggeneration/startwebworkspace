/** First-of-month ISO date (YYYY-MM-01), matching the `date` columns
 * monthly_targets.month and monthly_plan_lines.month use. */
export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function isSameMonth(isoDate: string, monthKey: string): boolean {
  return isoDate.slice(0, 7) === monthKey.slice(0, 7);
}

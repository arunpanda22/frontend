/**
 * Whole-month date helpers for the Flipkart Keywords page.
 *
 * Place at: src/app/flipkart/dashboard/keywords/utils/keywordDates.ts
 *
 * WHY WHOLE MONTHS
 * Keyword data is stored as monthly periods. The backend counts a month only when the WHOLE period lies inside
 * start_date..end_date, so a free date range that cuts through a month would silently drop that month. The page
 * therefore works in months: the user picks a first and a last month, and these helpers turn that into
 *     start_date = the 1st of the first month
 *     end_date   = the LAST DAY of the last month (even for the current month: the stored month-to-date row ends
 *                  earlier, so it is still inside the range)
 * It also keeps the backend's comparison window ("the same number of whole months before the range") whole.
 *
 * LIMITS: history is the last 12 months and the API accepts at most 366 days, so the picker offers the last 12
 * calendar months (12 months is at most 366 days).
 *
 * All dates are built from local year / month / day numbers and never go through toISOString(), which would shift
 * the day for users ahead of UTC (India).
 */

/** A month as "YYYY-MM". Strings of this shape compare correctly with < and >. */
export type YearMonth = string;

export interface MonthRange {
  from: YearMonth;
  to: YearMonth;
}

export interface MonthOption {
  value: YearMonth;
  /** e.g. "Oct 2026" */
  label: string;
}

/** How many months of history the pull keeps; also the number of months the picker offers. */
export const MONTHS_OF_HISTORY = 12;

const pad = (value: number) => String(value).padStart(2, "0");

export function toYearMonth(date: Date): YearMonth {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function parseYearMonth(value: YearMonth): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** The last MONTHS_OF_HISTORY calendar months up to and including the current one, oldest first. */
export function buildMonthOptions(today: Date = new Date()): MonthOption[] {
  const options: MonthOption[] = [];
  for (let offset = MONTHS_OF_HISTORY - 1; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    options.push({
      value: toYearMonth(date),
      label: date.toLocaleString("en-GB", { month: "short", year: "numeric" }),
    });
  }
  return options;
}

/** "Last n months" ending with the current month, e.g. lastMonthsRange(3) in Oct 2026 = Aug..Oct 2026. */
export function lastMonthsRange(monthCount: number, today: Date = new Date()): MonthRange {
  const first = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1), 1);
  return { from: toYearMonth(first), to: toYearMonth(today) };
}

/** Number of calendar months in the range, both ends included. */
export function monthCount(range: MonthRange): number {
  const from = parseYearMonth(range.from);
  const to = parseYearMonth(range.to);
  return (to.year - from.year) * 12 + (to.month - from.month) + 1;
}

/** The start_date / end_date strings (YYYY-MM-DD) the API expects for a month range. */
export function monthRangeToDates(range: MonthRange): { startDate: string; endDate: string } {
  const from = parseYearMonth(range.from);
  const to = parseYearMonth(range.to);
  const lastDay = new Date(to.year, to.month, 0).getDate(); // day 0 of next month = last day of this month
  return {
    startDate: `${from.year}-${pad(from.month)}-01`,
    endDate: `${to.year}-${pad(to.month)}-${pad(lastDay)}`,
  };
}

/** True when both ranges cover exactly the same months. */
export function isSameRange(a: MonthRange, b: MonthRange): boolean {
  return a.from === b.from && a.to === b.to;
}

/** "Aug 2026 - Oct 2026", or "Oct 2026" for a single month. */
export function formatMonthRange(range: MonthRange): string {
  const label = (value: YearMonth) => {
    const { year, month } = parseYearMonth(value);
    return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "short", year: "numeric" });
  };
  return range.from === range.to ? label(range.from) : `${label(range.from)} - ${label(range.to)}`;
}
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
 *     end_date   = the LAST DAY of the last month
 * It also keeps the backend's comparison window ("the same number of whole months before the range") whole.
 *
 * COMPLETE MONTHS ONLY (the current month is not offered)
 * The current month is only stored month-to-date, so early in a month (say the 4th) it holds a few days of data and
 * every comparison against a full previous month looks like a collapse. The page therefore offers COMPLETE months
 * only: the latest selectable month is LAST month, and the default range and the presets end there. To offer the
 * current (month-to-date) month again, set INCLUDE_CURRENT_MONTH to true: nothing else needs to change, because the
 * backend already handles a month-to-date period (the summary then shows a "month-to-date" notice).
 *
 * LIMITS: history is the last 12 months and the API accepts at most 366 days, so the picker offers 12 calendar
 * months (12 months is at most 366 days). A month that was never pulled simply shows as missing in the notices.
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

/** How many months the picker offers (the pull keeps about 12 months of history). */
export const MONTHS_OF_HISTORY = 12;

/** false = only complete months can be chosen (the default). true = the current, month-to-date month is offered too. */
export const INCLUDE_CURRENT_MONTH = false;

const pad = (value: number) => String(value).padStart(2, "0");

export function toYearMonth(date: Date): YearMonth {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function parseYearMonth(value: YearMonth): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** First day of the latest month the user can select: last month, or the current month when INCLUDE_CURRENT_MONTH. */
export function latestSelectableMonth(today: Date = new Date()): Date {
  return new Date(today.getFullYear(), today.getMonth() - (INCLUDE_CURRENT_MONTH ? 0 : 1), 1);
}

/** The MONTHS_OF_HISTORY months up to and including the latest selectable month, oldest first. */
export function buildMonthOptions(today: Date = new Date()): MonthOption[] {
  const latest = latestSelectableMonth(today);
  const options: MonthOption[] = [];
  for (let offset = MONTHS_OF_HISTORY - 1; offset >= 0; offset--) {
    const date = new Date(latest.getFullYear(), latest.getMonth() - offset, 1);
    options.push({
      value: toYearMonth(date),
      label: date.toLocaleString("en-GB", { month: "short", year: "numeric" }),
    });
  }
  return options;
}

/**
 * "Last n months" ending with the latest selectable month.
 * On 4 Nov 2026 (current month excluded): lastMonthsRange(3) = Aug..Oct 2026, lastMonthsRange(6) = May..Oct 2026.
 */
export function lastMonthsRange(monthCount: number, today: Date = new Date()): MonthRange {
  const latest = latestSelectableMonth(today);
  const first = new Date(latest.getFullYear(), latest.getMonth() - (monthCount - 1), 1);
  return { from: toYearMonth(first), to: toYearMonth(latest) };
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
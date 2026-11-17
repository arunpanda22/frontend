/**
 * Month-based "data coverage" notices for the Flipkart pages that run on MONTHLY data (Keywords and Search Terms).
 *
 * Place at: src/app/flipkart/dashboard/utils/dataCoverageNotices.ts   (shared by both pages)
 *
 * WHY THIS EXISTS
 * Keyword and search-term data is stored as monthly periods, so "23 of 31 days" style messages are wrong: a month is
 * either stored (complete), stored month-to-date (the current month, ends before the month does), or missing. The
 * backend returns the facts in `data_days` for the selected window and for the previous window:
 *     periods_with_data  stored months inside the window
 *     months_in_range    months that SHOULD be there for a month-aligned window
 *     partial_periods    stored month-to-date periods [{ start_date, end_date }]
 * This file turns them into plain sentences. Both pages call buildCoverageNotices() and only render the result, so the
 * wording and the rules live in one place.
 *
 * RULES (in the order the notices are produced)
 *   1. No stored data in the selected window   -> "No <subject> data is stored for the selected months yet."  (warning)
 *   2. Some selected months are missing        -> "<Subject> data exists for 5 of 6 selected months."          (warning)
 *   3. A selected month is month-to-date       -> "Oct 2026 is month-to-date (data up to 29 Oct), so its totals
 *                                                  are incomplete."                                            (warning)
 *   4. No stored data in the previous window   -> "There is no <subject> data for the previous period (...), so the
 *                                                  changes are not shown."                                      (info)
 *   5. Previous window is missing months       -> "The previous period has data for 4 of 6 months, so the changes
 *                                                  are not like-for-like."                                      (warning)
 * The result also says whether the window has data (hasCurrentData / hasPreviousData). When hasPreviousData is false the
 * page should HIDE the percent-change badges: the API reports +100% against an empty previous period, which would be
 * misleading.
 *
 * Self-contained on purpose (no imports from a page), so either page can use it. The structural types below are
 * satisfied by the API types of both pages (KeywordDataDays in flipkart-keywords.service.ts, and the search-terms
 * data_days type once it has the months_in_range / partial_periods fields).
 */

export interface CoveragePartialPeriod {
  start_date: string;
  end_date: string;
}

/** One entry of `data_days` in the summary responses. */
export interface CoverageDays {
  periods_with_data: number;
  months_in_range: number;
  partial_periods: CoveragePartialPeriod[];
}

/** The window dates of the summary response (`period`); only the previous window is used for wording. */
export interface CoveragePeriod {
  previous_start: string;
  previous_end: string;
}

export interface CoverageNotice {
  /** warning = amber box, info = grey box. */
  tone: "warning" | "info";
  message: string;
}

export interface CoverageResult {
  hasCurrentData: boolean;
  hasPreviousData: boolean;
  notices: CoverageNotice[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-29" -> "Oct 2026". Parsed from the string, never through Date, so the timezone cannot shift the day. */
function monthLabel(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "2026-10-29" -> "29 Oct". */
function dayMonthLabel(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

/** "Dec 2025 - May 2026", or a single "Oct 2026". */
function monthRangeLabel(startIso: string, endIso: string): string {
  const start = monthLabel(startIso);
  const end = monthLabel(endIso);
  return start === end ? start : `${start} - ${end}`;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Build the coverage notices for a summary response.
 *
 * @param current   data_days.current_period
 * @param previous  data_days.previous_period
 * @param period    the response's `period` (for the previous window's month range in the wording)
 * @param subject   what the data is called in the sentences: "keyword" (default) or "search-term"
 */
export function buildCoverageNotices(
  current: CoverageDays,
  previous: CoverageDays,
  period: CoveragePeriod,
  subject: string = "keyword",
): CoverageResult {
  const hasCurrentData = current.periods_with_data > 0;
  const hasPreviousData = previous.periods_with_data > 0;
  const notices: CoverageNotice[] = [];

  if (!hasCurrentData) {
    notices.push({ tone: "warning", message: `No ${subject} data is stored for the selected months yet.` });
    return { hasCurrentData, hasPreviousData, notices };
  }

  if (current.months_in_range > 0 && current.periods_with_data < current.months_in_range) {
    notices.push({
      tone: "warning",
      message: `${capitalise(subject)} data exists for ${current.periods_with_data} of ${plural(
        current.months_in_range,
        "selected month",
      )}.`,
    });
  }

  for (const partial of current.partial_periods ?? []) {
    notices.push({
      tone: "warning",
      message: `${monthLabel(partial.start_date)} is month-to-date (data up to ${dayMonthLabel(
        partial.end_date,
      )}), so its totals are incomplete.`,
    });
  }

  if (!hasPreviousData) {
    notices.push({
      tone: "info",
      message: `There is no ${subject} data for the previous period (${monthRangeLabel(
        period.previous_start,
        period.previous_end,
      )}), so the changes are not shown.`,
    });
  } else if (previous.months_in_range > 0 && previous.periods_with_data < previous.months_in_range) {
    notices.push({
      tone: "warning",
      message: `The previous period has data for ${previous.periods_with_data} of ${plural(
        previous.months_in_range,
        "month",
      )}, so the changes are not like-for-like.`,
    });
  }

  return { hasCurrentData, hasPreviousData, notices };
}
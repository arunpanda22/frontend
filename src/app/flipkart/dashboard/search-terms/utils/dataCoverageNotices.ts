/**
 * Data-coverage notices for the Flipkart Search Terms page.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/utils/dataCoverageNotices.ts
 *
 * WHY THIS EXISTS
 * Search-term data is stored as MONTHLY periods, so "23 of 31 days" style messages are wrong: a month is either
 * stored (complete), stored month-to-date (the current month), or missing. The summary response carries the facts:
 *     data_days.<window>.periods_with_data  stored months inside the window
 *     data_days.<window>.months_in_range    months that SHOULD be there for a month-aligned window
 *     data_days.<window>.partial_periods    stored month-to-date periods [{ start_date, end_date }]
 *     coverage                              search-term spend vs campaign-report spend
 *     truncated                             whether the term cap was hit
 * buildSearchTermsNotices() turns them into plain sentences. FlipkartSearchTermsDataNotice only renders the result,
 * so the wording and the rules live here.
 *
 * RULES (in the order the notices are produced)
 *   1. No stored data in the selected window   -> "No search-term data is stored for the selected months yet."  (warning)
 *   2. Some selected months are missing        -> "Search-term data exists for 5 of 6 selected months."          (warning)
 *   3. A selected month is month-to-date       -> "Oct 2026 is month-to-date (data up to 29 Oct), so its totals
 *                                                  are incomplete."                                            (warning)
 *   4. No stored data in the previous window   -> "There is no search-term data for the previous period (...), so
 *                                                  the changes are not shown."                                  (info)
 *   5. Previous window is missing months       -> "The previous period has data for 4 of 6 months, so the changes
 *                                                  are not like-for-like."                                      (warning)
 *   6. Spend coverage outside 70-130%          -> search-term spend vs campaign-report spend                     (info)
 *   7. Term cap hit                            -> only the highest-spend terms are listed                        (info)
 * Rules 6 and 7 are skipped when rule 1 fires (there is nothing to compare or list).
 * The result also says whether each window has data. When hasPreviousData is false the page should HIDE the
 * percent-change badges: the API reports +100% against an empty previous window, which would be misleading.
 *
 * Self-contained on purpose: the only import is a type from the Search Terms service, so this page does not depend on
 * any Keywords code.
 */
import type { FlipkartSearchTermsSummaryResponse } from "@/lib/api/services/flipkart-search-terms.service";

/** Search-term spend outside this band (percent of campaign-report spend) triggers the coverage notice. */
const COVERAGE_LOW = 70;
const COVERAGE_HIGH = 130;

export interface CoverageNotice {
  /** warning = amber box, info = blue box. */
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

/** Build every notice for a Search Terms summary response. See the RULES in the file header. */
export function buildSearchTermsNotices(data: FlipkartSearchTermsSummaryResponse): CoverageResult {
  const current = data.data_days.current_period;
  const previous = data.data_days.previous_period;
  const hasCurrentData = current.periods_with_data > 0;
  const hasPreviousData = previous.periods_with_data > 0;
  const notices: CoverageNotice[] = [];

  // 1
  if (!hasCurrentData) {
    notices.push({ tone: "warning", message: "No search-term data is stored for the selected months yet." });
    return { hasCurrentData, hasPreviousData, notices };
  }

  // 2
  if (current.months_in_range > 0 && current.periods_with_data < current.months_in_range) {
    notices.push({
      tone: "warning",
      message: `Search-term data exists for ${current.periods_with_data} of ${plural(
        current.months_in_range,
        "selected month"
      )}.`,
    });
  }

  // 3
  for (const partial of current.partial_periods ?? []) {
    notices.push({
      tone: "warning",
      message: `${monthLabel(partial.start_date)} is month-to-date (data up to ${dayMonthLabel(
        partial.end_date
      )}), so its totals are incomplete.`,
    });
  }

  // 4 and 5
  if (!hasPreviousData) {
    notices.push({
      tone: "info",
      message: `There is no search-term data for the previous period (${monthRangeLabel(
        data.period.previous_start,
        data.period.previous_end
      )}), so the changes are not shown.`,
    });
  } else if (previous.months_in_range > 0 && previous.periods_with_data < previous.months_in_range) {
    notices.push({
      tone: "warning",
      message: `The previous period has data for ${previous.periods_with_data} of ${plural(
        previous.months_in_range,
        "month"
      )}, so the changes are not like-for-like.`,
    });
  }

  // 6
  const { campaign_report_spend: campaignSpend, search_term_spend: termSpend, spend_coverage_pct: coveragePct } =
    data.coverage;
  if (campaignSpend > 0 && termSpend > 0 && (coveragePct < COVERAGE_LOW || coveragePct > COVERAGE_HIGH)) {
    const window =
      data.coverage.window_start && data.coverage.window_end
        ? ` (${data.coverage.window_start} to ${data.coverage.window_end})`
        : "";
    notices.push({
      tone: "info",
      message: `Search-term spend is ${coveragePct.toFixed(
        0
      )}% of campaign-report spend for the days the search-term data covers${window}. The search-term report may include only some ad products.`,
    });
  }

  // 7
  if (data.truncated) {
    notices.push({
      tone: "info",
      message:
        "There are more distinct search terms than the page can list: only the highest-spend terms are shown. Totals and the baseline ROAS still cover all of them.",
    });
  }

  return { hasCurrentData, hasPreviousData, notices };
}
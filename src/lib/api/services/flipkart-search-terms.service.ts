/**
 * flipkart-search-terms.service.ts
 *
 * API types + service for the Flipkart Search Terms page. One method per backend endpoint
 * (flipkart_dashboard/urls.py, "Search Terms" section). Same conventions as
 * flipkart-dashboard.service.ts (the Campaign Summary page).
 *
 * BACKEND CONTRACT (read before changing anything here)
 *   - Every endpoint takes `start_date` and `end_date` (YYYY-MM-DD, inclusive, required) and an optional
 *     `ads_tenant` (FlipkartAdAccount UUID; omitted = the user's oldest active ad account).
 *   - Metric keys are capitalised exactly as the backend sends them (Impressions, Clicks, Spend, Units,
 *     Revenue, CTR, CPC, CVR, ROAS, ACOS, ASP, CPM). CTR, CVR and ACOS are 0-100; ROAS is a multiplier;
 *     money is rupees. A zero denominator gives 0, never null.
 *   - Search terms are merged case-insensitively by the backend and always arrive lower-cased.
 *   - Units = direct + indirect and Revenue = direct + indirect (Flipkart attribution), same as page 1.
 *
 * CLASSIFICATION (computed by the backend; the UI only displays it)
 *   winner       units > 0 and ROAS >= baseline ROAS (or no spend)
 *   inefficient  units > 0 and ROAS <  baseline ROAS
 *   wasted       no units and clicks >= min_clicks   (negative-keyword candidates)
 *   low_data     no units and clicks <  min_clicks   (too few clicks to judge)
 *   The baseline ROAS is the ROAS of ALL search-term data in scope (whole account, or one campaign when
 *   `campaign_id` is sent). `min_clicks` defaults to 10 on the backend.
 *
 * DATA-QUALITY FIELDS the UI should surface
 *   - summary.data_days: days of search-term data per period. When days_with_data is much lower than
 *     days_in_range (or the two periods differ a lot) the percent changes are NOT like-for-like.
 *   - summary.coverage: search-term spend vs campaign-report spend. Only meaningful when both reports
 *     have data for the same days.
 *   - summary.truncated / table.truncated: the backend caps the number of distinct terms (highest spend
 *     first); totals and baseline still cover everything.
 *
 * URL PREFIX: shares FLIPKART_DASHBOARD_BASE with the Campaign Summary service ('/api/v1/fk/dashboard').
 */
import { apiClient } from "@/lib/api/config";
import type {
  FlipkartDashboardParams,
  FlipkartMetricKey,
  FlipkartMetrics,
  FlipkartTimelineBucket,
} from "@/lib/api/services/flipkart-dashboard.service";
import { unwrapResponse } from "@/lib/api/services/flipkart-response";

const FLIPKART_DASHBOARD_BASE = "/api/v1/fk/dashboard";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type SearchTermClassification = "winner" | "inefficient" | "wasted" | "low_data";

/** Display order used everywhere (cards, chart, filter). Same order as the backend summary. */
export const SEARCH_TERM_CLASSIFICATIONS: SearchTermClassification[] = [
  "winner",
  "inefficient",
  "wasted",
  "low_data",
];

/** Sort fields accepted by the table endpoint (anything else is a 400). */
export type SearchTermSortField =
  | "search_term"
  | "impressions"
  | "clicks"
  | "spend"
  | "units"
  | "revenue"
  | "ctr"
  | "cpc"
  | "cvr"
  | "roas"
  | "acos"
  | "spend_share";

export type SortOrder = "asc" | "desc";

/** One search term with its metrics. Same row shape in the table and in the top-terms lists. */
export interface FlipkartSearchTermRow extends FlipkartMetrics {
  /** Lower-cased, trimmed text (case variants are merged by the backend). */
  search_term: string;
  /** Number of campaigns that served this term in the range. */
  campaign_count: number;
  /** Share of the scope's TOTAL spend, 0-100. */
  spend_share_pct: number;
  classification: SearchTermClassification;
  /**
   * True when the term also appears as an attributed keyword in the range. It means "already earned
   * keyword-attributed traffic", NOT "is currently a configured keyword" (Flipkart has no such table).
   */
  already_targeted: boolean;
}

// ---------------------------------------------------------------------------
// Request params
// ---------------------------------------------------------------------------

/** Params of the summary endpoint. */
export interface FlipkartSearchTermsParams extends FlipkartDashboardParams {
  /** Restrict to one campaign (the baseline ROAS then becomes that campaign's ROAS). */
  campaign_id?: string;
  /** Click threshold between "wasted" and "low_data". Backend default 10, allowed 0-100000. */
  min_clicks?: number;
}

export interface FlipkartSearchTermsTableParams extends FlipkartSearchTermsParams {
  /** Case-insensitive substring of the term (max 100 chars). */
  search?: string;
  classification?: SearchTermClassification;
  sort?: SearchTermSortField; // backend default "spend"
  order?: SortOrder; // backend default "desc"
  page?: number; // 1-based, backend default 1
  page_size?: number; // 1-200, backend default 25
}

export interface FlipkartSearchTermsTopParams extends FlipkartSearchTermsParams {
  limit?: number; // 1-50, backend default 10
}

export interface FlipkartSearchTermDetailParams extends FlipkartDashboardParams {
  /** The term to inspect (matched case-insensitively on its trimmed text). Required. */
  term: string;
}

// ---------------------------------------------------------------------------
// GET /search-terms/summary/
// ---------------------------------------------------------------------------

export interface FlipkartClassificationSummaryItem {
  classification: SearchTermClassification;
  terms: number;
  Spend: number;
  Revenue: number;
  Units: number;
  /** Share of the scope's total spend, 0-100. */
  spend_share_pct: number;
}

export interface FlipkartDataDays {
  /** Distinct days that have search-term data inside the period. */
  days_with_data: number;
  /** Calendar days in the period. */
  days_in_range: number;
  /** ISO dates of the first / last day that has data, or null when there is none. */
  first_date: string | null;
  last_date: string | null;
}

export interface FlipkartSearchTermsSummaryResponse {
  period: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
  };
  filters: { campaign_id: string | null; min_clicks: number };
  /** Totals of the SEARCH-TERM data (not the campaign report). */
  current_period: FlipkartMetrics;
  previous_period: FlipkartMetrics;
  /** Percent change per metric. 100 is sent when the previous value was 0 and the current is above 0. */
  changes: Record<FlipkartMetricKey, number>;
  baseline_roas: number;
  /** Distinct terms found in the current period. */
  total_terms: number;
  truncated: boolean;
  /** Always four entries, in SEARCH_TERM_CLASSIFICATIONS order (zeros when a class is empty). */
  classification_summary: FlipkartClassificationSummaryItem[];
  /** Spend on terms classified "wasted". */
  wasted_spend: number;
  coverage: {
    campaign_report_spend: number;
    search_term_spend: number;
    /** search_term_spend / campaign_report_spend * 100; 0 when the campaign report has no spend. */
    spend_coverage_pct: number;
  };
  data_days: {
    current_period: FlipkartDataDays;
    previous_period: FlipkartDataDays;
  };
}

// ---------------------------------------------------------------------------
// GET /search-terms/  (server-paginated table)
// ---------------------------------------------------------------------------

export interface FlipkartSearchTermsTableResponse {
  period: { start: string; end: string };
  filters: {
    campaign_id: string | null;
    min_clicks: number;
    search: string | null;
    classification: SearchTermClassification | null;
    sort: SearchTermSortField;
    order: SortOrder;
  };
  baseline_roas: number;
  truncated: boolean;
  pagination: {
    page: number;
    page_size: number;
    /** Rows AFTER the search / classification filters. */
    total_rows: number;
    total_pages: number;
  };
  search_terms: FlipkartSearchTermRow[];
}

// ---------------------------------------------------------------------------
// GET /search-terms/top/
// ---------------------------------------------------------------------------

export interface FlipkartSearchTermsTopResponse {
  period: { start: string; end: string };
  filters: { campaign_id: string | null; min_clicks: number; limit: number };
  /** Highest revenue first (only terms with revenue > 0). */
  top_by_revenue: FlipkartSearchTermRow[];
  /** "wasted" terms, highest spend first: the clearest negative-keyword candidates. */
  top_wasted: FlipkartSearchTermRow[];
}

// ---------------------------------------------------------------------------
// GET /search-terms/detail/  (detail modal)
// ---------------------------------------------------------------------------

/** The term's metrics in one campaign. campaign_name falls back to the campaign id; status / type may be "UNKNOWN". */
export interface FlipkartSearchTermCampaignRow extends FlipkartMetrics {
  campaign_id: string;
  campaign_name: string;
  status: string;
  campaign_type: string;
}

export interface FlipkartSearchTermDetailResponse {
  period: { start: string; end: string };
  /** The normalised (trimmed, lower-cased) term that was looked up. */
  search_term: string;
  /** False when the term has no rows in the range (everything else is then zero / empty). */
  found: boolean;
  already_targeted: boolean;
  totals: FlipkartMetrics;
  /** Highest spend first. */
  campaigns: FlipkartSearchTermCampaignRow[];
  /** One zero-filled bucket per calendar day in the range, oldest first (same shape as page 1's timeline). */
  timeline: FlipkartTimelineBucket[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const flipkartSearchTermsService = {
  async getSummary(params: FlipkartSearchTermsParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/search-terms/summary/`, { params });
    return unwrapResponse<FlipkartSearchTermsSummaryResponse>(
      res.data,
      ["current_period", "previous_period", "changes", "classification_summary", "coverage", "data_days"],
      "search-terms/summary"
    );
  },

  async getTable(params: FlipkartSearchTermsTableParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/search-terms/`, { params });
    return unwrapResponse<FlipkartSearchTermsTableResponse>(
      res.data,
      ["search_terms", "pagination"],
      "search-terms"
    );
  },

  async getTop(params: FlipkartSearchTermsTopParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/search-terms/top/`, { params });
    return unwrapResponse<FlipkartSearchTermsTopResponse>(
      res.data,
      ["top_by_revenue", "top_wasted"],
      "search-terms/top"
    );
  },

  async getDetail(params: FlipkartSearchTermDetailParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/search-terms/detail/`, { params });
    return unwrapResponse<FlipkartSearchTermDetailResponse>(
      res.data,
      ["totals", "campaigns", "timeline"],
      "search-terms/detail"
    );
  },
};
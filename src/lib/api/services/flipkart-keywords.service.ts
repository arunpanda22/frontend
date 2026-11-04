/**
 * Flipkart Keywords API service + response types.
 *
 * Place at: src/lib/api/services/flipkart-keywords.service.ts
 *
 * One function per backend endpoint (flipkart_dashboard/urls.py, "Keywords page"). The response types mirror
 * the docstrings of the backend services in flipkart_dashboard/services/keyword_*.py; when a backend shape
 * changes, change it here too.
 *
 * KEY FACTS FOR WHOEVER EDITS THIS (human or AI agent)
 *   - Keyword data is stored as MONTHLY periods. The backend counts only WHOLE months that lie inside
 *     start_date..end_date, so the page always sends the 1st of the first month and the last day of the last month
 *     (see ../../../app/flipkart/dashboard/keywords/utils/keywordDates.ts).
 *   - Flipkart has no "market" data. The comparison partner is the BASELINE: the account's CTR / CVR / ROAS over all
 *     keyword data in the range (the stand-in for the Amazon "vs market" values).
 *   - CTR and CVR are on the 0-100 scale, ROAS is a plain multiplier, money is in rupees.
 *   - `ads_tenant` is the FlipkartAdAccount UUID; leave it undefined to use the user's oldest active ad account.
 */
import { apiClient } from "@/lib/api/config";

const BASE_URL = "/api/v1/fk/dashboard/keywords";

// ---------------------------------------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------------------------------------

/** Raw totals + derived metrics, the shape used across the Flipkart dashboard. */
export interface KeywordMetrics {
  Impressions: number;
  Clicks: number;
  Spend: number;
  Units: number;
  Revenue: number;
  CTR: number;
  CPC: number;
  CVR: number;
  ROAS: number;
  ACOS: number;
  ASP: number;
  CPM: number;
}

/** The account (or campaign) ratios a row is compared against. */
export interface KeywordBaseline {
  CTR: number;
  CVR: number;
  ROAS: number;
}

export interface KeywordFunnel {
  Impressions: number;
  Clicks: number;
  Units: number;
  CTR: number;
  CVR: number;
  /** Units / Impressions * 100. */
  overall_cvr: number;
}

export type KeywordClassification = "winner" | "inefficient" | "wasted" | "low_data";

export type SortOrder = "asc" | "desc";

/** Query params every Keywords endpoint takes. */
export interface KeywordBaseParams {
  /** YYYY-MM-DD, the 1st of the first month. */
  start_date: string;
  /** YYYY-MM-DD, the last day of the last month. */
  end_date: string;
  /** FlipkartAdAccount UUID; undefined = the user's oldest active ad account. */
  ads_tenant?: string;
}

// ---------------------------------------------------------------------------------------------------------
// keywords/summary/
// ---------------------------------------------------------------------------------------------------------

export interface KeywordDataDays {
  /** Days covered by the stored monthly periods inside the window (capped at days_in_range). */
  days_with_data: number;
  days_in_range: number;
  periods_with_data: number;
  first_date: string | null;
  last_date: string | null;
}

export interface KeywordSummaryResponse {
  period: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
  };
  current_period: KeywordMetrics;
  previous_period: KeywordMetrics;
  /** Percent change per metric, current vs previous (100 when previous is 0 and current > 0). */
  changes: KeywordMetrics;
  funnel: KeywordFunnel;
  campaign_count: number;
  keyword_count: number;
  coverage: {
    campaign_report_spend: number;
    keyword_spend: number;
    spend_coverage_pct: number;
    window_start: string | null;
    window_end: string | null;
  };
  data_days: {
    current_period: KeywordDataDays;
    previous_period: KeywordDataDays;
  };
}

// ---------------------------------------------------------------------------------------------------------
// keywords/trend/
// ---------------------------------------------------------------------------------------------------------

/** One calendar month, zero-filled when there is no data. */
export interface KeywordTrendPoint extends KeywordMetrics {
  /** ISO first day of the month (sortable x value). */
  date: string;
  /** Display label, e.g. "Oct 26". */
  label: string;
  /** ISO last day of the stored period (earlier than month end for the current, month-to-date month). */
  period_end: string;
}

export interface KeywordTrendResponse {
  period: { start: string; end: string };
  timeline: KeywordTrendPoint[];
}

// ---------------------------------------------------------------------------------------------------------
// keywords/campaigns/
// ---------------------------------------------------------------------------------------------------------

export type KeywordCampaignSort =
  | "campaign_name"
  | "keywords"
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

export interface KeywordCampaignsParams extends KeywordBaseParams {
  search?: string;
  sort?: KeywordCampaignSort;
  order?: SortOrder;
}

/** One card header. */
export interface KeywordCampaignRow extends KeywordMetrics {
  campaign_id: string;
  campaign_name: string;
  /** LIVE, PAUSED, ABORTED, ... or "UNKNOWN". */
  status: string;
  campaign_type: string;
  keyword_count: number;
  /** Share of the ACCOUNT's keyword spend, percent. */
  spend_share_pct: number;
  /** Campaign minus baseline: CTR / CVR in percentage points, ROAS in multiplier points. */
  ctr_vs_baseline: number;
  cvr_vs_baseline: number;
  roas_vs_baseline: number;
  ctr_beats_baseline: boolean;
  cvr_beats_baseline: boolean;
  roas_beats_baseline: boolean;
}

export interface KeywordCampaignsResponse {
  period: { start: string; end: string };
  filters: { search: string | null; sort: KeywordCampaignSort; order: SortOrder };
  baseline: KeywordBaseline;
  total_campaigns: number;
  campaigns: KeywordCampaignRow[];
}

// ---------------------------------------------------------------------------------------------------------
// keywords/campaign-detail/
// ---------------------------------------------------------------------------------------------------------

export interface KeywordCampaignDetailParams extends KeywordBaseParams {
  campaign_id: string;
  min_clicks?: number;
}

/** One month of a campaign, with the account's ratios as baseline_<metric> for "campaign vs baseline" charts. */
export interface KeywordCampaignTimelinePoint extends KeywordTrendPoint {
  baseline_CTR: number;
  baseline_CPC: number;
  baseline_CVR: number;
  baseline_ROAS: number;
  baseline_ACOS: number;
  baseline_CPM: number;
}

export interface KeywordClassificationSummaryItem {
  classification: KeywordClassification;
  /** Number of keyword rows in this classification. */
  terms: number;
  Spend: number;
  Revenue: number;
  Units: number;
  spend_share_pct: number;
}

export interface KeywordCampaignDetailResponse {
  period: { start: string; end: string };
  filters: { campaign_id: string; min_clicks: number };
  /** false when the campaign has no keyword rows in the range. */
  found: boolean;
  campaign: {
    campaign_id: string;
    campaign_name: string;
    status: string;
    campaign_type: string;
  };
  totals: KeywordMetrics;
  baseline: KeywordBaseline;
  funnel: KeywordFunnel;
  keyword_count: number;
  classification_summary: KeywordClassificationSummaryItem[];
  truncated: boolean;
  timeline: KeywordCampaignTimelinePoint[];
}

// ---------------------------------------------------------------------------------------------------------
// keywords/table/
// ---------------------------------------------------------------------------------------------------------

export type KeywordTableSort =
  | "keyword"
  | "match_type"
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

export interface KeywordTableParams extends KeywordBaseParams {
  campaign_id?: string;
  min_clicks?: number;
  search?: string;
  match_type?: string;
  classification?: KeywordClassification;
  sort?: KeywordTableSort;
  order?: SortOrder;
  page?: number;
  page_size?: number;
}

export interface KeywordRow extends KeywordMetrics {
  /** Lower-cased keyword; "" for the "not attributed to a keyword" row. */
  keyword: string;
  /** Upper-cased match type (EXACT, PHRASE, ...) or "". */
  match_type: string;
  is_unattributed: boolean;
  campaign_count: number;
  spend_share_pct: number;
  ctr_beats_baseline: boolean;
  cvr_beats_baseline: boolean;
  roas_beats_baseline: boolean;
  classification: KeywordClassification;
}

export interface KeywordTableResponse {
  period: { start: string; end: string };
  filters: {
    campaign_id: string | null;
    min_clicks: number;
    search: string | null;
    match_type: string | null;
    classification: KeywordClassification | null;
    sort: KeywordTableSort;
    order: SortOrder;
  };
  baseline: KeywordBaseline;
  truncated: boolean;
  pagination: {
    page: number;
    page_size: number;
    total_rows: number;
    total_pages: number;
  };
  keywords: KeywordRow[];
}

// ---------------------------------------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------------------------------------

export const flipkartKeywordsService = {
  async getSummary(params: KeywordBaseParams): Promise<KeywordSummaryResponse> {
    const res = await apiClient.get<KeywordSummaryResponse>(`${BASE_URL}/summary/`, { params });
    return res.data;
  },

  async getTrend(params: KeywordBaseParams): Promise<KeywordTrendResponse> {
    const res = await apiClient.get<KeywordTrendResponse>(`${BASE_URL}/trend/`, { params });
    return res.data;
  },

  async getCampaigns(params: KeywordCampaignsParams): Promise<KeywordCampaignsResponse> {
    const res = await apiClient.get<KeywordCampaignsResponse>(`${BASE_URL}/campaigns/`, { params });
    return res.data;
  },

  async getCampaignDetail(params: KeywordCampaignDetailParams): Promise<KeywordCampaignDetailResponse> {
    const res = await apiClient.get<KeywordCampaignDetailResponse>(`${BASE_URL}/campaign-detail/`, { params });
    return res.data;
  },

  async getTable(params: KeywordTableParams): Promise<KeywordTableResponse> {
    const res = await apiClient.get<KeywordTableResponse>(`${BASE_URL}/table/`, { params });
    return res.data;
  },
};
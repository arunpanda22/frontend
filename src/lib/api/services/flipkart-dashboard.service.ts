/**
 * flipkart-dashboard.service.ts
 *
 * API types + service for the Flipkart Campaign Summary page. One method per backend endpoint
 * (flipkart_dashboard/urls.py), same style as dashboard.service.ts (Amazon).
 *
 * BACKEND CONTRACT (read before changing anything here)
 *   - Every endpoint takes `start_date` and `end_date` (YYYY-MM-DD, both inclusive, required)
 *     and an optional `ads_tenant` (FlipkartAdAccount UUID). When `ads_tenant` is omitted the
 *     backend uses the user's oldest active ad account.
 *   - There is NO focus_level and NO `period` string: Flipkart data is ads-only and driven only
 *     by the date range.
 *   - The backend sends plain JSON, but some Amazon endpoints arrive wrapped (`{ json: ... }`), so every
 *     method below runs the response through unwrapResponse(): it accepts the plain shape, a `json` or
 *     `data` wrapper, and otherwise THROWS an error that names the keys it actually received (React Query
 *     then reports isError instead of a component crashing on `undefined`).
 *   - Metric key names are capitalised exactly as the backend sends them: Impressions, Clicks,
 *     Spend, Units, Revenue (raw sums) and CTR, CPC, CVR, ROAS, ACOS, ASP, CPM (derived).
 *     CTR, CVR and ACOS are on the 0-100 scale; ROAS is a plain multiplier. Money is rupees.
 *   - A zero denominator gives 0 (never null) for derived metrics.
 *
 * URL PREFIX: FLIPKART_DASHBOARD_BASE assumes the project-level urls.py includes
 * `flipkart_dashboard.urls` under 'api/v1/fk/dashboard/'. Change the constant if it differs.
 */
import { apiClient } from "@/lib/api/config";

const FLIPKART_DASHBOARD_BASE = "/api/v1/fk/dashboard";

// ---------------------------------------------------------------------------
// Request params
// ---------------------------------------------------------------------------

/** Query params shared by every Flipkart dashboard endpoint. */
export interface FlipkartDashboardParams {
  start_date: string; // YYYY-MM-DD, inclusive
  end_date: string; // YYYY-MM-DD, inclusive
  /** FlipkartAdAccount UUID. Omit to let the backend pick the user's oldest active ad account. */
  ads_tenant?: string;
}

// ---------------------------------------------------------------------------
// Shared metric shapes
// ---------------------------------------------------------------------------

/** Raw sums stored/aggregated from CampaignReport. */
export interface FlipkartRawMetrics {
  Impressions: number;
  Clicks: number;
  Spend: number;
  Units: number;
  Revenue: number;
}

/** Raw sums plus the ratios computed by derived_metrics.py. */
export interface FlipkartMetrics extends FlipkartRawMetrics {
  CTR: number; // percent, 0-100
  CPC: number; // rupees per click
  CVR: number; // percent, 0-100 (units / clicks)
  ROAS: number; // revenue per rupee spent (multiplier)
  ACOS: number; // percent, 0-100 (spend / revenue)
  ASP: number; // rupees per unit
  CPM: number; // rupees per 1000 impressions
}

/** Every metric key, in the order the KPI cards are shown. Use it to loop safely. */
export type FlipkartMetricKey = keyof FlipkartMetrics;

// ---------------------------------------------------------------------------
// GET /campaign-metrics/  (KPI cards)
// ---------------------------------------------------------------------------

export interface FlipkartCampaignMetricsResponse {
  period: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
  };
  current_period: FlipkartMetrics;
  previous_period: FlipkartMetrics;
  /**
   * Percent change per metric, current vs previous. If the previous value is 0 and the current
   * is above 0 the backend sends 100 (Amazon convention). For Spend, CPC, ACOS and CPM a rise is
   * usually bad: the UI decides the colour.
   */
  changes: Record<FlipkartMetricKey, number>;
}

// ---------------------------------------------------------------------------
// GET /timeline/  (daily metrics chart)
// ---------------------------------------------------------------------------

/** One calendar day. Days without data are zero-filled by the backend, so the x axis has no gaps. */
export interface FlipkartTimelineBucket extends FlipkartMetrics {
  date: string; // ISO YYYY-MM-DD, sortable, use as the x value
  label: string; // display text, e.g. "21 Oct 26"
}

export interface FlipkartTimelineResponse {
  period: { start: string; end: string };
  timeline: FlipkartTimelineBucket[]; // oldest first
}

// ---------------------------------------------------------------------------
// GET /campaign-type-contribution/  (share by campaign type)
// ---------------------------------------------------------------------------

export interface FlipkartCampaignTypeContributionItem {
  /** e.g. "BRAND_PLA". "UNKNOWN" = campaign with no CampaignName row or an empty type. */
  campaign_type: string;
  Spend: number;
  Revenue: number;
  Units: number;
  spend_contribution_pct: number; // 0-100
  revenue_contribution_pct: number; // 0-100
}

export interface FlipkartCampaignTypeContributionResponse {
  period: { start: string; end: string };
  campaign_type_contribution: FlipkartCampaignTypeContributionItem[]; // sorted by Revenue desc
}

// ---------------------------------------------------------------------------
// GET /campaigns/  (campaigns table)
// ---------------------------------------------------------------------------

export interface FlipkartCampaignRow extends FlipkartMetrics {
  campaign_id: string;
  /** Falls back to campaign_id when the campaign has no CampaignName row. */
  campaign_name: string;
  /** Flipkart status as returned (LIVE, PAUSED, ...) or "UNKNOWN" when there is no CampaignName row. */
  status: string;
  /** e.g. "BRAND_PLA", or "UNKNOWN". */
  campaign_type: string;
}

export interface FlipkartCampaignsResponse {
  period: { start: string; end: string };
  campaigns: FlipkartCampaignRow[]; // sorted by Impressions desc
}

// ---------------------------------------------------------------------------
// GET /campaign-placements/  (campaign x placement table)
// ---------------------------------------------------------------------------

export interface FlipkartCampaignPlacementRow extends FlipkartMetrics {
  campaign_id: string;
  campaign_name: string;
  status: string;
  campaign_type: string;
  /** e.g. "Top of Search Listings Page", "Product Page", "Home Page". */
  placement_type: string;
}

export interface FlipkartCampaignPlacementsResponse {
  period: { start: string; end: string };
  /** Rows of one campaign are contiguous (campaigns ordered by total Spend desc), so you can group by campaign_id. */
  placements: FlipkartCampaignPlacementRow[];
}

// ---------------------------------------------------------------------------
// Response unwrapping
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Returns the object that contains ALL of `requiredKeys`, looking at the payload itself and at the common
 * wrappers (`json`, `data`, `data.json`). Throws a descriptive Error when none matches, so a wrong
 * response shape is reported as a query error with the received keys instead of crashing a component.
 *
 * Pass every top-level key the UI dereferences. Example: the KPI cards read `changes` as well as
 * `current_period`, so a backend that has not been updated to send `changes` is reported here
 * ("missing key changes") instead of crashing the cards.
 */
function unwrapResponse<T>(payload: unknown, requiredKeys: string[], endpoint: string): T {
  const candidates: unknown[] = [payload];
  if (isRecord(payload)) {
    candidates.push(payload.json, payload.data);
    if (isRecord(payload.data)) candidates.push(payload.data.json);
  }

  for (const candidate of candidates) {
    if (isRecord(candidate) && requiredKeys.every((key) => candidate[key] != null)) {
      return candidate as T;
    }
  }

  // Describe the best candidate (the one with the most required keys) so the message says what is missing.
  const best = candidates.filter(isRecord).sort(
    (a, b) => requiredKeys.filter((k) => b[k] != null).length - requiredKeys.filter((k) => a[k] != null).length
  )[0];
  const received = best ? `[${Object.keys(best).join(", ")}]` : typeof payload;
  const missing = best ? requiredKeys.filter((k) => best[k] == null) : requiredKeys;
  console.error(`Unexpected response from ${endpoint}`, payload);
  throw new Error(
    `Unexpected response from ${endpoint}: missing key(s) ${missing.join(", ")}; received keys ${received}`
  );
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const flipkartDashboardService = {
  async getCampaignMetrics(params: FlipkartDashboardParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/campaign-metrics/`, { params });
    return unwrapResponse<FlipkartCampaignMetricsResponse>(
      res.data,
      ["current_period", "previous_period", "changes"],
      "campaign-metrics"
    );
  },

  async getTimeline(params: FlipkartDashboardParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/timeline/`, { params });
    return unwrapResponse<FlipkartTimelineResponse>(res.data, ["timeline"], "timeline");
  },

  async getCampaignTypeContribution(params: FlipkartDashboardParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/campaign-type-contribution/`, { params });
    return unwrapResponse<FlipkartCampaignTypeContributionResponse>(
      res.data,
      ["campaign_type_contribution"],
      "campaign-type-contribution"
    );
  },

  async getCampaigns(params: FlipkartDashboardParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/campaigns/`, { params });
    return unwrapResponse<FlipkartCampaignsResponse>(res.data, ["campaigns"], "campaigns");
  },

  async getCampaignPlacements(params: FlipkartDashboardParams) {
    const res = await apiClient.get<unknown>(`${FLIPKART_DASHBOARD_BASE}/campaign-placements/`, { params });
    return unwrapResponse<FlipkartCampaignPlacementsResponse>(res.data, ["placements"], "campaign-placements");
  },
};
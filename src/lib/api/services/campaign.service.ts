// services/campaign.service.ts

import { apiClient } from "../config";

// ============================================================================
// TYPES
// ============================================================================



// Campaign X-Ray Types (unchanged)
export interface XrayDataItem {
  time_group: string;
  "Total Sales": number;
  "Total Quantity": number;
  "Sales ASP": number;
  impressions: number;
  clicks: number;
  "CTR%": number;
  CPC: number;
  cost: number;
  "CVR%": number;
  "ACOS%": number;
  CPA: number;
  sales_30d: number;
  purchases_30d: number;
}

export interface XrayDataResponse {
  xray_data: XrayDataItem[];
  available_campaigns: string[];
  selected_campaigns: string[];
}

export interface XrayDataOptions {
  campaign_names?: string[];
  focus_level?: "high" | "medium" | "low" | "all";
}

// UPDATED: Hierarchical Keyword Performance Types
/**
 * Source type for keyword targeting data
 * - sp_keyword: Sponsored Product Keyword
 * - sp_expression: Sponsored Product Expression (auto/product targeting)
 * - sb: Sponsored Brand
 */
export type KeywordSource = "sp_keyword" | "sp_expression" | "sb";

/**
 * Cost type for Sponsored Brand campaigns
 * Only present for SB (source='sb'), null for SP
 */
export type CostType = "CPC" | "CPM" | "vCPM" | null;

export interface KeywordMetrics {
  [key: string]: any;
  // Identifiers
  id: string;
  type: "keyword";
  name: string;
  keyword: string;
  keyword_id: string;
  keyword_type: string;
  match_type: string;
  targeting_text: string;
  
  // NEW: Source and cost type fields
  source: KeywordSource; // Indicates data source: sp_keyword, sp_expression, or sb
  cost_type: CostType; // Only for SB (CPC, CPM, etc.), null for SP
  
  campaign_name: string;
  campaign_id: string;
  ad_group_name: string;
  ad_group_id: string;

  // Bid information
  keyword_bid: number ;
  is_editable: boolean;
  bid_min: number;
  bid_max: number;

  // Current period metrics (UNIFIED: sales not sales_30d, purchases not purchases_30d)
  impressions: number;
  clicks: number;
  cost: number;
  sales: number; // CHANGED: was sales_30d
  purchases: number; // CHANGED: was purchases_30d
  ctr: number;
  cpc: number;
  acos: number;
  roas: number;
  cvr: number;
  cpa: number;

  // Previous period metrics (for comparison)
  impressions_prev: number;
  clicks_prev: number;
  cost_prev: number;
  sales_prev: number; // CHANGED: was sales_30d_prev
  purchases_prev: number; // CHANGED: was purchases_30d_prev
  ctr_prev: number;
  cpc_prev: number;
  acos_prev: number;
  roas_prev: number;
  cvr_prev: number;
  cpa_prev: number;

  // Last day metric
  last_day_top_of_search_impression_share: number | null;
}

export interface AsinGroupMetrics {
  [key: string]: any;
  // Identifiers
  id: string;
  type: "asin_group";
  asin: string;
  name: string;
  product_name: string | null;
  image_url: string | null;

  // Counts
  campaign_count: number;
  keyword_count: number;

  // Current period metrics (aggregated from all keywords)
  impressions: number;
  clicks: number;
  cost: number;
  sales: number; // CHANGED: was sales_30d
  purchases: number; // CHANGED: was purchases_30d
  ctr: number;
  cpc: number;
  acos: number;
  roas: number;
  cvr: number;
  cpa: number;

  // Previous period metrics
  impressions_prev: number;
  clicks_prev: number;
  cost_prev: number;
  sales_prev: number; // CHANGED: was sales_30d_prev
  purchases_prev: number; // CHANGED: was purchases_30d_prev
  ctr_prev: number;
  cpc_prev: number;
  acos_prev: number;
  roas_prev: number;
  cvr_prev: number;
  cpa_prev: number;

  // Last day metric
  last_day_top_of_search_impression_share: number | null;

  // Not editable at ASIN level
  is_editable: false;
  keyword_bid: null;
  cost_type: null; // Always null for parent rows

  // Children
  _children?: KeywordMetrics[];
}

export interface CampaignGroupMetrics {
  [key: string]: any;
  // Identifiers
  id: string;
  type: "campaign";
  name: string;
  campaign_name: string;
  campaign_id: string;
  product_name: null;
  image_url: null;

  // Count
  keyword_count: number;

  // Current period metrics
  impressions: number;
  clicks: number;
  cost: number;
  sales: number; // CHANGED: was sales_30d
  purchases: number; // CHANGED: was purchases_30d
  ctr: number;
  cpc: number;
  acos: number;
  roas: number;
  cvr: number;
  cpa: number;

  // Previous period metrics
  impressions_prev: number;
  clicks_prev: number;
  cost_prev: number;
  sales_prev: number; // CHANGED: was sales_30d_prev
  purchases_prev: number; // CHANGED: was purchases_30d_prev
  ctr_prev: number;
  cpc_prev: number;
  acos_prev: number;
  roas_prev: number;
  cvr_prev: number;
  cpa_prev: number;

  // Last day metric
  last_day_top_of_search_impression_share: number | null;

  // Average bid (not editable at campaign level)
  keyword_bid: number | null;
  is_editable: false;
  cost_type: null; // Always null for parent rows

  // Children
  _children?: KeywordMetrics[];
}

export type HierarchicalRow = AsinGroupMetrics | CampaignGroupMetrics;

export interface KeywordPerformanceHierarchicalResponse {
  data: HierarchicalRow[];
  period_info: {
    current_start: string;
    current_end: string;
    comparison_start: string;
    comparison_end: string;
    period_days: number;
  };
  summary: {
    total_groups: number;
    total_spend: number;
    total_sales: number;
    total_keywords: number;
  };
}

export interface KeywordPerformanceOptions {
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
  comparison_start_date?: string;
  comparison_end_date?: string;
}

// Keyword Bid Update Types
export interface KeywordBidUpdate {
  keyword_id: string;
  campaign_id: string;
  ad_group_id: string;
  match_type: string;
  "New bid": number;
}

export interface KeywordBidPushPayload {
  data: KeywordBidUpdate[];
  dryrun?: boolean;
}

export interface KeywordBidPushResponse {
  message: string;
  push_results: {
    sp?: {
      push_id: string;
      total_items: number;
      s3_location: { bucket: string; key: string };
      campaign_type: string;
      lambda_response: any;
      dryrun: boolean;
    };
    sb?: {
      push_id: string;
      total_items: number;
      s3_location: { bucket: string; key: string };
      campaign_type: string;
      lambda_response: any;
      dryrun: boolean;
    };
  };
  summary: {
    total_items: number;
    sp_items: number;
    sb_items: number;
    dryrun: boolean;
  };
}

export interface BidChange {
  keyword_id: string;
  keyword: string;
  campaign_id: string;
  ad_group_id: string;
  match_type: string;
  source: KeywordSource; // NEW: Track source type
  oldBid: number;
  newBid: number;
}

// Legacy types (keeping for backward compatibility)
export interface UpdateKeywordBidRequest {
  keyword_id: string;
  new_bid: number;
  campaign_id?: string;
}

export interface UpdateKeywordBidResponse {
  success: boolean;
  keyword_id: string;
  old_bid: number;
  new_bid: number;
  updated_at: string;
  message?: string;
}

// NEW: Helper type guards
export function isKeywordMetrics(row: any): row is KeywordMetrics {
  return row && row.type === "keyword";
}

export function isAsinGroup(row: any): row is AsinGroupMetrics {
  return row && row.type === "asin_group";
}

export function isCampaignGroup(row: any): row is CampaignGroupMetrics {
  return row && row.type === "campaign";
}

export function isSponsoredBrand(keyword: KeywordMetrics): boolean {
  return keyword.source === "sb";
}

export function isSponsoredProduct(keyword: KeywordMetrics): boolean {
  return keyword.source === "sp_keyword" || keyword.source === "sp_expression";
}

// NEW: Source display helpers
export const SOURCE_LABELS: Record<KeywordSource, string> = {
  sp_keyword: "SP Keyword",
  sp_expression: "SP Expression",
  sb: "Sponsored Brand",
};

export const SOURCE_COLORS: Record<KeywordSource, string> = {
  sp_keyword: "bg-blue-100 text-blue-800 border-blue-300",
  sp_expression: "bg-purple-100 text-purple-800 border-purple-300",
  sb: "bg-green-100 text-green-800 border-green-300",
};

export function getSourceLabel(source: KeywordSource): string {
  return SOURCE_LABELS[source] || source;
}

export function getSourceColor(source: KeywordSource): string {
  return SOURCE_COLORS[source] || "bg-gray-100 text-gray-800 border-gray-300";
}

// ============================================================================
// SERVICE
// ============================================================================

export const campaignService = {
  /**
   * Get campaign X-ray data
   * Provides detailed metrics for selected campaigns
   * Uses POST to handle large campaign lists
   */
  async getXrayData(options: XrayDataOptions) {
    console.log("Fetching campaign xray data with options:", options);

    const payload: Record<string, any> = {
      focus_level: options.focus_level || "all",
    };

    // Send campaign names as array in request body (handles large lists)
    if (options.campaign_names && options.campaign_names.length > 0) {
      payload.campaigns = options.campaign_names;
    }

    console.log("Request payload:", {
      ...payload,
      campaigns: payload.campaigns
        ? `${payload.campaigns.length} campaigns`
        : "all",
    });

    try {
      const res = await apiClient.post<XrayDataResponse>(
        "/api/v1/dashboard-api/xray-data/",
        payload,
      );

      console.log("X-ray data response received:", {
        data_points: res.data.xray_data?.length || 0,
        available_campaigns: res.data.available_campaigns?.length || 0,
        selected_campaigns: res.data.selected_campaigns?.length || 0,
      });

      return res.data;
    } catch (error) {
      console.error("Failed to fetch xray data:", error);
      throw error;
    }
  },

  /**
   * Get hierarchical keyword performance data (ASIN -> Keywords or Campaign -> Keywords)
   * Returns aggregated parent rows with expandable keyword children
   * Includes comparison to previous period
   * NOW INCLUDES: SP (Keyword + Expression) + SB (Sponsored Brand) data
   */
  async getKeywordPerformanceHierarchical(options?: KeywordPerformanceOptions) {
    console.log(
      "Fetching hierarchical keyword performance data with options:",
      options,
    );

    const params: Record<string, string> = {};

    if (options?.start_date) {
      params.start_date = options.start_date;
    }

    if (options?.end_date) {
      params.end_date = options.end_date;
    }

    if (options?.comparison_start_date) {
      params.comparison_start_date = options.comparison_start_date;
    }

    if (options?.comparison_end_date) {
      params.comparison_end_date = options.comparison_end_date;
    }

    console.log("Request params:", params);

    const res = await apiClient.get<KeywordPerformanceHierarchicalResponse>(
      "/api/v1/dashboard-api/campaign-xray-table-data/",
      { params },
    );

    console.log("Hierarchical keyword performance response received:", {
      total_groups: res.data.summary.total_groups,
      total_keywords: res.data.summary.total_keywords,
      period_info: res.data.period_info,
    });

    return res.data;
  },

  /**
   * Push keyword bid updates to S3 and invoke Lambda
   * Supports batch updates and dry-run mode
   */
  async pushKeywordBids(payload: KeywordBidPushPayload) {
    console.log("Pushing keyword bids:", {
      count: payload.data.length,
      dryrun: payload.dryrun || false,
    });

    const res = await apiClient.post<KeywordBidPushResponse>(
      "/api/v1/ads-optimizer/bids-update/",
      payload,
    );

    console.log("Keyword bid push response received:", {
      message: res.data.message,
      sp_items: res.data.summary.sp_items,
      sb_items: res.data.summary.sb_items,
      dryrun: res.data.summary.dryrun,
    });

    return res.data;
  },

  /**
   * Transform BidChange map to API payload format
   * Converts frontend data structure to backend requirements
   * NOW INCLUDES: source field for SP/SB separation
   */
  transformBidChangesToPayload(
    changes: Map<string, BidChange>,
  ): KeywordBidUpdate[] {
    return Array.from(changes.values()).map((change) => ({
      keyword_id: change.keyword_id,
      campaign_id: change.campaign_id,
      ad_group_id: change.ad_group_id,
      match_type: change.match_type,
      "New bid": change.newBid,
      source: change.source, 
    }));
  },
};
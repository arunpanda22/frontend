// services/campaign.service.ts

import { apiClient } from "../config";

// ============================================================================
// TYPES
// ============================================================================

// Campaign Segmentation Types (unchanged)
export interface CampaignSegmentData {
  campaign_name: string;
  condition: string;
  cost: number;
  sales: number;
  impressions: number;
  clicks: number;
  orders: number;
  acos: number;
  ctr: number;
  cpc: number;
  roas: number;
  cost_change_pct: number;
  sales_change_pct: number;
  acos_change_pct: number;
  spend_status: 'increased' | 'decreased' | 'stable';
  sales_status: 'increased' | 'decreased' | 'stable';
  acos_status: 'increased' | 'decreased' | 'stable';
}

export interface CampaignSegmentationSummary {
  total_campaigns_analyzed: number;
  top_80_campaigns: number;
  scalers_count: number;
  efficient_low_scale_count: number;
  inefficient_wasteful_count: number;
  decline_diagnostic_count: number;
}

export interface CampaignSegmentationPeriodInfo {
  current_start: string;
  current_end: string;
  previous_start: string;
  previous_end: string;
}

export interface CampaignSegmentationResponse {
  scalers: CampaignSegmentData[];
  efficient_low_scale: CampaignSegmentData[];
  inefficient_wasteful: CampaignSegmentData[];
  decline_diagnostic: CampaignSegmentData[];
  summary: CampaignSegmentationSummary;
  period_info: CampaignSegmentationPeriodInfo;
}

export interface CampaignSegmentationOptions {
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string;   // Format: YYYY-MM-DD
}

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
  focus_level?: 'high' | 'medium' | 'low' | 'all';
}

// NEW: Hierarchical Keyword Performance Types
export interface KeywordMetrics {
  [key: string]: any; 
  // Identifiers
  id: string;
  type: 'keyword';
  name: string;
  keyword: string;
  keyword_id: string;
  keyword_type: string;
  match_type: string;
  targeting: string;
  source: 'keyword' | 'expression';
  campaign_name: string;
  campaign_id: string;
  ad_group_name: string;
  ad_group_id: string;
  
  // Bid information
  keyword_bid: number;
  is_editable: boolean;
  bid_min: number;
  bid_max: number;
  
  // Current period metrics
  impressions: number;
  clicks: number;
  cost: number;
  sales_30d: number;
  purchases_30d: number;
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
  sales_30d_prev: number;
  purchases_30d_prev: number;
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
  type: 'asin_group';
  asin: string;
  name: string;
  product_name: string;
  image_url: string;
  
  // Counts
  campaign_count: number;
  keyword_count: number;
  
  // Current period metrics (aggregated from all keywords)
  impressions: number;
  clicks: number;
  cost: number;
  sales_30d: number;
  purchases_30d: number;
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
  sales_30d_prev: number;
  purchases_30d_prev: number;
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
  
  // Children
  _children?: KeywordMetrics[];
}

export interface CampaignGroupMetrics {
  [key: string]: any; 
  // Identifiers
  id: string;
  type: 'campaign';
  name: string;
  campaign_name: string;
  campaign_id: string;
  
  // Count
  keyword_count: number;
  
  // Current period metrics
  impressions: number;
  clicks: number;
  cost: number;
  sales_30d: number;
  purchases_30d: number;
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
  sales_30d_prev: number;
  purchases_30d_prev: number;
  ctr_prev: number;
  cpc_prev: number;
  acos_prev: number;
  roas_prev: number;
  cvr_prev: number;
  cpa_prev: number;
  
  // Last day metric
  last_day_top_of_search_impression_share: number | null;
  
  // Average bid (not editable at campaign level)
  keyword_bid: number;
  is_editable: false;
  
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
  end_date?: string;   // Format: YYYY-MM-DD
  comparison_start_date?: string;
  comparison_end_date?: string;
}

export interface UpdateKeywordBidRequest {
  keyword_id: string;
  new_bid: number;
  campaign_id?: string; // Optional for validation
}

export interface UpdateKeywordBidResponse {
  success: boolean;
  keyword_id: string;
  old_bid: number;
  new_bid: number;
  updated_at: string;
  message?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const campaignService = {
  /**
   * Get campaign segmentation data
   * Categorizes campaigns into 4 segments based on performance trends
   */
  async getCampaignSegments(options?: CampaignSegmentationOptions) {
    console.log('Fetching campaign segmentation data with options:', options);

    const params: Record<string, string> = {};

    if (options?.start_date) {
      params.start_date = options.start_date;
    }

    if (options?.end_date) {
      params.end_date = options.end_date;
    }

    console.log('Request params:', params);

    const res = await apiClient.get<CampaignSegmentationResponse>(
      '/api/v1/dashboard-api/campaign-segments/',
      { params }
    );

    console.log('Campaign segmentation response received:', res.data);
    return res.data;
  },

  /**
   * Get campaign X-ray data
   * Provides detailed metrics for selected campaigns
   */
  async getXrayData(options: XrayDataOptions) {
    console.log('Fetching campaign xray data with options:', options);

    const params: Record<string, any> = {
      focus_level: options.focus_level || 'all',
    };

    // Send campaign names as comma-separated string
    if (options.campaign_names && options.campaign_names.length > 0) {
      params.campaigns = options.campaign_names.join(',');
    }

    console.log('Request params:', params);

    const res = await apiClient.get<XrayDataResponse>(
      '/api/v1/dashboard-api/xray-data/',
      { params }
    );

    console.log('X-ray data response received:', res.data);
    return res.data;
  },

  /**
   * Get hierarchical keyword performance data (ASIN -> Keywords or Campaign -> Keywords)
   * Returns aggregated parent rows with expandable keyword children
   * Includes comparison to previous period
   */
  async getKeywordPerformanceHierarchical(options?: KeywordPerformanceOptions) {
    console.log('Fetching hierarchical keyword performance data with options:', options);

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

    console.log('Request params:', params);

    const res = await apiClient.get<KeywordPerformanceHierarchicalResponse>(
      '/api/v1/dashboard-api/campaign-xray-table-data/',
      { params }
    );

    console.log('Hierarchical keyword performance response received:', {
      total_groups: res.data.summary.total_groups,
      total_keywords: res.data.summary.total_keywords,
      period_info: res.data.period_info
    });

    return res.data;
  },

  /**
   * Update keyword bid
   * Sends bid update request to backend (which should call Amazon Ads API)
   */
  async updateKeywordBid(request: UpdateKeywordBidRequest) {
    console.log('Updating keyword bid:', request);

    const res = await apiClient.patch<UpdateKeywordBidResponse>(
      '/api/v1/dashboard-api/keyword-bid/',
      request
    );

    console.log('Keyword bid update response:', res.data);
    return res.data;
  },
};
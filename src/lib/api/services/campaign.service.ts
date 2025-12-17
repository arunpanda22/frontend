// services/campaign.service.ts

import { apiClient } from "../config";

// ============================================================================
// TYPES
// ============================================================================

// Campaign Segmentation Types
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

// Campaign X-Ray Types
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

export interface KeywordPerformanceMetrics {
  // Identifiers
  campaign_name: string;
  campaign_id: string;
  ad_group_name: string;
  ad_group_id: string;
  keyword: string;
  keyword_id: string;
  keyword_type: string;
  match_type: string;
  targeting: string;
  source: 'keyword' | 'expression';
  
  // Metrics - Current Values
  impressions: number;
  clicks: number;
  cost: number;
  ctr: number;
  cpc: number;
  acos: number;
  roas: number;
  cvr: number;
  cpa: number;
  units_sold_clicks_30d: number;
  sales_30d: number;
  purchases_30d: number;
  sales_same_sku_30d: number;
  units_sold_same_sku_30d: number;
  purchases_same_sku_30d: number;
  
  // Metrics - Previous Period Values
  impressions_prev: number | null;
  clicks_prev: number | null;
  cost_prev: number | null;
  ctr_prev: number | null;
  cpc_prev: number | null;
  acos_prev: number | null;
  roas_prev: number | null;
  cvr_prev: number | null;
  cpa_prev: number | null;
  units_sold_clicks_30d_prev: number | null;
  sales_30d_prev: number | null;
  purchases_30d_prev: number | null;
  sales_same_sku_30d_prev: number | null;
  units_sold_same_sku_30d_prev: number | null;
  purchases_same_sku_30d_prev: number | null;
  
  // Change Percentages
  impressions_change_pct: number | null;
  clicks_change_pct: number | null;
  cost_change_pct: number | null;
  ctr_change_pct: number | null;
  cpc_change_pct: number | null;
  acos_change_pct: number | null;
  roas_change_pct: number | null;
  cvr_change_pct: number | null;
  cpa_change_pct: number | null;
  units_sold_clicks_30d_change_pct: number | null;
  sales_30d_change_pct: number | null;
  purchases_30d_change_pct: number | null;
  sales_same_sku_30d_change_pct: number | null;
  units_sold_same_sku_30d_change_pct: number | null;
  purchases_same_sku_30d_change_pct: number | null;
}

export interface KeywordPerformanceResponse {
  keyword_level: {
    data: KeywordPerformanceMetrics[];
    total_records: number;
  };
  period_info: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
    period_days: number;
  };
}

export interface KeywordPerformanceOptions {
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string;   // Format: YYYY-MM-DD
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
   * Get keyword and expression performance metrics
   * Returns keyword-level data with current values, previous values, and change percentages
   */
  async getKeywordPerformance(options?: KeywordPerformanceOptions) {
    console.log('Fetching keyword performance data with options:', options);

    const params: Record<string, string> = {
      level: 'keyword', // Always keyword level
    };

    if (options?.start_date) {
      params.start_date = options.start_date;
    }

    if (options?.end_date) {
      params.end_date = options.end_date;
    }

    console.log('Request params:', params);

    const res = await apiClient.get<KeywordPerformanceResponse>(
      '/api/v1/dashboard-api/keyword-expression-performance/',
      { params }
    );

    console.log('Keyword performance response received:', res.data);
    return res.data;
  },
};

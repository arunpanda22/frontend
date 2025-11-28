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
  sales_1d: number;
  purchases_1d: number;
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
};
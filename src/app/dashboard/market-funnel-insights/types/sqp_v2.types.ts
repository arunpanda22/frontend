// src/app/dashboard/market-funnel-insights/sqp-v2/types/sqp_v2.types.ts
// New V2 types — old sqp.types.ts untouched

export interface SQPFunnel {
  impressions: number;
  clicks: number;
  purchases: number;
}

export interface SQPMonthlyTrendPoint {
  month: string;
  our_ctr: number;
  market_ctr: number;
  our_cvr: number;
  market_cvr: number;
}

export interface SQPSummary {
  avg_our_ctr: number;
  avg_market_ctr: number;
  avg_our_cvr: number;
  avg_market_cvr: number;
  total_impressions: number;
  total_purchases: number;
}

export interface SQPSearchQueryV2 {
  search_query: string;
  asin_impression_count: number;
  total_impression_count: number;
  asin_click_count: number;
  total_click_count: number;
  asin_ctr: number;
  market_ctr: number;
  asin_purchase_count: number;
  total_purchase_count: number;
  asin_cvr: number;
  market_cvr: number;
  ctr_beats_market: boolean;
  cvr_beats_market: boolean;
  keyword_exists: boolean;
}

export interface SQPASINData {
  asin: string;
  product_name: string | null;
  image_url: string | null; 
  avg_our_ctr: number;
  avg_market_ctr: number;
  ctr_vs_market: number;
  avg_our_cvr: number;
  avg_market_cvr: number;
  cvr_vs_market: number;
  funnel: SQPFunnel;
  monthly_trend: SQPMonthlyTrendPoint[];
  search_queries: SQPSearchQueryV2[];
}

export interface SQPASINMeta {
  asin: string;
  product_name: string | null;
  image_url: string | null;
}

export interface SQPDashboardV2Response {
  summary: SQPSummary;
  overall_trend: SQPMonthlyTrendPoint[];
  overall_funnel: SQPFunnel;
  top_asins: SQPASINMeta[];
  asins: SQPASINData[];
  metadata: {
    start_date: string;
    end_date: string;
    selected_asin?: string;
    total_asins: number;
    [key: string]: any;
  };
}

export interface SQPV2RequestParams {
  selected_asin?: string;
}
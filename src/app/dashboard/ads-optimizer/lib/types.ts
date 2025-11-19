/**
 * Request payload for ads optimizer Lambda invocation
 */
export interface AdsOptimizerRequest {
  target_acos_sp: number;
  target_acos_sb: number;
  target_acos_sd: number;
  brand?: number;
  day_parting?:boolean;
  inventory_aware_bidding?:boolean;
  competitor?: number;
  product_target?: number;
  new_launch?: number;
  recent_start?: number;
  mode: 'Sales Optimisation' | 'ACOS Optimisation' | 'Balanced Optimisation';
}

/**
 * Budget optimization item
 */
export interface BudgetOptimization {
  ASIN: string | null;
  campaign_name: string;
  campaign_id: string;
  ACOS: number | null;
  CPC: number | null;
  cost: number;
  clicks: number;
  sales_30d?: number; // SP/SB
  sales?: number;     // SD
  target_acos: number;
  campaign_budget_amount: number;
  "New Budget": number;
  "Budget Change (%)": string;
  Source: string;
  start_date: string;
  dynamic_bidding?: string;  // SP/SB only
}


/**
 * SP/SB Bid optimization item
 */
export interface BidOptimization {
  campaign_id: string;
  ad_group_id?: string;

  // SP keyword_id, SB targeting_id
  keyword_id?: string;
  targeting_id?: string;

  keyword_type?: string;
  match_type?: string;

  keyword?: string; // SP
  keyword_text?: string; // SB
  targeting?: string; // SP
  targeting_expression?: string; // SB

  campaign_name: string;
  ad_group_name?: string;
  campaign_budget_type?: string;
  campaign_status?: string;

  keyword_bid?: number;
  impressions?: number;
  clicks?: number;
  cost?: number;

  sales_1d?: number;
  sales_7d?: number;
  sales_14d?: number;
  sales_30d?: number;
  purchases_1d?: number;
  purchases_7d?: number;
  purchases_14d?: number;
  purchases_30d?: number;
  purchases?: number;
  units_sold?: number;
  units_sold_other_sku_7d?: number;
  units_sold_same_sku_30d?: number;
  units_sold_clicks_30d?: number;
  sales?: number; // SB + SD
  sales_other_sku_7d?: number;
  attributed_sales_same_sku_30d?: number;
  campaign_budget_amount?: number;
  start_date: string;
  target_acos?: number;
  ASIN?: string | null;
  "New bid"?: number;
  ACOS?: number | null;
  CPC?: number | null;
  RPC?: number | null;
  "Bid Change (%)"?: string;
  Source?: string;
  // SD specific
  report_id?: string;
  tenant_id?: string;
  "ideal bid"?: number;
  bid?: number;
  acos?: number;
  cpc?: number;
}


/**
 * Placement optimization item
 */
export interface PlacementOptimization {
  ASIN_Derived?: string;
  campaign_id: string;
  campaign_name: string;

  placement_classification: string;
  impressions: number;
  clicks: number;
  cost: number;
  sales?: number;
  sales_7d?: number;
  sales_14d?: number;
  sales_30d?: number;
  purchases?: number;
  purchases_1d?: number;
  purchases_7d?: number;
  purchases_14d?: number;
  purchases_30d?: number;
  units_sold?: number;
  units_sold_clicks_30d?: number;
  units_sold_same_sku_30d?: number;
  campaign_budget_amount: number;
  campaign_budget_currency_code?: string;
  campaign_budget_type?: string;
  campaign_status?: string;
  report_id?: string;
  tenant_id?: string;
  start_date: string;
  target_acos: number;

  Percentage?: number;
  "Ideal Bid"?: number;

  Source?: string;
}


/**
 * New campaign suggestion
 */
export interface NewCampaignSuggestion {
  ASIN: string;
  "Campaign Name": string;
  "Campaign Type": string;
  State?: string;
  "Campaign Budget": number;
  SKU: string;
  Targeting: string | null;
  match_type: string;
  Form: string | null;
  "Targeting Type": string;
  Bid: number;
  "Default Bid": number;
  "Bidding Strategy": string;
  "Top of Search Amazon": number;
  "Rest of Search Amazon": number;
  "Product Pages Amazon": number;
  "Amazon Business"?: number;
  "Ad Type"?: string;
  Source: string;
}


/**
 * Negative keyword suggestion
 */
export interface NegativeKeywordSuggestion {
  campaign_id: string;
  ad_group_id: string;
  campaign_name: string;
  ad_group_name: string;
  search_term?: string; // SP
  query?: string;       // SB
  Source_Type: string;
}


/**
 * Complete Lambda response structure
 */
export interface AdsOptimizerResponse {
  errors: string[];

  sp_budget: BudgetOptimization[];
  sb_budget: BudgetOptimization[];
  sd_budget: BudgetOptimization[];

  sp_bid: BidOptimization[];
  sb_bid: BidOptimization[];
  sd_bid: BidOptimization[];

  sp_placement: PlacementOptimization[];
  sb_placement: PlacementOptimization[];

  sp_new_campaigns: NewCampaignSuggestion[];
  sb_new_campaigns: NewCampaignSuggestion[];

  sp_negatives: NegativeKeywordSuggestion[];
  sb_negatives: NegativeKeywordSuggestion[];
}


/**
 * Optimization category metadata
 */
export interface OptimizationCategory {
  key: keyof AdsOptimizerResponse;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export type OptimizationKey = Exclude<keyof AdsOptimizerResponse, "errors">;





/**
 * Request payload for ads optimizer Lambda invocation
 */
export interface AdsOptimizerRequest {
  target_acos_sp: number;
  target_acos_sb: number;
  target_acos_sd: number;
  brand?: number;
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
  ASIN: string;
  campaign_name: string;
  campaign_id: string;
  ACOS: number;
  CPC: number;
  cost: number;
  sales_30d: number;
  clicks: number;
  target_acos: number;
  campaign_budget_amount: number;
  'New Budget': number;
  'Budget Change (%)': string;
  Source: string;
  start_date: string;
  dynamic_bidding: string;
}

/**
 * Bid optimization item
 */
export interface BidOptimization {
  ASIN: string;
  campaign_name: string;
  campaign_id: string;
  ad_group_name?: string;
  ad_group_id?: string;
  keyword_text?: string;
  targeting_id?: string;
  current_bid: number;
  recommended_bid: number;
  bid_change: string;
  ACOS: number;
  clicks: number;
  cost: number;
  sales: number;
  [key: string]: any;
}

/**
 * Placement optimization item
 */
export interface PlacementOptimization {
  campaign_name: string;
  campaign_id: string;
  placement_type: string;
  current_adjustment: number;
  recommended_adjustment: number;
  adjustment_change: string;
  impressions: number;
  clicks: number;
  cost: number;
  sales: number;
  ACOS: number;
  [key: string]: any;
}

/**
 * New campaign suggestion
 */
export interface NewCampaignSuggestion {
  ASIN: string;
  "Campaign Name": string;
  "Campaign Type": string;          
  "Campaign Budget": number;
  SKU: string;
  Targeting: string | null;  
  match_type: string;           
  Bid: number;               
  "Default Bid": number;
  "Bidding Strategy": string; // "Fixed"
  "Top of Search Amazon": number;
  "Rest of Search Amazon": number;
  "Product Pages Amazon": number;
  [key: string]: any;       
}

/**
 * Negative keyword suggestion
 */
export interface NegativeKeywordSuggestion {
  campaign_name: string;
  campaign_id: string;
  ad_group_name?: string;
  ad_group_id?: string;
  search_term: string;
  [key: string]: any;
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




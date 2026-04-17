import { apiClient } from "@/lib/api/config";

export interface PlacementData {
  targeting: string;
  impressions: number;
  clicks: number;
  ctr_percentage: number;
  ad_cost: number;
  cost_per_click: number;
  units_sold: number;
  sales: number;
  acos_percentage: number;
  sales_percentage: number;
  cost_percentage: number;
}

export interface InventoryHealthItem {
  asin: string;
  "Product Name": string;
  "Focus category": string;
  
  // FBA metrics (renamed for clarity)
  fba_reserved_quantity: number;
  fba_fulfillable_quantity: number;
  fba_total_inventory: number;
  fba_sales_per_day: number;
  fba_inventory_cover: number;
  
  // Reorder metrics (based on FBA)
  reorder_quantity: number;
  status: string;
  
  // Vendor metrics (optional - only present if user has vendor account)
  vendor_inventory?: number;
  vendor_sales_per_day?: number;
  vendor_inventory_cover?: number;
  
  // Common
  image_url: string;
}

export interface InventoryReplenishmentItem {
  asin: string;
  reorder_quantity: number;
  product_name: string;
  image_url: string;
  fba_total_inventory: number;
  fba_sales_per_day: number;
  fba_inventory_cover: number;

}

export interface InventoryHealthResponse {
  inventory_health: InventoryHealthItem[];
  inventory_replenishment: InventoryReplenishmentItem[];
  metadata: {
    sales_days: number;
    reorder_cover_days: number;
    supply_chain_lead_time: number;
    has_vendor_data: boolean;
    data_sources: {
      fba: boolean;
      vendor: boolean;
    };
  };
}

export interface AsinLiquidationItem {
  asin: string;
  FBA_Inv: number;
  Price: number;
  inv_90_150: number;
  inv_151_180: number;
  inv_181_330: number;
  inv_331_365: number;
  inv_gt_365: number;
  LT_Storage_Fee: number;
  INV_90_365: number;
  _5_months: number;
  product_name: string;
  SalesQuantity_day: number;
  DaysCover: number;
}

export interface InventoryAgingSummary {
  _0_90_days: number;
  _91_180_days: number;
  _181_330_days: number;
  _331_365_days: number;
  above_365_days: number;
}

export interface InventoryHealthSummary {
  "0_90_days": number;
  above_90: number;
  stranded: number;
}

export interface AsinLiquidationResponse {
  excess_inventory: AsinLiquidationItem[];
  liquidation: AsinLiquidationItem[];
  inventory_aging_summary: InventoryAgingSummary;
  inventory_health: InventoryHealthSummary;
}

export interface CampaignSummaryItem {
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  ad_cost: number;
  sales: number;
  purchases: number;
  ctr_percent: number;
  cost_per_click: number;
  acos_percent: number;
  tag: string;
}

export interface TargetingAnalysisItem {
  targeting_type: string;
  keyword_text: string;
  match_type: string;
  impressions: number;
  clicks: number;
  cost: number;
  sales: number;
  orders: number;
  ctr_percent: number;
  conversion_percent: number;
  acos_percent: number;
}

export interface SalesTrendItem {
  date: string;
  sales: number;
  units: number;
  trend_direction: "up" | "down" | "stable";
}

export interface SalesTrendAsinItem {
  asin: string;
  product_name: string;
  sales_trend: SalesTrendItem[];
  total_sales: number;
  total_units: number;
  average_daily_sales: number;
}

export interface WeeklyDataItem {
  time_group: string;
  "Total Sales": number;
  "Total Quantity": number;
  "Total Ad Cost": number;
  "Total Ad Sales": number;
  "Total Impressions": number;
  "Total Clicks": number;
  "CTR%": number;
  CPC: number;
  "ACOS%": number;
  "Conversion%": number;
  Sessions: number;
  Orders: number;
}

export interface WeeklyDataResponse {
  weekly_data: WeeklyDataItem[];
}

export interface TrendsDataItem {
  time_group: string;
  impressions: number;
  clicks: number;
  "CTR%": number;
  CPC: number;
  cost: number;
  "CVR%": number;
  "ACOS%": number;
  "TACOS%": number;
  CPA: number;
  sales_30d: number;
  purchases_30d: number;
  "Sales ASP": number;
  "Total Sales": number;
  "Total Quantity": number;
}

export interface TrendsDataResponse {
  trends_data: TrendsDataItem[];
}

export interface TopAsinByRevenue {
  asin: string;
  product_name: string;
  image_url: string;
  revenue: number;
}

export interface SalesTrendPivotData {
  ASIN: string;
  "Product Name": string;
  // Dynamic columns based on periods and metrics
  [key: string]: string | number;
}

export interface SalesTrendResponse {
  pivoted_data: SalesTrendPivotData[];
  summary: {
    total_asins: number;
    periods_analyzed: number;
    date_range?: string;
    error?: string;
  };
}

export interface PeriodData {
  Impressions: number;
  Clicks: number;
  CTR: number;
  CPC: number;
  Spend: number;
  Sales: number;
  ACOS: number;
  Orders: number;
  CVR: number;
  "Total Sales": number;
  "Total Orders": number;
  Sessions: number;
  "Total Order Items": number;
  ASP: number;
  TACOS: number;
  CPM: number;
}

export interface ChangesData {
  Impressions: number;
  Clicks: number;
  CTR: number;
  CPC: number;
  Spend: number;
  Sales: number;
  ACOS: number;
  Orders: number;
  CVR: number;
  "Total Sales": number;
  "Total Orders": number;
  Sessions: number;
  "Total Order Items": number;
  ASP: number;
  TACOS: number;
  CPM: number;
}

export interface AdsTypeContribution {
  source: string;
  total_sales: number;
  sales_contribution_pct: number;
}

export interface CategoryAnalysis {
  product_type: string;
  sales_amount: number;
  percentage: number;
}

export interface AdsSalesResponse {
  current_period: PeriodData;
  previous_period: PeriodData;
  changes: ChangesData;
  ads_type_contribution: AdsTypeContribution[];
  category_analysis: CategoryAnalysis[];
  top_5_asins_by_revenue: TopAsinByRevenue[];
}

// Combined ASIN Summary (SC + VC) Types
export interface CombinedAsinSummaryItem {
  asin: string
  product_name: string
  image_url: string
  focus_category: string
  
  // Seller Central metrics
  sc_revenue: number
  sc_units: number
  sc_asp: number
  sc_sessions: number
  sc_conversion_rate: number
  sc_buy_box_percentage: number
  sc_replacement_rate: number
  sc_return_rate: number
  sc_return_quantity: number
  
  // Vendor Central metrics
  vc_revenue: number
  vc_units: number
  
  // Combined totals
  total_revenue: number
  total_quantity: number
  asp_combined: number
  
  // Advertising metrics (typically SC only)
  total_ad_cost: number
  total_ad_sales: number
  acos_percent: number
  impressions: number
  clicks: number
  ctr_percent: number
  
  // Derived metrics using combined totals
  tacos_percent: number
  organic_sales: number
  organic_percentage: number
  
  // Other
  days_of_supply: number
}

export interface CombinedAsinSummaryStats {
  sc_revenue: number
  sc_units: number
  vc_revenue: number
  vc_units: number
  total_revenue: number
  total_quantity: number
  sc_buy_box_percent: number
  sc_replacement_rate: number
  sc_return_rate: number
  vc_contribution_percent: number
}

export interface CombinedAsinSummaryResponse {
  asin_summary: CombinedAsinSummaryItem[]
  summary_stats: CombinedAsinSummaryStats
  message: string
  data_available: boolean
}

// Original ASIN Summary Types (for reference - keep these for seller-only clients)
export interface AsinSummaryItem {
  asin: string
  product_name: string
  image_url: string
  focus_category: string
  total_sales: number
  total_units: number
  total_ad_cost: number
  total_ad_sales: number
  acos_percent: number
  sessions: number
  conversion_rate: number
  tacos_percent: number
  buy_box_percentage: number
  replacement_rate: number
  return_rate: number
  ctr_percent: number
  days_of_supply: number
  asp: number
  Return_Quantity: number
}

export interface AsinSummaryResponse {
  asin_summary: AsinSummaryItem[]
  summary_stats: {
    total_sales: number
    total_quantity: number
    "Buy Box %": number
    replacement_rate: number
    "Return Rate": number
  }
  message: string
  data_available: boolean
}

export interface AdsTrendItem {
  Campaign: string;
  [key: string]: string | number;
}

export interface InventoryStatsResponse {
  stats: {
    total: {
      total_asin: number;
      total_quantity: number;
    };
    excess: {
      total_asin: number;
      total_quantity: number;
    };
    liquidation: {
      total_asin: number;
      total_quantity: number;
    };
    stranded: {
      total_asin: number;
      total_quantity: number;
    };
    vendor?: {
      total_asin: number;
      total_quantity: number;
    };
  };
  metadata: {
    sales_days: number;
    reorder_cover_days: number;
    supply_chain_lead_time: number;
    calculated_at: string;
  };
}

export interface CampaignMetricsData {
  Impressions: number;
  Clicks: number;
  CTR: number;
  CPC: number;
  "Ad Costs": number;
  Orders: number;
  CVR: number;
  "Ads Sales": number;
  ACOS: number;
  "Ads Sales %": number;
}

export interface CampaignMetricsChanges {
  Impressions: number;
  Clicks: number;
  CTR: number;
  CPC: number;
  "Ad Costs": number;
  Orders: number;
  CVR: number;
  "Ads Sales": number;
  ACOS: number;
  "Ads Sales %": number;
}

export interface CampaignMetricsResponse {
  current_period: CampaignMetricsData;
  previous_period: CampaignMetricsData;
  changes: CampaignMetricsChanges;
}

export interface OrganicSalesItem {
  asin: string;
  product_name: string;
  image_url: string;
  total_sales: number;
  ads_sales: number;
  organic_sales: number;
  organic_sales_percentage: number;
}

export interface OrganicSalesSummary {
  total_asins_analyzed: number;
  avg_organic_percentage: number;
  period_start: string;
  period_end: string;
}

export interface OrganicSalesResponse {
  organic_sales_data: OrganicSalesItem[];
  summary: OrganicSalesSummary;
}

export interface SalesContributionItem {
  category: string;
  sales: number;
  sales_contribution_pct: number;
}

export interface SalesContributionResponse {
  sales_contribution_by_category: SalesContributionItem[];
  total_sales: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface ReturnReplacementMetrics {
  total_returns: number;
  return_rate: number;
  total_replacements: number;
  replacement_rate: number;
}

export interface ReturnReplacementResponse {
  period: {
    start_date: string;
    end_date: string;
  };
  focus_asins: string[] | null;
  metrics: ReturnReplacementMetrics;
}

export interface CurrencyInfo {
  symbol: string;
  name: string;
  position: "before" | "after";
}

export interface MarketplaceCurrency {
  currency_code: string;
  currency_info: CurrencyInfo;
}

export interface UserMarketplaceCurrencies {
  [marketplaceId: string]: MarketplaceCurrency;
}

export interface CurrencyContextType {
  currencies: UserMarketplaceCurrencies;
  primaryCurrency: MarketplaceCurrency | null;
  isLoading: boolean;
  error: string | null;
  formatCurrency: (value: number, marketplaceId?: string) => string;
  getCurrencySymbol: (marketplaceId?: string) => string;
  refreshCurrencies: () => Promise<void>;
}

// Dashboard Service
export const dashboardService = {
  // Placement Data
  async getPlacementData(startDate: string, endDate: string) {
    const res = await apiClient.get<{ data: PlacementData[] }>(
      "/api/v1/dashboard-api/placement/",
      {
        params: { start_date: startDate, end_date: endDate },
      }
    );
    return res.data;
  },

  async getInventoryStats(options?: {
    sales_days?: number;
    reorder_cover_days?: number;
    supply_chain_lead_time?: number;
    use_cache?: boolean;
  }) {
    const res = await apiClient.get<InventoryStatsResponse>(
      "/api/v1/dashboard-api/inventory-stats/",
      {
        params: options,
      }
    );
    return res.data;
  },

  // Inventory Health
  async getInventoryHealth(options?: {
    sales_days?: number;
    reorder_cover_days?: number;
    supply_chain_lead_time?: number;
  }) {
    const res = await apiClient.get<InventoryHealthResponse>(
      "/api/v1/dashboard-api/inventory-health/",
      {
        params: options,
      }
    );
    return res.data;
  },

  // ASIN Liquidation
  async getAsinLiquidation(days_window?: number) {
    const res = await apiClient.get<AsinLiquidationResponse>(
      "/api/v1/dashboard-api/asin-liquidation/",
      {
        params: { days_window },
      }
    );
    return res.data;
  },

  // Campaign Summary
  async getCampaignSummary(period?: string) {
    const res = await apiClient.get<CampaignSummaryItem[]>(
      "/api/v1/dashboard-api/campaign-summary/",
      {
        params: { period },
      }
    );
    return res.data;
  },

  // Campaign Summary with full params - FIXED VERSION
  async getCampaignSummaryWithParams(options: {
    start_date: string;
    end_date: string;
    period?: string;
    focus_level?: "high" | "medium" | "low" | "all";
  }) {
    // Build params based on backend expectations
    const params: Record<string, string> = {};

    // If period is 'custom', format dates for the period parameter
    // Otherwise, use the period preset
    if (options.period === "custom" && options.start_date && options.end_date) {
      // Backend expects: 'YYYY-MM-DD to YYYY-MM-DD'
      params.period = `${options.start_date} to ${options.end_date}`;
    } else if (options.period) {
      // Use preset period like '7d', '30d', '3m', etc.
      params.period = options.period;
    }

    // Add focus_level if provided
    if (options.focus_level) {
      params.focus_level = options.focus_level;
    }

    console.log("📊 Campaign Summary Request:", {
      originalOptions: options,
      finalParams: params,
    });

    const res = await apiClient.get("/api/v1/dashboard-api/campaign-summary/", {
      params,
    });

    console.log("📊 Campaign Summary API Response:", res.data);

    // Handle wrapped response structure - extract from 'json' if present
    let processedData = res.data;
    if (res.data?.json) {
      processedData = Array.isArray(res.data.json)
        ? res.data.json
        : [res.data.json];
    }

    return processedData;
  },

  // Targeting Analysis
  async getTargetingAnalysis(period?: string) {
    const res = await apiClient.get<TargetingAnalysisItem[]>(
      "/api/v1/dashboard-api/targeting-analysis/",
      {
        params: { period },
      }
    );
    return res.data;
  },

  // UPDATED: Sales Trend ASIN - Now returns pivot table data
  async getSalesTrendAsin(period?: string) {
    console.log("Fetching sales trend ASIN data with period:", period);
    const res = await apiClient.get<SalesTrendResponse>(
      "/api/v1/dashboard-api/sales-trend-asin/",
      {
        params: { period },
      }
    );
    console.log("Sales trend ASIN response received:", res.data);
    return res.data;
  },

  // LEGACY: Keep backward compatibility with old sales trend format
  // async getSalesTrendAsinLegacy(period?: string) {
  //   const res = await apiClient.get<SalesTrendAsinItem[]>('/api/v1/dashboard-api/sales-trend-asin-legacy/', {
  //     params: { period }
  //   })
  //   return res.data
  // },

  // Weekly Data
  async getWeeklyData(options?: {
    focus_level?: "high" | "medium" | "low" | "all";
    aggregation?: "weekly" | "monthly" | "daily";
  }) {
    console.log("Fetching weekly data with options:", options);
    const res = await apiClient.get<WeeklyDataResponse>(
      "/api/v1/dashboard-api/weekly/",
      {
        params: options,
      }
    );
    console.log("Weekly data response received:", res.data);
    return res.data;
  },

  async getTrendsData(options?: {
    period?: "30" | "90";
    focus_level?: "high" | "medium" | "low" | "all";
  }) {
    console.log("Fetching trends data with options:", options);
    const res = await apiClient.get<TrendsDataResponse>(
      "/api/v1/dashboard-api/trends/",
      {
        params: options,
      }
    );
    console.log("Trends data response received:", res.data);
    return res.data;
  },

  // Ads Sales Data
  // Ads Sales Data
  async getAdsSalesData(options: {
    start_date: string;
    end_date: string;
    focus_level?: "high" | "medium" | "low" | "all";
  }): Promise<AdsSalesResponse> {
    console.log("Fetching ads-sales data with options:", options);
    const res = await apiClient.get<
      AdsSalesResponse | { json: AdsSalesResponse }
    >("/api/v1/dashboard-api/ads-sales/", { params: options });

    // Handle wrapped response structure - extract from 'json' if present
    if ("json" in res.data) {
      return res.data.json;
    }

    return res.data;
  },

  // ASIN Summary
  async getAsinSummary(options: {
    start_date: string;
    end_date: string;
    focus_level?: "high" | "medium" | "low" | "all";
  }) {
    // Update the generic type to match the new API response structure
    const res = await apiClient.get<{
      asin_summary: AsinSummaryItem[];
      summary_stats: {
        total_sales: number;
        total_quantity: number;
        "Buy Box %": number;
        replacement_rate: number;
        "Return Rate": number;
      };
    }>("/api/v1/dashboard-api/asin-summary/", {
      params: options,
    });

    // Updated logging to check the new structure
    if (
      !res.data ||
      (res.data?.asin_summary && res.data.asin_summary.length === 0)
    ) {
      console.log("⚠️ ASIN Summary: No data returned");
    } else if (
      res.data?.asin_summary &&
      res.data.asin_summary.every((item) => item.total_sales === 0)
    ) {
      console.log("⚠️ ASIN Summary: All items have zero sales");
    }

    return res.data; // This now returns { asin_summary: [...], summary_stats: {...} }
  },

  // Combined ASIN Summary (for clients with both SC and VC)
  async getCombinedAsinSummary(options: {
    start_date: string
    end_date: string
    focus_level?: "high" | "medium" | "low" | "all"
  }): Promise<CombinedAsinSummaryResponse> {
    const res = await apiClient.get<CombinedAsinSummaryResponse>(
      "/api/v1/dashboard-api/asin-summary-combined/",
      {
        params: options,
      }
    )

    if (
      !res.data ||
      (res.data?.asin_summary && res.data.asin_summary.length === 0)
    ) {
      console.log("⚠️ Combined ASIN Summary: No data returned")
    } else if (
      res.data?.asin_summary &&
      res.data.asin_summary.every((item) => item.total_revenue === 0)
    ) {
      console.log("⚠️ Combined ASIN Summary: All items have zero revenue")
    }
    return res.data
  },

  // Ads Trend
  async getAdsTrend(days?: number) {
    const res = await apiClient.get<AdsTrendItem[]>(
      "/api/v1/dashboard-api/ads-trend/",
      {
        params: { days },
      }
    );
    return res.data;
  },

  // Campaign Metrics Data
  async getCampaignMetrics(options: {
    start_date: string;
    end_date: string;
    focus_level?: "high" | "medium" | "low" | "all";
  }) {
    console.log("Fetching campaign metrics with options:", options);
    const res = await apiClient.get<CampaignMetricsResponse>(
      "/api/v1/dashboard-api/campaign-metrics/",
      {
        params: options,
      }
    );
    console.log("Campaign metrics response received:", res.data);
    return res.data;
  },

  async getOrganicSalesData(options: {
    start_date: string;
    end_date: string;
    limit?: number;
  }) {
    const res = await apiClient.get<OrganicSalesResponse>(
      "/api/v1/dashboard-api/organic-sales/",
      {
        params: options,
      }
    );
    return res.data;
  },

  async getReturnReplacementRates(options: {
    start_date: string;
    end_date: string;
    focus_asins?: string[];
  }) {
    const params: any = {
      start_date: options.start_date,
      end_date: options.end_date,
    };

    if (options.focus_asins && options.focus_asins.length > 0) {
      params.focus_asins = options.focus_asins.join(",");
    }

    const res = await apiClient.get<ReturnReplacementResponse>(
      "/api/v1/dashboard-api/return-replacement-rates/",
      {
        params,
      }
    );

    return res.data;
  },

  async getSalesContributionByCategory(options: {
    start_date: string;
    end_date: string;
  }) {
    console.log(
      "Fetching sales contribution by category with options:",
      options
    );
    const res = await apiClient.get<SalesContributionResponse>(
      "/api/v1/dashboard-api/sales-contribution-by-category/",
      {
        params: options,
      }
    );
    console.log("Sales contribution response received:", res.data);
    return res.data;
  },

};

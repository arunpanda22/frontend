import { apiClient } from '@/lib/api/config'

// Dashboard API Types based on the provided documentation
export interface PlacementData {
  targeting: string
  impressions: number
  clicks: number
  ctr_percentage: number
  ad_cost: number
  cost_per_click: number
  units_sold: number
  sales: number
  acos_percentage: number
  sales_percentage: number
  cost_percentage: number
}

export interface InventoryHealthItem {
  asin: string
  product_name: string
  focus_category: string
  sellable_quantity: number
  unsellable_quantity: number
  sales_per_day: number
  inventory_cover: number
  reorder_quantity: number
  oos_alert: boolean
}

export interface InventoryHealthResponse {
  inventory_health: InventoryHealthItem[]
  metadata: {
    sales_days: number
    reorder_cover_days: number
    supply_chain_lead_time: number
  }
}

export interface AsinLiquidationItem {
  asin: string
  FBA_Inv: number
  Price: number
  inv_90_150: number
  inv_151_180: number
  inv_181_330: number
  inv_331_365: number
  inv_gt_365: number
  LT_Storage_Fee: number
  INV_90_365: number
  _5_months: number
  product_name: string
  SalesQuantity_day: number
  DaysCover: number
}

export interface AsinLiquidationResponse {
  excess_inventory: AsinLiquidationItem[]
  liquidation: AsinLiquidationItem[]
}

export interface CampaignSummaryItem {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  ad_cost: number
  sales: number
  purchases: number
  ctr_percent: number
  cost_per_click: number
  acos_percent: number
}

export interface TargetingAnalysisItem {
  targeting_type: string
  keyword_text: string
  match_type: string
  impressions: number
  clicks: number
  cost: number
  sales: number
  orders: number
  ctr_percent: number
  conversion_percent: number
  acos_percent: number
}

export interface SalesTrendItem {
  date: string
  sales: number
  units: number
  trend_direction: 'up' | 'down' | 'stable'
}

export interface SalesTrendAsinItem {
  asin: string
  product_name: string
  sales_trend: SalesTrendItem[]
  total_sales: number
  total_units: number
  average_daily_sales: number
}

export interface WeeklyDataItem {
  time_group: string
  'Total Sales': number
  'Total Quantity': number
  'Total Ad Cost': number
  'Total Ad Sales': number
  'Total Impressions': number
  'Total Clicks': number
  'CTR%': number
  CPC: number
  'ACOS%': number
  'Conversion%': number
  Sessions: number
  Orders: number
}

export interface WeeklyDataResponse {
  weekly_data: WeeklyDataItem[]
}

export interface PeriodData {
  Impressions: number
  Clicks: number
  CTR: number
  CPC: number
  Spend: number
  Sales: number
  ACOS: number
  Orders: number
  CVR: number
  'Total Sales': number
  'Total Orders': number
  Sessions: number
  'Total Order Items': number
}

export interface ChangesData {
  Impressions: number
  Clicks: number
  CTR: number
  CPC: number
  Spend: number
  Sales: number
  ACOS: number
  Orders: number
  CVR: number
  'Total Sales': number
  'Total Orders': number
  Sessions: number
  'Total Order Items': number
}

export interface AdsSalesResponse {
  current_period: PeriodData
  previous_period: PeriodData
  changes: ChangesData
}

export interface AsinSummaryItem {
  asin: string
  product_name: string
  focus_category: string
  total_sales: number
  total_units: number
  total_ad_cost: number
  total_ad_sales: number
  impressions: number
  clicks: number
  ctr_percent: number
  acos_percent: number
  tacos_percent: number          // ✅ NEW - TACOS percentage
  buy_box_percentage: number     // ✅ NEW - BuyBox percentage  
  replacement_rate: number       // ✅ NEW - Product replacement rate
  return_rate: number            // ✅ NEW - Product return rate
  sessions: number
  conversion_rate: number
  inventory_quantity: number
  days_of_supply: number
}

export interface AdsTrendItem {
  Campaign: string
  ACOS_7_days: string
  ACOS_14_days: string
  ACOS_30_days: string
  ACOS_60_days: string
  ACOS_current: string
  ACOS_Trend: string
  CTR_7_days: string
  CTR_14_days: string
  CTR_30_days: string
  CTR_60_days: string
  CTR_current: string
  CTR_Trend: string
  Clicks_7_days: string
  Clicks_14_days: string
  Clicks_30_days: string
  Clicks_60_days: string
  Clicks_current: string
  Clicks_Trend: string
  Conversion_7_days: string
  Conversion_14_days: string
  Conversion_30_days: string
  Conversion_60_days: string
  Conversion_current: string
  Conversion_Trend: string
  Impressions_7_days: string
  Impressions_14_days: string
  Impressions_30_days: string
  Impressions_60_days: string
  Impressions_current: string
  Impressions_Trend: string
  Orders_7_days: string
  Orders_14_days: string
  Orders_30_days: string
  Orders_60_days: string
  Orders_current: string
  Orders_Trend: string
  Sales_7_days: string
  Sales_14_days: string
  Sales_30_days: string
  Sales_60_days: string
  Sales_current: string
  Sales_Trend: string
  Spend_7_days: string
  Spend_14_days: string
  Spend_30_days: string
  Spend_60_days: string
  Spend_current: string
  Spend_Trend: string
}

// Dashboard Service
export const dashboardService = {
  // Placement Data
  async getPlacementData(startDate: string, endDate: string) {
    const res = await apiClient.get<{ data: PlacementData[] }>('/api/v1/dashboard-api/placement/', {
      params: { start_date: startDate, end_date: endDate }
    })
    return res.data
  },

  // Inventory Health
  async getInventoryHealth(options?: {
    sales_days?: number
    reorder_cover_days?: number
    supply_chain_lead_time?: number
  }) {
    const res = await apiClient.get<InventoryHealthResponse>('/api/v1/dashboard-api/inventory-health/', {
      params: options
    })
    return res.data
  },

  // ASIN Liquidation
  async getAsinLiquidation(days_window?: number) {
    const res = await apiClient.get<AsinLiquidationResponse>('/api/v1/dashboard-api/asin-liquidation/', {
      params: { days_window }
    })
    return res.data
  },

  // Campaign Summary
  async getCampaignSummary(period?: string) {
    const res = await apiClient.get<CampaignSummaryItem[]>('/api/v1/dashboard-api/campaign-summary/', {
      params: { period }
    })
    return res.data
  },

  // Campaign Summary with full params
  async getCampaignSummaryWithParams(options: {
    start_date: string
    end_date: string
    period?: string
    focus_level?: 'high' | 'medium' | 'low' | 'all'
  }) {
    const res = await apiClient.get('/api/v1/dashboard-api/campaign-summary/', {
      params: options
    })
    console.log('📊 Campaign Summary API Response:', res.data)
    
    // Handle wrapped response structure - extract from 'json' if present
    let processedData = res.data;
    if (res.data?.json) {
      processedData = Array.isArray(res.data.json) ? res.data.json : [res.data.json];
    }
    
    return processedData
  },

  // Targeting Analysis
  async getTargetingAnalysis(period?: string) {
    const res = await apiClient.get<TargetingAnalysisItem[]>('/api/v1/dashboard-api/targeting-analysis/', {
      params: { period }
    })
    return res.data
  },

  // Sales Trend ASIN
  async getSalesTrendAsin(period?: string) {
    const res = await apiClient.get<SalesTrendAsinItem[]>('/api/v1/dashboard-api/sales-trend-asin/', {
      params: { period }
    })
    return res.data
  },

  // Weekly Data
  async getWeeklyData(options?: {
    focus_level?: 'high' | 'medium' | 'low' | 'all'
    aggregation?: 'weekly' | 'monthly'
  }) {
    console.log('Fetching weekly data with options:', options);
    const res = await apiClient.get<WeeklyDataResponse>('/api/v1/dashboard-api/weekly/', {
      params: options
    })
    console.log('Weekly data response received:', res.data);
    return res.data
  },

  // Ads Sales Data
  async getAdsSalesData(options: {
    start_date: string
    end_date: string
    focus_level?: 'high' | 'medium' | 'low' | 'all'
  }) {
    console.log('Fetching ads-sales data with options:', options);
    const res = await apiClient.get('/api/v1/dashboard-api/ads-sales/', {
      params: options
    })
    console.log('Ads-sales data response received:', res.data);
    
    // Handle wrapped response structure - extract from 'json' if present
    let processedData = res.data;
    if (res.data?.json) {
      processedData = res.data.json;
    }
    
    return processedData
  },

  // ASIN Summary
  async getAsinSummary(options: {
    start_date: string
    end_date: string
    focus_level?: 'high' | 'medium' | 'low' | 'all'
  }) {
    const res = await apiClient.get<{ data: AsinSummaryItem[] }>('/api/v1/dashboard-api/asin-summary/', {
      params: options
    })
    // Only log if there's an issue or very few results
    if (!res.data || (res.data?.data && res.data.data.length === 0)) {
      console.log('⚠️ ASIN Summary: No data returned');
    } else if (res.data?.data && res.data.data.every(item => item.total_sales === 0)) {
      console.log('⚠️ ASIN Summary: All items have zero sales');
    }
    return res.data
  },

  // Ads Trend
  async getAdsTrend(days?: number) {
    const res = await apiClient.get<AdsTrendItem[]>('/api/v1/dashboard-api/ads-trend/', {
      params: { days }
    })
    return res.data
  }
}

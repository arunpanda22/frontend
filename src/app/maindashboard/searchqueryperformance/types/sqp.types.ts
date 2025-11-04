// src/app/maindashboard/searchqueryperformance/types/sqp.types.ts

// Search query table data - matches SearchQueryTableSerializer
export interface SearchQueryPerformanceData {
  asin: string;
  search_query: string;
  // Click metrics
  total_click_count: number;
  asin_click_count: number;
  total_median_click_price: number;
  asin_median_click_price: number;
  // Purchase metrics
  total_purchase_count: number;
  asin_purchase_count: number;
  // Conversion metrics
  total_conversion: number;
  asin_conversion: number;
  // Boolean flags
  conversion_greater_than_market: boolean;
  keyword_exists: boolean;
}

// Monthly metrics from backend - matches MonthlyMetricsSerializer
export interface MonthlyMetric {
  year_month: string;
  asin: string;
  // Impression metrics
  total_query_impression_count: number;
  asin_impression_count: number;
  asin_impression_share: number;
  // Click metrics
  total_click_count: number;
  asin_click_count: number;
  asin_click_share: number;
  total_median_click_price: number;
  asin_median_click_price: number;
  // Purchase metrics
  total_purchase_count: number;
  asin_purchase_count: number;
  asin_purchase_share: number;
  // Calculated metrics
  total_conversion: number;
  asin_conversion: number;
  asin_weighted_click_sales: number;
  total_weighted_click_sales: number;
}

export interface SQPDashboardResponse {
  monthly_metrics: MonthlyMetric[];
  search_queries: SearchQueryPerformanceData[];
  top_asins: string[]; 
  metadata: {
    total_asins: number;
    date_range: {
      start_date: string;
      end_date: string;
    };
    selected_asin?: string;
    [key: string]: any;
  };
}

export interface SQPRequestParams {
  selected_asin?: string;
}

export interface FilterState {
  view: "all" | "individual";
  selectedAsin: string;
}

export interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueSuffix?: string;
  trend?: string;
  trendPositive?: boolean;
  chartData: number[];
  chartColors: string[];
  chartType?: 'vertical' | 'horizontal';
}

export interface ChartProps {
  marketPriceData?: number[];
  asinPriceData?: number[];
  totalConversionData?: number[];
  asinConversionData?: number[];
  months: string[];
}
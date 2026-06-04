import { apiClient } from "@/lib/api/config";

export interface RevenueByState {
  state: string;
  revenue: number;
  orders: number;
  aov: number;
  revenue_share: number;
}

export interface RevenueMapResponse {
  total_revenue: number;
  total_orders: number;
  min_revenue: number;
  max_revenue: number;
  states: RevenueByState[];
}

export interface StateRevenueDetailSku {
  sku: string;
  product_name: string;
  revenue: number;
  orders: number;
  quantity_shipped: number;
}

export interface StateRevenueDetailCity {
  city: string;
  revenue: number;
  orders: number;
}

export interface StateRevenueDetailResponse {
  state: string;
  revenue: number;
  orders: number;
  aov: number;
  revenue_share: number;
  top_skus: StateRevenueDetailSku[];
  cities: StateRevenueDetailCity[];
}

// ─── Cohort Orders ────────────────────────────────────────────────────────────

export interface CohortOrder {
  "buyer-email":          string;
  "purchase-date":        string;
  "item-price":           string;
  "first-purchase-month": string;
}

export interface CohortOrdersResponse {
  count: number;
  orders: CohortOrder[];
}

// ─── Cohort Top SKUs ──────────────────────────────────────────────────────────

export interface CohortTopSku {
  sku:                     string;
  asin:                    string | null;
  product_name:            string | null;
  image_url:               string | null;
  revenue:                 string;
  orders:                  number;
  quantity:                number;
  unique_customers:        number;
  returning_customers:     number;
  returning_pct:           number;
  avg_orders_per_customer: number;
}

export interface CohortTopSkusResponse {
  count: number;
  skus:  CohortTopSku[];
}

// ─── Shared params ────────────────────────────────────────────────────────────

export interface OrderAnalyticsParams {
  date_from?:            string;
  date_to?:              string;
  sku?:                  string;
  sales_channel?:        string;
  fulfillment_channel?:  string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const BASE = "/api/v1/dashboard-analytics";

export const orderAnalyticsService = {

  async getRevenueMap(params?: OrderAnalyticsParams): Promise<RevenueMapResponse> {
    const res = await apiClient.get<RevenueMapResponse>(`${BASE}/revenue-map/`, { params });
    return res.data;
  },

  async getStateRevenueDetail(state: string, params?: OrderAnalyticsParams): Promise<StateRevenueDetailResponse> {
    const res = await apiClient.get<StateRevenueDetailResponse>(
      `${BASE}/revenue-map/${encodeURIComponent(state)}/`, { params }
    );
    return res.data;
  },

  async getCohortOrders(): Promise<CohortOrdersResponse> {
    const res = await apiClient.get<CohortOrdersResponse>(`${BASE}/cohort-orders/`);
    return res.data;
  },

  async getCohortTopSkus(params?: OrderAnalyticsParams): Promise<CohortTopSkusResponse> {
    const res = await apiClient.get<CohortTopSkusResponse>(`${BASE}/cohort-top-skus/`, { params });
    return res.data;
  },

};
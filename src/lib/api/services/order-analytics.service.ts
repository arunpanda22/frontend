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

// ─── Cohort ───────────────────────────────────────────────────────────────────

export interface CohortOrder {
  "buyer-email":          string;
  "purchase-date":        string;   // ISO-8601 — the order date
  "item-price":           string;   // net revenue for this row
  "first-purchase-month": string;   // 'yyyy-MM' — customer's first-ever purchase
}

export interface CohortOrdersResponse {
  count: number;
  orders: CohortOrder[];
}

// ─── Shared params ────────────────────────────────────────────────────────────

export interface OrderAnalyticsParams {
  date_from?: string;
  date_to?: string;
  sku?: string;
  sales_channel?: string;
  fulfillment_channel?: string;
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

  // Cohort always fetches last 6 months — backend ignores date params
  async getCohortOrders(): Promise<CohortOrdersResponse> {
    const res = await apiClient.get<CohortOrdersResponse>(`${BASE}/cohort-orders/`);
    return res.data;
  },
};
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

// ── Types ────────────────────────────────────────────────────────────────────

export type OptimizationType = "weekly" | "daily" | "dayparting";

export interface CategoryLog {
  ads_type:         string;
  ads_type_display: string;
  row_count:        number;
  pushed_at:        string;
}

export interface OptimizationLogGroup {
  date:                      string;
  optimization_type:         OptimizationType;
  optimization_type_display: string;
  total_rows:                number;
  category_count:            number;
  first_pushed_at:           string;
  last_pushed_at:            string;
  categories:                CategoryLog[];
}

export interface OptimizationLogsResponse {
  results: OptimizationLogGroup[];
}

export interface LogsFilters {
  optimization_type?: OptimizationType;
  from_date?:         string;
  to_date?:           string;
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const optimizationLogsQueryKeys = {
  all:     ()                      => ["optimization-logs"]                   as const,
  list:    (filters?: LogsFilters) => ["optimization-logs", "list", filters]  as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useOptimizationLogs(filters?: LogsFilters) {
  return useQuery({
    queryKey: optimizationLogsQueryKeys.list(filters),
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters?.optimization_type) params.set("optimization_type", filters.optimization_type);
      if (filters?.from_date)         params.set("from_date",         filters.from_date);
      if (filters?.to_date)           params.set("to_date",           filters.to_date);

      const url = `/api/v1/optimizer/logs/${params.toString() ? `?${params}` : ""}`;
      const res = await apiClient.get<OptimizationLogsResponse>(url);
      return res.data;
    },
    staleTime: 60_000,
  });
}

/**
 * Triggers a file download by creating a temporary anchor element.
 * Called imperatively — not a React Query hook — since downloads
 * are actions, not data fetches.
 */
export async function downloadOptimizationLogs(
  date: string,
  optimizationType: OptimizationType,
  onError?: (msg: string) => void,
): Promise<void> {
  try {
    const params = new URLSearchParams({ date, optimization_type: optimizationType });

    // Use apiClient so the baseURL and auth headers are applied correctly.
    // responseType: "blob" tells axios to return binary data instead of
    // trying to parse the response as JSON.
    const res = await apiClient.get(`/api/v1/optimizer/logs/download/`, {
      params: { date, optimization_type: optimizationType },
      responseType: "blob",
    });

    const blob     = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const blobUrl  = URL.createObjectURL(blob);
    const filename = `optimization_${date}_${optimizationType}.xlsx`;

    const anchor         = document.createElement("a");
    anchor.href          = blobUrl;
    anchor.download      = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  } catch (err: any) {
    onError?.(err.message || "Download failed");
  }
}
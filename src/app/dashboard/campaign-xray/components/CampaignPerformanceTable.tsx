"use client";

import React, { useMemo } from "react";
import { EnhancedDataTable, ColumnDefinition } from "@/components/dashboard/table/enhanced-data-table";
import { useKeywordPerformance } from "@/lib/hooks/useCampaignQueries";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { Loader2 } from "lucide-react";

const KeywordPerformanceTable = () => {
  const { dateRange } = useDateRange();

  // Fetch keyword performance data with date range
  const { data, isLoading, isError, error } = useKeywordPerformance({
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  });

  // Define columns - showing important metrics only
  const columns: ColumnDefinition[] = useMemo(
    () => [
      {
        field: "campaign_name",
        headerName: "Campaign",
        type: "text",
        sortable: true,
        filterable: true,
        pinned: "left",
        minWidth: 200,
        maxWidth: 400,
      },
      {
        field: "keyword",
        headerName: "Keyword",
        type: "text",
        sortable: true,
        filterable: true,
        pinned: "left",
        minWidth: 180,
        maxWidth: 350,
      },
      {
        field: "match_type",
        headerName: "Match Type",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "source",
        headerName: "Source",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "impressions",
        headerName: "Impressions",
        type: "number",
        sortable: true,
        filterable: true,
        width: 140,
      },
      {
        field: "clicks",
        headerName: "Clicks",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "cost",
        headerName: "Spend",
        type: "number",
        sortable: true,
        filterable: true,
        width: 130,
      },
      {
        field: "sales_30d",
        headerName: "Sales",
        type: "number",
        sortable: true,
        filterable: true,
        width: 130,
      },
      {
        field: "purchases_30d",
        headerName: "Orders",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "ctr",
        headerName: "CTR %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "cpc",
        headerName: "CPC",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "acos",
        headerName: "ACOS %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "roas",
        headerName: "ROAS",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "cvr",
        headerName: "CVR %",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        field: "cpa",
        headerName: "CPA",
        type: "number",
        sortable: true,
        filterable: true,
        width: 120,
      },
    ],
    []
  );

  // Transform data for table
  const tableData = useMemo(() => {
    if (!data?.keyword_level?.data) return [];
    return data.keyword_level.data;
  }, [data]);

  // Initial sort: by sales descending
  const initialSort = useMemo(
    () => [
      {
        field: "sales_30d",
        direction: "desc" as const,
      },
    ],
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600 font-medium">Loading keyword performance data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-red-500 text-lg font-semibold">Error Loading Data</div>
          <p className="text-slate-600 text-sm">
            {error instanceof Error ? error.message : "Failed to load keyword performance data"}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!tableData || tableData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-slate-700 text-lg font-semibold">No Data Available</div>
          <p className="text-slate-500 text-sm">
            No keyword performance data found for the selected date range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Info Card */}
      {data?.period_info && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Current Period</h3>
              <p className="text-xs text-slate-600">
                {data.period_info.current_start} to {data.period_info.current_end} (
                {data.period_info.period_days} days)
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-slate-700">Compared To</h3>
              <p className="text-xs text-slate-600">
                {data.period_info.previous_start} to {data.period_info.previous_end}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-slate-700">Total Keywords</h3>
              <p className="text-lg font-bold text-blue-600">{data.keyword_level.total_records}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <EnhancedDataTable
        data={tableData}
        columns={columns}
        initialSort={initialSort}
        showCheckboxColumn={true}
        rowsPerPage={20}
        autoFitHeaders={false}
        showExportCard={true}
        enableComparisonMode={true}
      />
    </div>
  );
};

export default KeywordPerformanceTable;
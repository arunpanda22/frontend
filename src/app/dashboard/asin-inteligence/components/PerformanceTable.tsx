"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAsinPerformanceData } from "@/lib/hooks/queries/use-dashboard";
import {
  AdvancedDataTable,
  type ColumnDefinition,
  type TableData,
} from "@/components/dashboard/table/advanced-data-table";
import { useCurrency } from "@/lib/context/CurrencyContext";

interface AsinPerformanceTableProps {
  startDate: string;
  endDate: string;
  focusLevel?: "high" | "medium" | "low" | "all";
}

export default function AsinPerformanceTable({
  startDate,
  endDate,
  focusLevel = "all",
}: AsinPerformanceTableProps) {
  const { formatPercentage, getCurrencySymbol, formatPercentageNoDecimal } =
    useCurrency();
  const currency = getCurrencySymbol();
  
  const period = useMemo(() => {
    if (!startDate || !endDate) return "30d";

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 7) return "7d";
    if (diffDays <= 14) return "14d";
    if (diffDays <= 30) return "30d";
    if (diffDays <= 60) return "60d";
    if (diffDays <= 90) return "90d";
    return "custom";
  }, [startDate, endDate]);

  // Fetch ASIN performance data - now includes hasVendorAccount flag
  const { asinSummary, hasVendorAccount, isLoading, isError, error } = 
    useAsinPerformanceData({
      start_date: startDate,
      end_date: endDate,
      period: period,
      focus_level: focusLevel,
    });

  // Define columns based on account type
  const initialColumns: ColumnDefinition[] = useMemo(() => {
    // Base columns that are always shown
    const baseColumns: ColumnDefinition[] = [
      {
        field: "asin",
        headerName: "ASIN",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        width: 120,
        minWidth: 120,
        pinned: "left",
      },
      {
        field: "product_name",
        headerName: "Name",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        minWidth: 350,
        maxWidth: 600,
        pinned: "left",
      },
      {
        field: "tags",
        headerName: "Tag",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
    ];

    // Seller-only columns
    const sellerOnlyColumns: ColumnDefinition[] = [
      {
        field: "total_quantity",
        headerName: "Total Quantity",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "total_sales",
        headerName: `Total Sales (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "sales_asp",
        headerName: `ASP (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
    ];

    // Combined (SC + VC) columns
    const combinedColumns: ColumnDefinition[] = [
      {
        field: "sc_units",
        headerName: "SC Units",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "sc_revenue",
        headerName: `SC Sales (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "vc_units",
        headerName: "VC Units",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "vc_revenue",
        headerName: `VC Sales (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "total_quantity",
        headerName: "Total Units",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "total_revenue",
        headerName: `Total Sales (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "asp_combined",
        headerName: `ASP (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
    ];

    // Common columns shown for both
    const commonColumns: ColumnDefinition[] = [
      {
        field: "ads_sales",
        headerName: `Ads Sales (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "ads_cost",
        headerName: `Cost (${currency})`,
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "buybox",
        headerName: "Buy Box %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "organic_sales",
        headerName: "Organic %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "conversion",
        headerName: "Conversion %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "acos",
        headerName: "ACOS %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "tacos",
        headerName: "TACOS %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "replacement_rate",
        headerName: "Replacement %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "return_rate",
        headerName: "Return %",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
    ];

    // Return appropriate columns based on account type
    return hasVendorAccount
      ? [...baseColumns, ...combinedColumns, ...commonColumns]
      : [...baseColumns, ...sellerOnlyColumns, ...commonColumns];
  }, [currency, hasVendorAccount]);

  const [tableColumns, setTableColumns] =
    useState<ColumnDefinition[]>(initialColumns);

  // Update columns when hasVendorAccount changes
  useMemo(() => {
    setTableColumns(initialColumns);
  }, [initialColumns]);

  // Transform API data based on account type
  const asinData: TableData[] = useMemo(() => {
    const rawData = asinSummary?.data?.asin_summary;

    if (!rawData || !Array.isArray(rawData)) {
      console.log("No valid asin_summary data found");
      return [];
    }

    return rawData.map((item: any) => {
      const actualItem = item.json || item;

      // Common fields for both types
      const commonData = {
        asin: actualItem.asin || "",
        product_name: actualItem.product_name || "",
        image_url: actualItem.image_url || "",
        tags: actualItem.tags || "",
        ads_sales: actualItem.total_ad_sales || 0,
        ads_cost: actualItem.total_ad_cost || 0 ,

        conversion: formatPercentage(
          actualItem.sc_conversion_rate || actualItem.conversion_rate
        ) || 0,
        acos: formatPercentage(actualItem.acos_percent) || "-",
        tacos: formatPercentage(actualItem.tacos_percent) || "-",
        replacement_rate: formatPercentage(
          actualItem.sc_replacement_rate || actualItem.replacement_rate
        ) || "-",
        return_rate: formatPercentage(
          actualItem.sc_return_rate || actualItem.return_rate
        ) || "-",
        buybox: actualItem.sc_buy_box_percentage || actualItem.buy_box_percentage || 0,
      };

      if (hasVendorAccount) {
        // Combined SC + VC data
        return {
          ...commonData,
          sc_units: actualItem.sc_units || 0,
          sc_revenue: actualItem.sc_revenue || 0,
          vc_units: actualItem.vc_units || 0,
          vc_revenue: actualItem.vc_revenue || 0,
          total_quantity: actualItem.total_quantity || 0,
          total_revenue: actualItem.total_revenue || 0,
          asp_combined: actualItem.asp_combined || 0,
          organic_sales: formatPercentageNoDecimal(
            actualItem.organic_percentage || 0
          ),
        };
      } else {
        // Seller-only data
        const totalSales = actualItem.total_sales || 0;
        const adSales = actualItem.total_ad_sales || 0;
        const organicCalc = totalSales > 0 
          ? ((totalSales - adSales) * 100) / totalSales 
          : 0;

        return {
          ...commonData,
          total_quantity: actualItem.total_units || 0,
          total_sales: totalSales,
          sales_asp: actualItem.asp || 0,
          organic_sales: formatPercentageNoDecimal(organicCalc),
        };
      }
    });
  }, [asinSummary, hasVendorAccount, formatPercentage, formatPercentageNoDecimal]);

  // Get summary stats - type-safe handling
  const summaryStats = useMemo(() => {
    return asinSummary?.data?.summary_stats || {};
  }, [asinSummary]);

  // Format date range for display
  const dateRangeDisplay = useMemo(() => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate).toLocaleDateString("en-GB");
    const end = new Date(endDate).toLocaleDateString("en-GB");
    return `${start} - ${end}`;
  }, [startDate, endDate]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h6 className="text-base font-bold text-[#1a2b3c] tracking-tight">
              ASIN Performance Table
            </h6>
            {dateRangeDisplay && (
              <span className="text-sm text-slate-600">{dateRangeDisplay}</span>
            )}
          </div>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <Typography variant="h6" color="text.secondary" className="ml-3">
            Loading ASIN performance data...
          </Typography>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
              ASIN Performance Table
            </h6>
            {dateRangeDisplay && (
              <span className="text-sm text-slate-600">{dateRangeDisplay}</span>
            )}
          </div>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="error">
              Failed to load ASIN performance data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error?.message || "An error occurred while fetching data"}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data state
  if (!asinData || asinData.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h6 className="text-base font-bold text-[#1a2b3c] tracking-tight">
              ASIN Performance Table
            </h6>
            {dateRangeDisplay && (
              <span className="text-sm text-slate-600">{dateRangeDisplay}</span>
            )}
          </div>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No ASIN performance data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No data found for the selected date range: {dateRangeDisplay}
            </Typography>
            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="caption" component="pre">
                  Debug:{" "}
                  {JSON.stringify(
                    { 
                      startDate, 
                      endDate, 
                      period, 
                      hasVendorAccount,
                      asinSummary 
                    },
                    null,
                    2
                  )}
                </Typography>
              </Box>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine sort field based on account type
  const defaultSortField = hasVendorAccount ? "total_revenue" : "total_sales";

  return (
    <div className="h-full bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      {/* Header with date range display */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h6 className="text-base font-semibold text-gray-900">
              ASIN Performance Table
            </h6>
            {hasVendorAccount && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                SC + VC
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {dateRangeDisplay && (
              <span className="text-xs text-slate-600 font-medium">
                📅 {dateRangeDisplay}
              </span>
            )}
            {summaryStats && Object.keys(summaryStats).length > 0 && (
              <span className="text-xs text-slate-500">
                {asinData.length} ASINs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0 p-2">
        <AdvancedDataTable
          data={asinData}
          columns={tableColumns}
          onDataChange={(newData) => {
            // Handle data changes if needed
            console.log("Data changed:", newData);
          }}
          onColumnsChange={setTableColumns}
          showCheckboxColumn={false}
          className="w-full h-full"
          initialSort={[
            {
              field: defaultSortField,
              direction: "desc",
            },
          ]}
        />
      </div>
    </div>
  );
}
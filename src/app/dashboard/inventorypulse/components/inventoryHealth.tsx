"use client";

import { useMemo, useState, useEffect } from "react";
import { Typography, Alert } from "@mui/material";
import { useInventoryHealth } from "@/lib/hooks/queries/use-dashboard";
import type { InventoryHealthItem } from "@/lib/api/services/dashboard.service";
import {
  AdvancedDataTable,
  type ColumnDefinition,
  type TableData,
} from "@/components/dashboard/table/advanced-data-table";

interface InventoryHealthTableProps {
  salesDays?: number;
  reorderCoverDays?: number;
  supplyChainLeadTime?: number;
}

// Helper functions for formatting
function formatNumber(val: any): number {
  if (val === null || val === undefined || val === "" || isNaN(Number(val)))
    return 0;
  return Number(val);
}

function formatDecimal(val: any, digits = 2): string {
  if (val === null || val === undefined || val === "" || isNaN(Number(val)))
    return "0";
  const num = Number(val);
  return num.toFixed(digits);
}

export default function InventoryHealthTable({
  salesDays = 30,
  reorderCoverDays = 45,
  supplyChainLeadTime = 15,
}: InventoryHealthTableProps) {
  // Use API data with configurable parameters
  const { data, isLoading, isError, error } = useInventoryHealth({
    sales_days: salesDays,
    reorder_cover_days: reorderCoverDays,
    supply_chain_lead_time: supplyChainLeadTime,
  });

  // Define columns for the AdvancedDataTable
  const tableColumns: ColumnDefinition[] = useMemo(() => {
    const hasVendorData = data?.metadata?.has_vendor_data || false;
    
    const columns: ColumnDefinition[] = [
      // Pinned identification columns
      {
        field: "asin",
        headerName: "ASIN",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        width: 160,
        minWidth: 220,
        pinned: "left",
      },
      {
        field: "product_name",
        headerName: "Product Name",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        width: 450,
        minWidth: 300,
        maxWidth: 600,
        pinned: "left",
      },
      {
        field: "focus_category",
        headerName: "Focus Category",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "status",
        headerName: "Status",
        type: "text",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      
      // Sales metrics grouped together
      {
        field: "fba_sales_per_day",
        headerName: "SC Sales/Day",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
    ];

    // Add vendor sales per day right after FBA sales per day
    if (hasVendorData) {
      columns.push({
        field: "vendor_sales_per_day",
        headerName: "VC Sales/Day",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      });
    }

    // FBA inventory columns
    columns.push(
      {
        field: "fba_reserved_quantity",
        headerName: "SC Reserved Qty",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "fba_fulfillable_quantity",
        headerName: "SC Fulfillable Qty",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      },
      {
        field: "fba_total_inventory",
        headerName: "SC Total Inventory",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      }
    );

    // Add vendor inventory right after FBA total inventory
    if (hasVendorData) {
      columns.push({
        field: "vendor_inventory",
        headerName: "Vendor Inventory",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      });
    }

    // Inventory cover columns
    columns.push({
      field: "fba_inventory_cover",
      headerName: "SC Inventory Cover (Days)",
      type: "number",
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    });

    // Add vendor inventory cover right after FBA inventory cover
    if (hasVendorData) {
      columns.push({
        field: "vendor_inventory_cover",
        headerName: "Vendor Inventory Cover (Days)",
        type: "number",
        editable: false,
        sortable: true,
        filterable: true,
        autoFitHeader: true,
      });
    }

    // Reorder quantity (always FBA-based)
    columns.push({
      field: "reorder_quantity",
      headerName: "Reorder Qty",
      type: "number",
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true,
    });

    if (hasVendorData) {
      console.log('✅ Adding vendor columns to table (grouped with FBA columns)');
    } else {
      console.log('ℹ️ No vendor data available, showing FBA columns only');
    }

    return columns;
  }, [data?.metadata?.has_vendor_data]);

  const [columns, setColumns] = useState<ColumnDefinition[]>(tableColumns);

  // Update columns when tableColumns changes
  useEffect(() => {
    console.log('Updating columns state. Has vendor data:', data?.metadata?.has_vendor_data);
    setColumns(tableColumns);
  }, [tableColumns, data?.metadata?.has_vendor_data]);

  // Transform API data to match AdvancedDataTable format
  const transformedData: TableData[] = useMemo(() => {
    if (!data?.inventory_health || !Array.isArray(data.inventory_health)) {
      console.log('No valid inventory health data found');
      return [];
    }
    
    const hasVendorData = data?.metadata?.has_vendor_data || false;
    console.log('Transforming data. Has vendor data:', hasVendorData);
    console.log('Raw inventory_health length:', data.inventory_health.length);
    console.log('Sample item:', data.inventory_health[0]);
    
    const transformed = data.inventory_health.map((item: InventoryHealthItem, index: number) => {
      try {
        const baseData = {
          asin: item.asin || '',
          product_name: item['Product Name'] || '',
          image_url: item['image_url'] || '',
          focus_category: item['Focus category'] || '',
          fba_reserved_quantity: formatNumber(item.fba_reserved_quantity),
          fba_fulfillable_quantity: formatNumber(item.fba_fulfillable_quantity),
          fba_total_inventory: formatNumber(item.fba_total_inventory),
          fba_sales_per_day: formatDecimal(item.fba_sales_per_day),
          fba_inventory_cover: formatNumber(item.fba_inventory_cover),
          reorder_quantity: formatNumber(item.reorder_quantity),
          status: item.status || 'OK',
          // Store raw values for proper sorting/filtering
          _raw_fba_reserved_quantity: item.fba_reserved_quantity || 0,
          _raw_fba_fulfillable_quantity: item.fba_fulfillable_quantity || 0,
          _raw_fba_total_inventory: item.fba_total_inventory || 0,
          _raw_fba_sales_per_day: item.fba_sales_per_day || 0,
          _raw_fba_inventory_cover: item.fba_inventory_cover || 0,
          _raw_reorder_quantity: item.reorder_quantity || 0,
        };

        // Add vendor data if available
        if (hasVendorData) {
          return {
            ...baseData,
            vendor_inventory: formatNumber(item.vendor_inventory),
            vendor_sales_per_day: formatDecimal(item.vendor_sales_per_day),
            vendor_inventory_cover: formatNumber(item.vendor_inventory_cover),
            _raw_vendor_inventory: item.vendor_inventory || 0,
            _raw_vendor_sales_per_day: item.vendor_sales_per_day || 0,
            _raw_vendor_inventory_cover: item.vendor_inventory_cover || 0,
          };
        }

        return baseData;
      } catch (error) {
        console.error(`Error transforming item at index ${index}:`, error, item);
        return null;
      }
    }).filter(item => item !== null); // Remove any null items from transformation errors
    
    console.log('Transformed data length:', transformed.length);
    if (transformed.length !== data.inventory_health.length) {
      console.warn(`⚠️ Data loss during transformation! Input: ${data.inventory_health.length}, Output: ${transformed.length}`);
    }
    
    return transformed;
  }, [data]);

  // Debug log for transformed data
  console.log('Transformed inventory data count:', transformedData.length);
  console.log('Current columns count:', columns.length);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Table
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <Typography variant="h6" color="text.secondary" className="ml-3">
            Loading inventory data...
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
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Table
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="error">
              Failed to load inventory data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error?.message || "Unknown error occurred"}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data state
  if (!transformedData || transformedData.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Table
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No inventory data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No inventory health data found for the specified parameters
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      {/* Header - matches ASIN Performance styling */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Table
          </h6>

          {/* Summary info */}
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">
              {transformedData.length} products • {salesDays} day sales analysis
              {data?.metadata?.has_vendor_data && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Seller + Vendor
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Lead time: {supplyChainLeadTime} days • Cover: {reorderCoverDays} days
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0">
        <AdvancedDataTable
          data={transformedData}
          columns={columns}
          onDataChange={(newData) => {
            // Handle data changes if needed for inventory health
            console.log("Inventory data changed:", newData);
          }}
          onColumnsChange={setColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
          initialSort={[
            {
              field: "reorder_quantity",
              direction: "desc",
            },
          ]}
        />

        {/* Footer info */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <Typography variant="body2" color="text.secondary">
            Inventory health analysis based on {salesDays}-day sales velocity.
            Reorder quantities calculated for {reorderCoverDays}-day coverage
            with {supplyChainLeadTime}-day supply chain lead time.
            {data?.metadata?.has_vendor_data && (
              <span className="font-medium text-blue-700">
                {" "}
                Includes both Seller and Vendor Central inventory data.
              </span>
            )}{" "}
            Use filters to identify products requiring immediate attention.
          </Typography>
        </div>
      </div>
    </div>
  );
}
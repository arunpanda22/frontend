"use client"

import { useMemo, useState } from 'react'
import { Typography, Alert } from '@mui/material'
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard'
import type { InventoryHealthItem } from '@/lib/api/services/dashboard.service'
import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'

interface InventoryHealthTableProps {
  salesDays?: number;
  reorderCoverDays?: number;
  supplyChainLeadTime?: number;
}

// Helper functions for formatting
function formatNumber(val: any): string {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '0';
  const num = Number(val);
  return num.toLocaleString();
}

function formatDecimal(val: any, digits = 2): string {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '0';
  const num = Number(val);
  return num.toFixed(digits);
}

export default function InventoryHealthTable({ 
  salesDays = 30,
  reorderCoverDays = 45,
  supplyChainLeadTime = 15 
}: InventoryHealthTableProps) {
  
  // Use API data with configurable parameters
  const { data, isLoading, isError, error } = useInventoryHealth({
    sales_days: salesDays,
    reorder_cover_days: reorderCoverDays,
    supply_chain_lead_time: supplyChainLeadTime
  });

  // Define columns for the AdvancedDataTable
  const tableColumns: ColumnDefinition[] = useMemo(() => [
    {
      field: 'asin',
      headerName: 'ASIN',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 160,  
      minWidth: 220,
      pinned: 'left'
    },
    {
      field: 'product_name',
      headerName: 'Product Name',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 450,  
      minWidth: 300,
      maxWidth: 600,
      pinned: 'left'
    },
    {
      field: 'focus_category',
      headerName: 'Focus Category',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'status',
      headerName: 'Status',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
      {
      field: 'sales_per_day',
      headerName: 'Sales/Day',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'reserved_quantity',
      headerName: 'Reserved Qty',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'fulfillable_quantity',
      headerName: 'Fulfillable Qty',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'inventory_cover',
      headerName: 'Inventory Cover (Days)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'reorder_quantity',
      headerName: 'Reorder Qty',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    }
  ], []);

  const [columns, setColumns] = useState<ColumnDefinition[]>(tableColumns);
  

  // Transform API data to match AdvancedDataTable format
  const transformedData: TableData[] = useMemo(() => {
    if (!data?.inventory_health || !Array.isArray(data.inventory_health)) {
      console.log('No valid inventory health data found');
      return [];
    }
    
    
    return data.inventory_health.map((item: InventoryHealthItem) => {
      return {
        asin: item.asin || '',
        product_name: item['Product Name'] || '',
        image_url: item['image_url'] || '',
        focus_category: item['Focus category'] || '',
        reserved_quantity: formatNumber(item.reserved_quantity),
        fulfillable_quantity: formatNumber(item.fulfillable_quantity),
        sales_per_day: formatDecimal(item['Sales/Day']),
        inventory_cover: formatNumber(item['Inventory Cover']),
        reorder_quantity: formatNumber(item.reorder_quantity),
        status: item.status || 'OK',
        // Store raw values for proper sorting/filtering
        _raw_reserved_quantity: item.reserved_quantity || 0,
        _raw_fulfillable_quantity: item.fulfillable_quantity || 0,
        _raw_sales_per_day: item['Sales/Day'] || 0,
        _raw_inventory_cover: item['Inventory Cover'] || 0,
        _raw_reorder_quantity: item.reorder_quantity || 0,
      };
    });
  }, [data]);

  // Debug log for transformed data
  // console.log('Transformed inventory data:', transformedData);

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
              {error?.message || 'Unknown error occurred'}
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
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Health Table
          </h6>
          
          {/* Summary info */}
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">
              {transformedData.length} products • {salesDays} day sales analysis
            </div>
            <div className="text-xs text-slate-500">
              Lead time: {supplyChainLeadTime} days • Cover: {reorderCoverDays} days
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <AdvancedDataTable
          data={transformedData}
          columns={columns}
          onDataChange={(newData) => {
            // Handle data changes if needed for inventory health
            console.log('Inventory data changed:', newData);
          }}
          onColumnsChange={setColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
          initialSort={[
            {
              field: 'reorder_quantity', 
              direction: 'desc' 
            }
          ]}
        />
        
        {/* Footer info */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <Typography variant="body2" color="text.secondary">
            Inventory health analysis based on {salesDays}-day sales velocity. Reorder quantities calculated for {reorderCoverDays}-day coverage 
            with {supplyChainLeadTime}-day supply chain lead time. Use filters to identify products requiring immediate attention.
          </Typography>
        </div>
      </div>
    </div>
  );
}
"use client"

import { useMemo, useState } from 'react'
import { Typography } from '@mui/material'
import { useAsinLiquidation } from '@/lib/hooks/queries/use-dashboard'
import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'

interface ExcessData {
  asin: string;
  FBA_Inv: number;
  Price: number;
  INV_90_365: number;
  product_name: string;
  'SalesQuantity/day': number | null;
}

export default function ASinExcess() {
  // Fetch excess inventory data from API
  const { data, isLoading, isError, error } = useAsinLiquidation(30);

  const excessData: TableData[] = useMemo(() => {
    if (!data?.excess_inventory) return [];
    return data.excess_inventory.map(item => ({
      asin: item.asin,
      FBA_Inv: item.FBA_Inv,
      Price: item.Price,
      INV_90_365: item.INV_90_365,
      product_name: item.product_name,
      'SalesQuantity/day': item.SalesQuantity_day || null,
    }));
  }, [data])

  // Define columns for the advanced data table
  const initialColumns: ColumnDefinition[] = useMemo(() => [
    {
      field: 'asin',
      headerName: 'ASIN',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 120,
      minWidth: 100,
      pinned: 'left'
    },
    {
      field: 'product_name',
      headerName: 'Product Name',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 250,
      minWidth: 180
    },
    {
      field: 'FBA_Inv',
      headerName: 'FBA Inventory',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'Price',
      headerName: 'Price (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 120,
      minWidth: 100
    },
    {
      field: 'INV_90_365',
      headerName: 'INV 90-365',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'SalesQuantity/day',
      headerName: 'Sales Qty/Day',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 150,
      minWidth: 130
    }
  ], []);

  const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(initialColumns);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <Typography variant="h6" color="text.secondary" className="ml-3">
            Loading excess inventory data...
          </Typography>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="error">
              Failed to load excess inventory data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error?.message || 'An error occurred while fetching data'}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data state
  if (!excessData || excessData.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No excess inventory data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No excess inventory data found for the selected period
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          ASIN Excess
        </h6>
      </div>
      {/* Table Content */}
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <AdvancedDataTable
          data={excessData}
          columns={tableColumns}
          onDataChange={(newData) => {
            // Handle data changes if needed
            console.log('Excess inventory data changed:', newData);
          }}
          onColumnsChange={setTableColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
          rowsPerPage={5}
        />
      </div>
    </div>
  );
}
"use client"

import { useMemo, useState } from 'react'
import { Typography } from '@mui/material'
import { useAsinLiquidation } from '@/lib/hooks/queries/use-dashboard'
import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'

interface LiquidationData {
  asin: string;
  FBA_Inv: number;
  Price: number;
  LT_Storage_Fee: number;
  '>5_months': number;
  product_name: string;
}

export default function ASinLiquidation() {
  // Fetch liquidation data from API
  const { data, isLoading, isError, error } = useAsinLiquidation(30);

  const liquidationData: TableData[] = useMemo(() => {
    if (!data?.liquidation) return [];
    return data.liquidation.map(item => ({
      asin: item.asin,
      FBA_Inv: item.FBA_Inv,
      Price: item.Price,
      LT_Storage_Fee: item.LT_Storage_Fee,
      '>5_months': item._5_months,
      product_name: item.product_name,
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
      width: 360,  
      minWidth: 250,
      maxWidth: 600
    },
    {
      field: 'FBA_Inv',
      headerName: 'FBA Inventory',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'Price',
      headerName: 'Price (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: 'LT_Storage_Fee',
      headerName: 'LT Storage Fee (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
    },
    {
      field: '>5_months',
      headerName: '>5 Months',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true 
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
            Loading liquidation data...
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
              Failed to load liquidation data
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
  if (!liquidationData || liquidationData.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          ASIN Liquidation
        </h6>
      </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No liquidation data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No liquidation data found for the selected period
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 md:p-6 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          ASIN Liquidation
        </h6>
      </div>
 
      {/* Table Content */}
      <div className="flex-1 min-h-0">
        <AdvancedDataTable
          data={liquidationData}
          columns={tableColumns}
          onDataChange={(newData) => {
            // Handle data changes if needed
            console.log('Liquidation data changed:', newData);
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
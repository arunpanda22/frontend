"use client"

import { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'
import { SearchQueryPerformanceData } from '../types/sqp.types'

interface SearchQueryPerformanceProps {
  data: SearchQueryPerformanceData[];
}

export default function SearchQueryPerformanceTable({ data }: SearchQueryPerformanceProps) {
  // Define table columns with advanced data table structure
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
      field: 'search_query',
      headerName: 'Search Query',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 250,
      minWidth: 200
    },
    {
      field: 'total_click_count',
      headerName: 'Total Clicks',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'asin_click_count',
      headerName: 'ASIN Clicks',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'total_median_click_price',
      headerName: 'Total Median Click Price (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 180
    },
    {
      field: 'asin_median_click_price',
      headerName: 'ASIN Median Click Price (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 180
    },
    {
      field: 'total_purchase_count',
      headerName: 'Total Purchases',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 150,
      minWidth: 130
    },
    {
      field: 'asin_purchase_count',
      headerName: 'ASIN Purchases',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 150,
      minWidth: 130
    },
    {
      field: 'total_conversion',
      headerName: 'Total CVR %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 130,
      minWidth: 110
    },
    {
      field: 'asin_conversion',
      headerName: 'ASIN CVR %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 130,
      minWidth: 110
    },
    {
      field: 'keyword_exists',
      headerName: 'Keyword Exists',
      type: 'boolean',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'conversion_greater_than_market',
      headerName: 'CVR > Market CVR',
      type: 'boolean',
      editable: false,
      sortable: true,
      filterable: true,
      width: 160,
      minWidth: 140
    }
  ], []);

  const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(initialColumns);

  // Transform data to match TableData interface
  const searchQueryData: TableData[] = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map((item: SearchQueryPerformanceData) => ({
      asin: item.asin || '',
      search_query: item.search_query || '',
      total_click_count: item.total_click_count || 0,
      asin_click_count: item.asin_click_count || 0,
      total_median_click_price: item.total_median_click_price || 0,
      asin_median_click_price: item.asin_median_click_price || 0,
      total_purchase_count: item.total_purchase_count || 0,
      asin_purchase_count: item.asin_purchase_count || 0,
      total_conversion: item.total_conversion || 0,
      asin_conversion: item.asin_conversion || 0,
      keyword_exists: item.keyword_exists || false,
      conversion_greater_than_market: item.conversion_greater_than_market || false,
    }));
  }, [data]);

  // Handle empty data state
  if (!searchQueryData || searchQueryData.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Search Query Performance Table
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No search query performance data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No data found for the selected criteria
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      {/* Header with same style as ASIN Performance table */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Search Query Performance Table
        </h6>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Showing {searchQueryData.length} search query records
        </Typography>
      </div>
      
      {/* Table Content */}
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <AdvancedDataTable
          data={searchQueryData}
          columns={tableColumns}
          onDataChange={(newData) => {
            // Handle data changes if needed
            console.log('Search query data changed:', newData);
          }}
          onColumnsChange={setTableColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
        />
      </div>
    </div>
  );
}
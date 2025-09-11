"use client"

import { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard'
import { AdvancedDataTable, type ColumnDefinition, type TableData  } from '@/components/dashboard/table/advanced-data-table'


export default function AsinPerformanceTable() {
  // Fetch ASIN performance data from API - use stable date values
  const dateParams = useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  const { asinSummary, isLoading, isError, error } = useAsinPerformanceData(dateParams);

  // State for managing table columns
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
      headerName: 'Name',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 300,
      minWidth: 200
    },
    {
      field: 'total_quantity',
      headerName: 'Total Quantity',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'total_sales',
      headerName: 'Total Sales (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 150,
      minWidth: 130
    },
    {
      field: 'sales_asp',
      headerName: 'Sales ASP (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    },
    {
      field: 'buybox',
      headerName: 'Buy Box %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 120,
      minWidth: 100
    },
    {
      field: 'organic_sales',
      headerName: 'Organic Sales (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 160,
      minWidth: 140
    },
    {
      field: 'conversion',
      headerName: 'Conversion %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 130,
      minWidth: 110
    },
    {
      field: 'acos',
      headerName: 'ACOS %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 110,
      minWidth: 90
    },
    {
      field: 'tacos',
      headerName: 'TACOS %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 110,
      minWidth: 90
    },
    {
      field: 'replacement_rate',
      headerName: 'Replacement Rate %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 160,
      minWidth: 140
    },
    {
      field: 'return_rate',
      headerName: 'Return Rate %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120
    }
  ], []);

  const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(initialColumns);

  // Transform API data - updated to match new service structure
  const asinData: TableData[] = useMemo(() => {
    console.log('Raw asinSummary data:', asinSummary); // Debug log
    
    const rawData = asinSummary?.data?.asin_summary;
    
    if (!rawData || !Array.isArray(rawData)) {
      console.log('No valid asin_summary data found');
      return [];
    }
    
    console.log('Processing asin_summary items:', rawData.length);
    
    return rawData.map((item: any) => {
      // Handle nested json property if it exists, otherwise use item directly
      const actualItem = item.json || item;
      
      return {
        asin: actualItem.asin || '',
        product_name: actualItem.product_name || '',
        image_url: actualItem.image_url || '',
        total_quantity: actualItem.total_units || 0,
        total_sales: actualItem.total_sales || 0,
        sales_asp: actualItem.asp || 0,
        buybox: actualItem.buy_box_percentage || 0,
        organic_sales: ((actualItem.total_sales || 0) - (actualItem.total_ad_sales || 0)).toFixed(2),
        conversion: actualItem.conversion_rate || 0,
        acos: actualItem.acos_percent !== undefined ? actualItem.acos_percent : null,
        tacos: actualItem.tacos_percent !== undefined ? actualItem.tacos_percent : null,
        replacement_rate: actualItem.replacement_rate !== undefined ? actualItem.replacement_rate : null,
        return_rate: actualItem.return_rate !== undefined ? actualItem.return_rate : null,
      };
    });
  }, [asinSummary]);

  // Get summary stats from the new API structure
  const summaryStats = useMemo(() => {
    return asinSummary?.data?.summary_stats || {};
  }, [asinSummary]);

  // Debug log for transformed data
  console.log('Transformed asinData:', asinData);
  console.log('Summary stats:', summaryStats);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            ASIN Performance Table
          </h6>
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
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            ASIN Performance Table
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="error">
              Failed to load ASIN performance data
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
  if (!asinData || asinData.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            ASIN Performance Table
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No ASIN performance data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No data found for the selected date range
            </Typography>
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="pre">
                  Debug: {JSON.stringify(asinSummary, null, 2)}
                </Typography>
              </Box>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      {/* Header with same style as Inventory Aging */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          ASIN Performance Table
        </h6>
      </div>
      
      {/* Table Content */}
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <AdvancedDataTable
          data={asinData}
          columns={tableColumns}
          onDataChange={(newData) => {
            // Handle data changes if needed
            console.log('Data changed:', newData);
          }}
          onColumnsChange={setTableColumns}
          showCheckboxColumn={false}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
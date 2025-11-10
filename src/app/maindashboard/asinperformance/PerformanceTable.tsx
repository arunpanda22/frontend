"use client"

import { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard'
import { AdvancedDataTable, type ColumnDefinition, type TableData  } from '@/components/dashboard/table/advanced-data-table'

interface AsinPerformanceTableProps {
  startDate: string;
  endDate: string;
  focusLevel?: 'high' | 'medium' | 'low' | 'all';
}

export default function AsinPerformanceTable({ 
  startDate, 
  endDate, 
  focusLevel = 'all' 
}: AsinPerformanceTableProps) {
  // Calculate period based on date range
  const period = useMemo(() => {
    if (!startDate || !endDate) return '30d';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Map days to period format
    if (diffDays <= 7) return '7d';
    if (diffDays <= 14) return '14d';
    if (diffDays <= 30) return '30d';
    if (diffDays <= 60) return '60d';
    if (diffDays <= 90) return '90d';
    return 'custom';
  }, [startDate, endDate]);

  // Fetch ASIN performance data from API with date range
  const { asinSummary, isLoading, isError, error } = useAsinPerformanceData({
    start_date: startDate,
    end_date: endDate,
    period: period,
    focus_level: focusLevel
  });

  // State for managing table columns - now simplified with auto-fit
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
      headerName: 'Name',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 480,  // Manual width for longer product names
      minWidth: 350,
      maxWidth: 600
    },
    {
      field: 'total_quantity',
      headerName: 'Total Quantity',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true  // Let the table auto-fit this column
    },
    {
      field: 'total_sales',
      headerName: 'Total Sales (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'sales_asp',
      headerName: 'Sales ASP (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'buybox',
      headerName: 'Buy Box % ',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'organic_sales',
      headerName: 'Organic Sales (₹)',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'conversion',
      headerName: 'Conversion %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'acos',
      headerName: 'ACOS %  ',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'tacos',
      headerName: 'TACOS %  ',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'replacement_rate',
      headerName: 'Replacement Rate %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    },
    {
      field: 'return_rate',
      headerName: 'Return Rate %',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      autoFitHeader: true
    }
  ], []);

  const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(initialColumns);

  // Transform API data - updated to match new service structure
  const asinData: TableData[] = useMemo(() => {    
    const rawData = asinSummary?.data?.asin_summary;
    
    if (!rawData || !Array.isArray(rawData)) {
      console.log('No valid asin_summary data found');
      return [];
    }
    
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
        acos: actualItem.acos_percent || "-",
        tacos:  actualItem.tacos_percent || "-",
        replacement_rate:  actualItem.replacement_rate  || "-",
        return_rate: actualItem.return_rate || "-",
      };
    });
  }, [asinSummary]);

  // Get summary stats from the new API structure
  const summaryStats = useMemo(() => {
    return asinSummary?.data?.summary_stats || {};
  }, [asinSummary]);

  // Format date range for display
  const dateRangeDisplay = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate).toLocaleDateString('en-GB');
    const end = new Date(endDate).toLocaleDateString('en-GB');
    return `${start} - ${end}`;
  }, [startDate, endDate]);

  // Handle loading state
  if (isLoading) {
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
            <Typography variant="h6" color="text.secondary">
              No ASIN performance data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No data found for the selected date range: {dateRangeDisplay}
            </Typography>
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="pre">
                  Debug: {JSON.stringify({ startDate, endDate, period, asinSummary }, null, 2)}
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
      {/* Header with date range display */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            ASIN Performance Table
          </h6>
          <div className="flex items-center gap-4">
            {dateRangeDisplay && (
              <span className="text-sm text-slate-600 font-medium">
                📅 {dateRangeDisplay}
              </span>
            )}
            {summaryStats && Object.keys(summaryStats).length > 0 && (
              <span className="text-sm text-slate-500">
                {asinData.length} ASINs
              </span>
            )}
          </div>
        </div>
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
          initialSort={[
            {
              field: 'total_sales', 
              direction: 'desc' 
            }
          ]}
        />
      </div>
    </div>
  );
}
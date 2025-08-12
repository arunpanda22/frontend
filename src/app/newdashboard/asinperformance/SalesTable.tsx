"use client"

import { useMemo } from 'react'
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table'
import { Box, Typography } from '@mui/material'
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard'

// Define the type for the ASIN trend data
interface AsinTrendData {
  ASIN: string;
  'Product Name': string;
  // Metrics for each period
  [key: string]: string | number;
}

// Helper to parse and format numbers - with null safety
function formatNumber(val: any, digits = 2) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '-';
  const num = Number(val);
  return num.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(val: any, digits = 2) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '-';
  const num = Number(val);
  return num.toFixed(digits) + '%';
}

const periods = [
  { key: '14 days', label: '14DAYS' },
  { key: '26 June', label: '26 JUNE' },
  { key: '30 days', label: '30DAYS' },
  { key: '60 days', label: '60DAYS' },
  { key: '7 days', label: '7DAYS' },
];

const metrics = [
  { key: 'Sales', label: 'Sales', format: formatNumber, trendKey: 'Sales_Trend' },
  { key: 'Orders', label: 'Orders', format: formatNumber, trendKey: 'Orders_Trend' },
  { key: 'Cost', label: 'Cost', format: formatNumber, trendKey: 'Cost_Trend' },
  { key: 'Conversion %', label: 'Conversion %', format: formatPercent, trendKey: 'Conversion %_Trend' },
  { key: 'Sessions', label: 'Sessions', format: formatNumber, trendKey: 'Sessions_Trend' },
  { key: 'TACOS %', label: 'TACOS %', format: formatPercent, trendKey: 'TACOS %_Trend' },
];

export default function AsinSalesTrendTable() {
  // Fetch ASIN performance data from API - use stable date values
  const dateParams = useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  const { targetingAnalysis, isLoading, isError, error } = useAsinPerformanceData(dateParams);

  // Transform API data to match existing interface
  const asinData: AsinTrendData[] = useMemo(() => {
    if (!targetingAnalysis?.data) return [];
    
    // Handle the targeting analysis structure - flatten the nested groups
    const flattenedData: any[] = [];
    
    // Check if data is the expected targeting analysis structure
    if (typeof targetingAnalysis.data === 'object' && !Array.isArray(targetingAnalysis.data)) {
      Object.entries(targetingAnalysis.data).forEach(([groupName, groupData]: [string, any]) => {
        if (groupData.items && Array.isArray(groupData.items)) {
          groupData.items.forEach((item: any) => {
            flattenedData.push({
              asin: item.targeting_type || 'N/A',
              product_name: `${groupName} - ${item.targeting_type}`,
              total_sales: item.sales || 0,
              total_units: item.units_sold || 0,
              sales_trend: []
            });
          });
        }
      });
    } else if (Array.isArray(targetingAnalysis.data)) {
      // If it's already an array, use it directly
      flattenedData.push(...targetingAnalysis.data);
    }
    
    return flattenedData.map(item => ({
      ASIN: item.asin,
      'Product Name': item.product_name,
      // Use available data from sales_trend or fallback to total values
      'Sales_14 days': item.total_sales || 0,
      'Sales_26 June': item.total_sales || 0,
      'Sales_30 days': item.total_sales || 0,
      'Sales_60 days': item.total_sales || 0,
      'Sales_7 days': item.total_sales || 0,
      'Orders_14 days': item.total_units || 0,
      'Orders_26 June': item.total_units || 0,
      'Orders_30 days': item.total_units || 0,
      'Orders_60 days': item.total_units || 0,
      'Orders_7 days': item.total_units || 0,
      'Cost_14 days': 0, // Not available in current API structure
      'Cost_26 June': 0,
      'Cost_30 days': 0,
      'Cost_60 days': 0,
      'Cost_7 days': 0,
      'Conversion %_14 days': 0, // Not available in current API structure
      'Conversion %_26 June': 0,
      'Conversion %_30 days': 0,
      'Conversion %_60 days': 0,
      'Conversion %_7 days': 0,
      'Sessions_14 days': 0, // Not available in current API structure
      'Sessions_26 June': 0,
      'Sessions_30 days': 0,
      'Sessions_60 days': 0,
      'Sessions_7 days': 0,
      'TACOS %_14 days': 0, // Not available in current API structure
      'TACOS %_26 June': 0,
      'TACOS %_30 days': 0,
      'TACOS %_60 days': 0,
      'TACOS %_7 days': 0,
      // Add trend indicators based on sales_trend
      'Sales_Trend': item.sales_trend?.length > 0 ? 
        (item.sales_trend[item.sales_trend.length - 1]?.trend_direction === 'up' ? '↑' : '↓') : '→',
      'Orders_Trend': '→',
      'Cost_Trend': '→',
      'Conversion %_Trend': '→',
      'Sessions_Trend': '→',
      'TACOS %_Trend': '→',
    }));
  }, [targetingAnalysis]);

  // Handle loading state
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading targeting analysis data...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (isError || !asinData || asinData.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Failed to load targeting analysis data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error?.message || 'No data available'}
        </Typography>
      </Box>
    );
  }

  const columns = useMemo<MRT_ColumnDef<any>[]>(() => [
    {
      accessorKey: 'ASIN',
      header: 'ASIN',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      columnFilterModeOptions: [
        'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      // Ensure we always return a string
      Cell: ({ row }) => row.original.ASIN || '',
    },
    {
      accessorKey: 'Product Name',
      header: 'Product Name',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      columnFilterModeOptions: [
        'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      // Ensure we always return a string
      Cell: ({ row }) => row.original['Product Name'] || '',
    },
    ...metrics.flatMap(metric => [
      ...periods.map(period => ({
        accessorKey: `${metric.key}_${period.key}`,
        header: `${metric.label} (${period.label})`,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between' as const,
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 
          'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ row }: any) => {
          const value = row.original[`${metric.key}_${period.key}`];
          return metric.format(value);
        },
      })),
      {
        accessorKey: `${metric.key}_Trend`,
        header: `${metric.label} Trend`,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'fuzzy' as const,
        columnFilterModeOptions: [
          'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ row }: any) => {
          const trend = row.original[`${metric.key}_Trend`] || '-';
          let color = undefined;
          if (typeof trend === 'string') {
            if (trend.includes('↑')) color = 'success.main';
            else if (trend.includes('↓')) color = 'error.main';
          }
          return (
            <Typography component="span" sx={{ color: color || 'inherit' }}>
              {trend}
            </Typography>
          );
        },
      }
    ]),
  ], []);

  const table = useMaterialReactTable({
    columns,
    data: asinData,
    enableColumnFilterModes: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableSorting: true, // Changed from false to true for consistency
    enablePagination: true,
    enableRowSelection: false,
    enableColumnResizing: true,
    enableColumnPinning: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableColumnDragging: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
    // Add default values to prevent undefined states
    getRowId: (row, index) => `${row.ASIN || index}`, // Ensure unique row IDs
    muiTableContainerProps: {
      sx: {
        maxHeight: 'calc(100vh - 200px)',
        width: '100%',
        overflowX: 'auto',
      },
    },
    muiTableHeadCellProps: (column) => ({
      sx: column?.column?.getIsPinned?.()
        ? {
            backgroundColor: '#fff',
            color: '#111',
            fontWeight: 'bold',
            opacity: 1,
            borderRight: '2px solid #e5e7eb',
            zIndex: 1301,
          }
        : {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 'bold',
          },
    }),
    muiTableBodyCellProps: {
      sx: {
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
      },
    },
    muiTableProps: {
      sx: {
        tableLayout: 'auto',
        width: '100%',
        minWidth: 1200,
      },
    },
    initialState: {
      density: 'compact',
      pagination: { pageSize: 20, pageIndex: 0 },
      sorting: [{ id: 'Sales_7 days', desc: true }],
      columnPinning: {
        left: ['ASIN', 'Product Name'],
        right: [],
      },
      showColumnFilters: true,
      // Ensure all state values are defined
      columnFilters: [],
      globalFilter: '',
    },
    // Add state management to prevent undefined values
    state: {
      // You can add controlled state here if needed
    },
    // Add default sorting state
    defaultColumn: {
      minSize: 100,
      maxSize: 400,
      size: 150,
    },
    displayColumnDefOptions: {
      'mrt-row-select': {
        size: 50,
        enablePinning: true,
      },
    },
    muiTablePaperProps: {
      elevation: 3,
      sx: {
        borderRadius: 2,
      },
    },
  });

  return (
    <Box sx={{ width: '100%' }}>
      <MaterialReactTable table={table} />
    </Box>
  );
}
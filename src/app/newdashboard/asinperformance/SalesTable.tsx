"use client"

import { useMemo } from 'react'
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table'
import { Box, Typography } from '@mui/material'
import rawAsinData from '../../../../public/dataset/Asin_Sales_performance_trend.json'

// Define the type for the new ASIN trend data
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
  const asinData = rawAsinData as AsinTrendData[];

  // Prepare data for the table with proper null handling
  const tableData = useMemo(() => {
    if (!asinData || !Array.isArray(asinData)) return [];
    
    return asinData.map(item => {
      const row: any = {
        ASIN: item.ASIN || '',
        'Product Name': item['Product Name'] || '',
      };
      
      // Add period data with fallbacks
      periods.forEach(period => {
        metrics.forEach(metric => {
          const key = `${metric.key}_${period.key}`;
          row[key] = item[key] ?? null; // Use null instead of undefined
        });
      });
      
      // Add trend data with fallbacks
      metrics.forEach(metric => {
        const trendKey = `${metric.key}_Trend`;
        row[trendKey] = item[trendKey] || '-';
      });
      
      return row;
    });
  }, [asinData]);

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
    data: tableData,
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

  // Add error boundary for the table
  if (!tableData || tableData.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <MaterialReactTable table={table} />
    </Box>
  );
}
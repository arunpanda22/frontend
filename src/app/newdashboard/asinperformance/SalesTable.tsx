"use client"

import { useMemo } from 'react'
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table'
import { Box, Typography } from '@mui/material'
import rawAsinData from '../../../../public/dataset/ Asin_Sales_performance_trend.json'

// Define the type for the new ASIN trend data
interface AsinTrendData {
  ASIN: string;
  'Product Name': string;
  // Metrics for each period
  [key: string]: string | number;
}

// Helper to parse and format numbers
function formatNumber(val: any, digits = 2) {
  if (val === null || val === undefined || isNaN(Number(val))) return '-';
  return Number(val).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatPercent(val: any, digits = 2) {
  if (val === null || val === undefined || isNaN(Number(val))) return '-';
  return Number(val).toFixed(digits) + '%';
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

  // Prepare data for the table
  const tableData = useMemo(() => asinData.map(item => {
    const row: any = {
      ASIN: item.ASIN,
      'Product Name': item['Product Name'],
    };
    periods.forEach(period => {
      metrics.forEach(metric => {
        row[`${metric.key}_${period.key}`] = item[`${metric.key}_${period.key}`];
      });
    });
    metrics.forEach(metric => {
      row[`${metric.key}_Trend`] = item[`${metric.key}_Trend`] || '-';
    });
    return row;
  }), [asinData]);

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
    },
    ...metrics.flatMap(metric => [
      ...periods.map(period => ({
        accessorKey: `${metric.key}_${period.key}`,
        header: `${metric.label} (${period.label})`,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ row }: any) => metric.format(row.original[`${metric.key}_${period.key}`]),
      })),
      {
        accessorKey: `${metric.key}_Trend`,
        header: `${metric.label} Trend`,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'fuzzy',
        columnFilterModeOptions: [
          'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ row }: any) => {
          const trend = row.original[`${metric.key}_Trend`] || '-';
          let color = undefined;
          if (trend.includes('↑')) color = 'success.main';
          else if (trend.includes('↓')) color = 'error.main';
          return (
            <span style={{ color: color ? undefined : '#fff' }}>
              <Typography component="span" sx={{ color }}>{trend}</Typography>
            </span>
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
    enableSorting: false,
    enablePagination: true,
    enableRowSelection: false,
    enableColumnResizing: true,
    enableColumnPinning: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableColumnDragging: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
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

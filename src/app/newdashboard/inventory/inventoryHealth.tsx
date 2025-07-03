"use client"

import { useMemo, useState, useEffect } from 'react'
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table'
import { Box, Typography, Button, Grid, Card, CardContent, Chip } from '@mui/material'
import { ViewList, ViewModule } from '@mui/icons-material'

interface InventoryData {
  asin: string
  'Product Name': string
  'Focus category': string
  reserved_quantity: number
  fulfillable_quantity: number
  'Sales/Day': number
  'Inventory Cover': number
  reorder_quantity: number
  OOS_Alert: string
}

export default function InventoryHealthTable() {
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/dataset/ inventory_health_30d_avg.json');
        const raw = await res.json();
        const mapped = (raw as any[]).map(item => ({
          asin: item.asin,
          'Product Name': item['Product Name'],
          'Focus category': item['Focus category'],
          reserved_quantity: Number(item.reserved_quantity),
          fulfillable_quantity: Number(item.fulfillable_quantity),
          'Sales/Day': Number(item['Sales/Day']),
          'Inventory Cover': Number(item['Inventory Cover']),
          reorder_quantity: Number(item.reorder_quantity),
          OOS_Alert: item.OOS_Alert,
        }));
        setInventoryData(mapped);
      } catch (e) {
        setInventoryData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const columns = useMemo<MRT_ColumnDef<InventoryData>[]>(() => [
    {
      accessorKey: 'asin',
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
    {
      accessorKey: 'Focus category',
      header: 'Focus Category',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      columnFilterModeOptions: [
        'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
    },
    {
      accessorKey: 'reserved_quantity',
      header: 'Reserved Qty',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'between',
      columnFilterModeOptions: [
        'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      filterVariant: 'range',
      muiFilterTextFieldProps: {
        type: 'number',
      },
    },
    {
      accessorKey: 'fulfillable_quantity',
      header: 'Fulfillable Qty',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'between',
      columnFilterModeOptions: [
        'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      filterVariant: 'range',
      muiFilterTextFieldProps: {
        type: 'number',
      },
    },
    {
      accessorKey: 'Sales/Day',
      header: 'Sales/Day',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'between',
      columnFilterModeOptions: [
        'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      filterVariant: 'range',
      muiFilterTextFieldProps: {
        type: 'number',
      },
    },
    {
      accessorKey: 'Inventory Cover',
      header: 'Inventory Cover',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'between',
      columnFilterModeOptions: [
        'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      filterVariant: 'range',
      muiFilterTextFieldProps: {
        type: 'number',
      },
    },
    {
      accessorKey: 'reorder_quantity',
      header: 'Reorder Qty',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'between',
      columnFilterModeOptions: [
        'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
      filterVariant: 'range',
      muiFilterTextFieldProps: {
        type: 'number',
      },
    },
    {
      accessorKey: 'OOS_Alert',
      header: 'OOS Alert',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      columnFilterModeOptions: [
        'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
      ],
    },
  ], [])

  if (loading) {
    return <div className="w-full flex justify-center items-center min-h-[200px] text-lg text-blue-700">Loading inventory data...</div>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <MaterialReactTable
        columns={columns}
        data={inventoryData}
        enableColumnFilters
        enableGlobalFilter
        enableSorting
        enablePagination
        enableRowSelection
        enableColumnResizing
        enableColumnPinning
        enableDensityToggle
        enableFullScreenToggle
        enableColumnDragging
        enableStickyHeader
        enableStickyFooter
        enableColumnFilterModes={true}
        muiTableContainerProps={{
          sx: {
            maxHeight: 'calc(100vh - 200px)',
            width: '100%',
            overflowX: 'auto',
          },
        }}
        muiTableHeadCellProps={(column) => ({
          sx: {
            backgroundColor: 'primary.main',
            color: column?.column?.id === 'asin' ? 'black' : 'primary.contrastText',
            fontWeight: 'bold',
          },
        })}
        muiTableBodyCellProps={{
          sx: {
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
          },
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'auto',
            width: '100%',
            minWidth: 900,
          },
        }}
        initialState={{
          density: 'compact',
          pagination: { pageSize: 15, pageIndex: 0 },
          sorting: [{ id: 'reorder_quantity', desc: true }],
          columnPinning: {
            left: ['mrt-row-select', 'asin',],
            right: [],
          },
        }}
        displayColumnDefOptions={{
          'mrt-row-select': {
            size: 50,
            enablePinning: true,
          },
        }}
        muiTablePaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
          },
        }}
      />
    </Box>
  )
}

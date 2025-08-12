"use client"

import { useMemo } from 'react'
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table'
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Alert } from '@mui/material'
import { ViewList, ViewModule } from '@mui/icons-material'
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard'
import type { InventoryHealthItem } from '@/lib/api/services/dashboard.service'

// Map API response to table format
type InventoryData = {
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
  // Use API data instead of static JSON
  const { data, isLoading, isError, error } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  })

  // Transform API data to match table format
  const inventoryData: InventoryData[] = useMemo(() => {
    if (!data?.inventory_health) return []
    
    return data.inventory_health.map((item: any) => ({
      asin: item.asin,
      'Product Name': item['Product Name'],
      'Focus category': item['Focus category'],
      reserved_quantity: item.reserved_quantity,
      fulfillable_quantity: item.fulfillable_quantity,
      'Sales/Day': item['Sales/Day'],
      'Inventory Cover': item['Inventory Cover'],
      reorder_quantity: item.reorder_quantity,
      OOS_Alert: item.OOS_Alert,
    }))
  }, [data])

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

  // Handle loading and error states
  if (isLoading) {
    return <div className="w-full flex justify-center items-center min-h-[200px] text-lg text-blue-700">Loading inventory data...</div>;
  }

  if (isError) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Alert severity="error">
          Failed to load inventory data: {error?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
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

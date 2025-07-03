"use client"

import { useMemo, useState } from 'react'
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table'
import { Box, Typography, Button, Grid, Card, CardContent, Chip } from '@mui/material'
import { ViewList, ViewModule } from '@mui/icons-material'
import rawExcessData from '../../../../public/dataset/ ASIN_Liquidation_Report_Liquidation_excess.json'

interface ExcessData {
  asin: string;
  FBA_Inv: number;
  Price: number;
  INV_90_365: number;
  product_name: string;
  'SalesQuantity/day': number | null;
}

export default function ASinExcess() {
  const excessData = useMemo(() => (rawExcessData as any[]).map(item => ({
    asin: item.asin,
    FBA_Inv: Number(item.FBA_Inv),
    Price: Number(item.Price),
    INV_90_365: Number(item.INV_90_365),
    product_name: item.product_name,
    'SalesQuantity/day': item['SalesQuantity/day'] !== null ? Number(item['SalesQuantity/day']) : null,
  })), [])

  const columns = useMemo<MRT_ColumnDef<ExcessData>[]>(() => [
    { accessorKey: 'asin', header: 'ASIN', enableSorting: true, enableColumnFilter: true, filterFn: 'fuzzy' },
    { accessorKey: 'FBA_Inv', header: 'FBA Inv', enableSorting: true, enableColumnFilter: true, filterFn: 'between', filterVariant: 'range', muiFilterTextFieldProps: { type: 'number' } },
    { accessorKey: 'Price', header: 'Price', enableSorting: true, enableColumnFilter: true, filterFn: 'between', filterVariant: 'range', muiFilterTextFieldProps: { type: 'number' } },
    { accessorKey: 'INV_90_365', header: 'INV 90-365', enableSorting: true, enableColumnFilter: true, filterFn: 'between', filterVariant: 'range', muiFilterTextFieldProps: { type: 'number' } },
    { accessorKey: 'product_name', header: 'Product Name', enableSorting: true, enableColumnFilter: true, filterFn: 'fuzzy' },
    { accessorKey: 'SalesQuantity/day', header: 'Sales Qty/Day', enableSorting: true, enableColumnFilter: true, filterFn: 'between', filterVariant: 'range', muiFilterTextFieldProps: { type: 'number' } },
  ], [])

  return (
    <Box sx={{ width: '100%' }}>
      <MaterialReactTable
        columns={columns}
        data={excessData}
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
          pagination: { pageSize: 2, pageIndex: 0 },
          sorting: [{ id: 'FBA_Inv', desc: true }],
          columnPinning: {
            left: ['mrt-row-select', 'asin'],
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

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
import rawAsinData from '../../../../public/dataset/ ASIN_Performance_2025-03-30_to_2025-06-301.json'

// Define the type for ASIN data
interface AsinData {
  asin: string
  product_name: string
  'Total Quantity': number
  'Total Sales': number
  'Sales ASP': number
  BuyBox: number
  'Organic Sales': number
  Conversion: number
  ACOS: number | null
  TACOS: number | null
  'Replacement Rate': number | null
  'Return Rate': number | null
}

// Helper to parse string values and percentages to numbers
function parseAsinData(raw: any[]): AsinData[] {
  return raw.map((item) => ({
    asin: item.asin,
    product_name: item.product_name,
    'Total Quantity': Number(String(item['Total Quantity']).replace(/,/g, '')),
    'Total Sales': Number(String(item['Total Sales']).replace(/,/g, '')),
    'Sales ASP': Number(String(item['Sales ASP']).replace(/,/g, '')),
    BuyBox: parseFloat(String(item['BuyBox']).replace('%', '')),
    'Organic Sales': parseFloat(String(item['Organic Sales']).replace('%', '')) / 100,
    Conversion: parseFloat(String(item['Conversion']).replace('%', '')) / 100,
    ACOS: isNaN(parseFloat(String(item['ACOS']).replace('%', ''))) ? null : parseFloat(String(item['ACOS']).replace('%', '')) / 100,
    TACOS: isNaN(parseFloat(String(item['TACOS']).replace('%', ''))) ? null : parseFloat(String(item['TACOS']).replace('%', '')) / 100,
    'Replacement Rate': isNaN(parseFloat(String(item['Replacement Rate']).replace('%', ''))) ? null : parseFloat(String(item['Replacement Rate']).replace('%', '')) / 100,
    'Return Rate': isNaN(parseFloat(String(item['Return Rate']).replace('%', ''))) ? null : parseFloat(String(item['Return Rate']).replace('%', '')) / 100,
  }));
}

export default function AsinPerformanceTable() {
  const asinData = useMemo(() => parseAsinData(rawAsinData as any[]), []);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const columns = useMemo<MRT_ColumnDef<AsinData>[]>(
    () => [
      {
        accessorKey: 'asin',
        header: 'ASIN',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'fuzzy',
        columnFilterModeOptions: [
          'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography sx={{ color: 'black', fontWeight: 'medium' }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: 'product_name',
        header: 'Product Name',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'fuzzy',
        columnFilterModeOptions: [
          'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Box sx={{ maxWidth: 280 }}>
            <Typography variant="body2" sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              fontSize: '0.875rem'
            }}>
              {cell.getValue<string>()}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'Total Quantity',
        header: 'Total Quantity',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'Total Sales',
        header: 'Total Sales',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            ₹{cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'Sales ASP',
        header: 'Sales ASP',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2">
            ₹{cell.getValue<number>().toFixed(2)}
          </Typography>
        ),
      },
      {
        accessorKey: 'BuyBox',
        header: 'Buy Box %',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ 
            color: cell.getValue<number>() >= 90 ? 'success.main' : 
                   cell.getValue<number>() >= 70 ? 'warning.main' : 'error.main'
          }}>
            {cell.getValue<number>().toFixed(2)}%
          </Typography>
        ),
      },
      {
        accessorKey: 'Organic Sales',
        header: 'Organic Sales',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            ₹{cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'Conversion',
        header: 'Conversion Rate',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2">
            {(cell.getValue<number>() * 100).toFixed(2)}%
          </Typography>
        ),
      },
      {
        accessorKey: 'ACOS',
        header: 'ACOS',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()
          if (value === null) return <Typography variant="body2" color="text.secondary">-</Typography>
          return (
            <Typography variant="body2" sx={{ 
              color: value <= 0.3 ? 'success.main' : 
                     value <= 0.5 ? 'warning.main' : 'error.main'
            }}>
              {(value * 100).toFixed(2)}%
            </Typography>
          )
        },
      },
      {
        accessorKey: 'TACOS',
        header: 'TACOS',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()
          if (value === null) return <Typography variant="body2" color="text.secondary">-</Typography>
          return (
            <Typography variant="body2" sx={{ 
              color: value <= 0.1 ? 'success.main' : 
                     value <= 0.2 ? 'warning.main' : 'error.main'
            }}>
              {(value * 100).toFixed(2)}%
            </Typography>
          )
        },
      },
      {
        accessorKey: 'Replacement Rate',
        header: 'Replacement Rate',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()
          if (value === null) return <Typography variant="body2" color="text.secondary">-</Typography>
          return (
            <Typography variant="body2" sx={{ 
              color: value <= 0.05 ? 'success.main' : 
                     value <= 0.1 ? 'warning.main' : 'error.main'
            }}>
              {(value * 100).toFixed(2)}%
            </Typography>
          )
        },
      },
      {
        accessorKey: 'Return Rate',
        header: 'Return Rate',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => {
          const value = cell.getValue<number | null>()
          if (value === null) return <Typography variant="body2" color="text.secondary">-</Typography>
          return (
            <Typography variant="body2" sx={{ 
              color: value <= 0.05 ? 'success.main' : 
                     value <= 0.1 ? 'warning.main' : 'error.main'
            }}>
              {(value * 100).toFixed(2)}%
            </Typography>
          )
        },
      },
    ],
    []
  )

  return (
    <Box sx={{ height: '100vh', width: '100%',  }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
       
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
         
        </Box>
      </Box>
      <MaterialReactTable
        columns={columns}
        data={asinData as AsinData[]}
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
        state={{
          columnFilters,
          globalFilter,
          sorting,
          pagination,
        }}
        onColumnFiltersChange={setColumnFilters}
        onGlobalFilterChange={setGlobalFilter}
        onSortingChange={setSorting}
        onPaginationChange={setPagination}
        initialState={{
          density: 'compact',
          pagination: { pageSize: 20, pageIndex: 0 },
          sorting: [{ id: 'Total Sales', desc: true }],
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
        renderTopToolbarCustomActions={({ table }) => (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </Typography>
          </Box>
        )}
        renderBottomToolbarCustomActions={({ table }) => (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Total: {table.getFilteredRowModel().rows.length} products
            </Typography>
          </Box>
        )}
      />
    </Box>
  )
}

// src/app/newdashboard/searchqueryperformance/components/searchqueryperformancetable.tsx
"use client"

import { useMemo, useState } from 'react'
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table'
import { Box, Typography, Chip } from '@mui/material'
import { SearchQueryPerformanceData } from '../types/sqp.types'

interface SearchQueryPerformanceProps {
  data: SearchQueryPerformanceData[];
}

export default function SearchQueryPerformanceTable({ data }: SearchQueryPerformanceProps) {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const columns = useMemo<MRT_ColumnDef<SearchQueryPerformanceData>[]>(
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
          <Typography sx={{ color: 'black', fontWeight: 'medium', fontSize: '0.875rem' }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: 'search_query',
        header: 'Search Query',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'fuzzy',
        columnFilterModeOptions: [
          'fuzzy', 'contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Box sx={{ maxWidth: 200 }}>
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
        accessorKey: 'total_click_count',
        header: 'Total Clicks',
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
        accessorKey: 'asin_click_count',
        header: 'ASIN Clicks',
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
        accessorKey: 'total_median_click_price',
        header: 'Total Median Click Price',
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
        accessorKey: 'asin_median_click_price',
        header: 'ASIN Median Click Price',
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
        accessorKey: 'total_purchase_count',
        header: 'Total Purchases',
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
        accessorKey: 'asin_purchase_count',
        header: 'ASIN Purchases',
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
        accessorKey: 'total_conversion',
        header: 'Total CVR %',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ 
            color: cell.getValue<number>() >= 10 ? 'success.main' : 
                   cell.getValue<number>() >= 5 ? 'warning.main' : 'error.main'
          }}>
            {cell.getValue<number>().toFixed(2)}%
          </Typography>
        ),
      },
      {
        accessorKey: 'asin_conversion',
        header: 'ASIN CVR %',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'between',
        columnFilterModeOptions: [
          'between', 'betweenInclusive', 'greaterThan', 'greaterThanOrEqualTo', 'lessThan', 'lessThanOrEqualTo', 'equals', 'notEquals', 'empty', 'notEmpty'
        ],
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ 
            color: cell.getValue<number>() >= 10 ? 'success.main' : 
                   cell.getValue<number>() >= 5 ? 'warning.main' : 'error.main'
          }}>
            {cell.getValue<number>().toFixed(2)}%
          </Typography>
        ),
      },
      {
        accessorKey: 'keyword_exists',
        header: 'Keyword Exists',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'equals',
        columnFilterModeOptions: ['equals', 'notEquals'],
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? 'Yes' : 'No'}
            color={cell.getValue<boolean>() ? 'success' : 'error'}
            size="small"
            variant="filled"
            sx={{ fontSize: '0.75rem', minWidth: '60px' }}
          />
        ),
      },
      {
        accessorKey: 'conversion_greater_than_market',
        header: 'CVR > Market CVR',
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: 'equals',
        columnFilterModeOptions: ['equals', 'notEquals'],
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? 'Yes' : 'No'}
            color={cell.getValue<boolean>() ? 'success' : 'error'}
            size="small"
            variant="filled"
            sx={{ fontSize: '0.75rem', minWidth: '60px' }}
          />
        ),
      },
    ],
    []
  )

  return (
    <Box sx={{ width: '100%' }}>
      {/* Debug info */}
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Showing {data.length} records
      </Typography>
      
      <MaterialReactTable
        columns={columns}
        data={data}
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
            maxHeight: '600px',
            width: '100%',
            overflowX: 'auto',
          },
        }}
        muiTableHeadCellProps={(column) => ({
          sx: {
            backgroundColor: 'primary.main',
            color: column?.column?.id === 'asin' ? 'black' : 'primary.contrastText',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          },
        })}
        muiTableBodyCellProps={{
          sx: {
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
            fontSize: '0.875rem'
          },
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'auto',
            width: '100%',
            minWidth: 1400, // Increased for more columns
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
          sorting: [{ id: 'total_impression', desc: true }],
          columnPinning: {
            left: ['mrt-row-select', 'asin', 'search_query'],
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
              Total: {table.getFilteredRowModel().rows.length} search queries
            </Typography>
          </Box>
        )}
      />
    </Box>
  )
}
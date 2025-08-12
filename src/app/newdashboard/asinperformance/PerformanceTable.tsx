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
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard'

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

export default function AsinPerformanceTable() {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  // Fetch ASIN performance data from API - use stable date values
  const dateParams = useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  const { asinSummary, targetingAnalysis, isLoading, isError, error } = useAsinPerformanceData(dateParams);

  // Transform API data to match existing interface - use targeting analysis since ASIN summary has zero sales
  const asinData: AsinData[] = useMemo(() => {
    // Use ASIN summary if it has real data, otherwise fall back to targeting analysis
    if (asinSummary?.data?.data) {
      const extractedData = asinSummary.data.data.map((item: any) => {
        const actualItem = item.json || item;
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          'Total Quantity': actualItem.total_units,
          'Total Sales': actualItem.total_sales,
          'Sales ASP': actualItem.total_sales / Math.max(actualItem.total_units, 1),
          BuyBox: actualItem.buy_box_percentage,
          'Organic Sales': actualItem.total_sales - (actualItem.total_ad_sales || 0),
          Conversion: actualItem.conversion_rate,
          ACOS: actualItem.acos_percent,
          TACOS: actualItem.tacos_percent,
          'Replacement Rate': actualItem.replacement_rate,
          'Return Rate': actualItem.return_rate,
        };
      });
      
      if (extractedData.some((item: any) => item['Total Sales'] > 0)) {
        return extractedData;
      }
    }
    
    // Fallback to targeting analysis data
    if (!targetingAnalysis?.data) return [];
    
    const transformedData: AsinData[] = [];
    Object.entries(targetingAnalysis.data).forEach(([groupName, groupData]: [string, any]) => {
      if (groupData.items && Array.isArray(groupData.items)) {
        groupData.items.forEach((item: any) => {
          transformedData.push({
            asin: `${groupName}-${item.targeting_type}`,
            product_name: `${groupName} - ${item.targeting_type}`,
            'Total Quantity': item.units_sold || 0,
            'Total Sales': item.sales || 0,
            'Sales ASP': item.sales && item.units_sold ? item.sales / item.units_sold : 0,
            BuyBox: 100, // Default since not available in targeting data
            'Organic Sales': 0, // Assume zero organic sales for ad targeting data
            Conversion: item.conversion_rate_percent || 0,
            ACOS: item.acos_percent || 0,
            TACOS: item.acos_percent || 0, // Use ACOS as proxy
            'Replacement Rate': 0, // Not available in targeting data
            'Return Rate': 0, // Not available in targeting data
          });
        });
      }
    });
    
    return transformedData;
  }, [asinSummary, targetingAnalysis]);

  // Handle loading state
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading ASIN performance data...
        </Typography>
      </Box>
    );
  }

  // Handle error state
  if (isError || !asinData || asinData.length === 0) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Failed to load ASIN performance data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error?.message || 'No data available'}
        </Typography>
      </Box>
    );
  }

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
        data={asinData}
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

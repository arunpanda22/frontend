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
import campaignData from '../../../../../public/campain_summery_filtered.json'

// Define the type for Campaign data
interface CampaignData {
  campaignName: string
  Impressions: number
  Clicks: number
  'CTR%': number
  'Ad Cost': number
  'Cost/Click': number
  'Units Sold': number
  Sales: number
  'ACOS%': number
}

export default function CampaignTablePage() {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table')

  const columns = useMemo<MRT_ColumnDef<CampaignData>[]>(
    () => [
      {
        accessorKey: 'campaignName',
        header: 'Campaign Name',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Box sx={{ maxWidth: 300 }}>
            <Typography variant="body2" sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              fontWeight: 'medium'
            }}>
              {cell.getValue<string>()}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'Impressions',
        header: 'Impressions',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'Clicks',
        header: 'Clicks',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'CTR%',
        header: 'CTR %',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ 
            color: cell.getValue<number>() >= 0.01 ? 'success.main' : 
                   cell.getValue<number>() >= 0.005 ? 'warning.main' : 'error.main'
          }}>
            {(cell.getValue<number>() * 100).toFixed(2)}%
          </Typography>
        ),
      },
      {
        accessorKey: 'Ad Cost',
        header: 'Ad Cost',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            ₹{cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'Cost/Click',
        header: 'Cost/Click',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2">
            ₹{cell.getValue<number>().toFixed(2)}
          </Typography>
        ),
      },
      {
        accessorKey: 'Units Sold',
        header: 'Units Sold',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'Sales',
        header: 'Sales',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            ₹{cell.getValue<number>().toLocaleString()}
          </Typography>
        ),
      },
      {
        accessorKey: 'ACOS%',
        header: 'ACOS %',
        enableSorting: true,
        enableColumnFilter: true,
        Cell: ({ cell }) => {
          const value = cell.getValue<number>()
          return (
            <Typography variant="body2" sx={{ 
              color: value <= 0.15 ? 'success.main' : 
                     value <= 0.25 ? 'warning.main' : 'error.main',
              fontWeight: 'medium'
            }}>
              {(value * 100).toFixed(2)}%
            </Typography>
          )
        },
      },
    ],
    []
  )

  // Process data through filters, search, and sorting
  const processedData = useMemo(() => {
    let result = [...campaignData] as CampaignData[]

    // Apply global filter
    if (globalFilter) {
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (sorting.length > 0) {
      const { id, desc } = sorting[0]
      result.sort((a, b) => {
        const aVal = a[id as keyof CampaignData]
        const bVal = b[id as keyof CampaignData]
        
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return 1
        if (bVal === null) return -1
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return desc ? bVal - aVal : aVal - bVal
        }
        
        return 0
      })
    }

    return result
  }, [campaignData, globalFilter, sorting])

  // Pagination for grid view
  const startIndex = pagination.pageIndex * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  const currentData = processedData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(processedData.length / pagination.pageSize)

  const renderGridCard = (item: CampaignData, index: number) => (
    <Box 
      key={item.campaignName}
      sx={{ 
        width: { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' },
        p: 1
      }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ 
              fontSize: '0.875rem', 
              fontWeight: 'bold',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2
            }}>
              {item.campaignName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ width: '50%', p: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Sales
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                ₹{item.Sales.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: '50%', p: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Units Sold
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {item['Units Sold'].toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: '50%', p: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Clicks
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {item.Clicks.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: '50%', p: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Impressions
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {item.Impressions.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={`CTR: ${(item['CTR%'] * 100).toFixed(2)}%`}
              size="small"
              color={item['CTR%'] >= 0.01 ? 'success' : item['CTR%'] >= 0.005 ? 'warning' : 'error'}
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              label={`ACOS: ${(item['ACOS%'] * 100).toFixed(2)}%`}
              size="small"
              color={item['ACOS%'] <= 0.15 ? 'success' : item['ACOS%'] <= 0.25 ? 'warning' : 'error'}
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              label={`Cost: ₹${item['Ad Cost'].toFixed(0)}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )

  return (
    <Box sx={{ height: '100vh', width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
         
          <Button
            variant={layoutMode === 'table' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewList />}
            onClick={() => setLayoutMode('table')}
          >
            Table
          </Button>
          
          <Button
            variant={layoutMode === 'grid' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ViewModule />}
            onClick={() => setLayoutMode('grid')}
          >
            Grid
          </Button>
        </Box>
      </Box>

      {layoutMode === 'table' ? (
        <MaterialReactTable
          columns={columns}
          data={campaignData as CampaignData[]}
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
          muiTableContainerProps={{
            sx: {
              maxHeight: 'calc(100vh - 200px)',
              width: '100%',
              overflowX: 'auto',
            },
          }}
          muiTableHeadCellProps={{
            sx: {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 'bold',
            },
          }}
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
            sorting: [{ id: 'Sales', desc: true }],
            columnPinning: {
              left: ['mrt-row-select', 'campaignName'],
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
                Total: {table.getFilteredRowModel().rows.length} campaigns
              </Typography>
            </Box>
          )}
        />
      ) : (
        <Box>
          {/* Global Filter for Grid View */}
          <Box sx={{ mb: 2 }}>
            <input
              placeholder="Search all fields..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </Box>

          {/* Grid View */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            mb: 2,
            mx: -1
          }}>
            {currentData.map(renderGridCard)}
          </Box>

          {/* Pagination for Grid View */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)} of {processedData.length} campaigns
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                disabled={pagination.pageIndex === 0}
                onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
              >
                Previous
              </Button>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                Page {pagination.pageIndex + 1} of {totalPages}
              </Typography>
              
              <Button
                size="small"
                disabled={pagination.pageIndex >= totalPages - 1}
                onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}

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
import { useCampaignSummaryWithParams } from '@/lib/hooks/queries/use-dashboard'
import type { CampaignSummaryItem } from '@/lib/api/services/dashboard.service'

interface CampaignSummary {
  "Campaign Name": string;
  Impressions: string;
  Clicks: string;
  "CTR%": string;
  "Ad Cost": string;
  "Cost/Click": string;
  "Units Sold": string;
  Sales: string;
  "ACOS%": string;
}

export default function CampainAdsSummery() {
  // Fetch real campaign data from API
  const dateParams = useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  const { data: apiCampaignData, isLoading: loading, error } = useCampaignSummaryWithParams(dateParams);

  // Transform API data to match table format
  const campaignData = useMemo(() => {
    if (!apiCampaignData) return [];
    
    return apiCampaignData.map((campaign: CampaignSummaryItem) => ({
      "Campaign Name": campaign.campaign_name || '',
      Impressions: campaign.impressions?.toLocaleString() || '0',
      Clicks: campaign.clicks?.toLocaleString() || '0',
      "CTR%": campaign.ctr_percent ? `${campaign.ctr_percent.toFixed(2)}%` : '0%',
      "Ad Cost": campaign.ad_cost ? `$${campaign.ad_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      "Cost/Click": campaign.cost_per_click ? `$${campaign.cost_per_click.toFixed(2)}` : '$0',
      "Units Sold": campaign.purchases?.toLocaleString() || '0',
      Sales: campaign.sales ? `$${campaign.sales.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0',
      "ACOS%": campaign.acos_percent ? `${campaign.acos_percent.toFixed(2)}%` : '0%',
    }));
  }, [apiCampaignData]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const columns = useMemo<MRT_ColumnDef<CampaignSummary>[]>(() => [
    {
      accessorKey: 'Campaign Name',
      header: 'Campaign Name',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
    },
    {
      accessorKey: 'Impressions',
      header: 'Impressions',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'Clicks',
      header: 'Clicks',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'CTR%',
      header: 'CTR%',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'Ad Cost',
      header: 'Ad Cost',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'Cost/Click',
      header: 'Cost/Click',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'Units Sold',
      header: 'Units Sold',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'Sales',
      header: 'Sales',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: 'ACOS%',
      header: 'ACOS%',
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'fuzzy',
      Cell: ({ cell }) => <span style={{ textAlign: 'right', display: 'block' }}>{cell.getValue<string>()}</span>,
    },
  ], []);

  // Handle loading and error states AFTER all hooks
  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading campaign data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Failed to load campaign data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error?.message || 'Unknown error occurred'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <MaterialReactTable
        columns={columns}
        data={campaignData}
        enableColumnFilters
        enableGlobalFilter
        enableSorting
        enablePagination
        enableRowSelection
        enableColumnResizing={true}
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
            color: column?.column?.id === 'Campaign Name' ? 'black' : 'primary.contrastText',
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
          },
        }}
        initialState={{
          density: 'compact',
          pagination: { pageSize: 15, pageIndex: 0 },
          sorting: [{ id: 'Sales', desc: true }],
          columnPinning: {
            left: ['mrt-row-select', 'Campaign Name'],
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

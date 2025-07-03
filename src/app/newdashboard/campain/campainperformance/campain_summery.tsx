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
  const [campaignData, setCampaignData] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/dataset/Campaign_summers.json');
        const raw = await res.json();
        // Defensive: ensure all fields are present and strings
        const mapped = (raw as any[]).map(item => ({
          "Campaign Name": item["Campaign Name"] ?? '',
          Impressions: item.Impressions ?? '',
          Clicks: item.Clicks ?? '',
          "CTR%": item["CTR%"] ?? '',
          "Ad Cost": item["Ad Cost"] ?? '',
          "Cost/Click": item["Cost/Click"] ?? '',
          "Units Sold": item["Units Sold"] ?? '',
          Sales: item.Sales ?? '',
          "ACOS%": item["ACOS%"] ?? '',
        }));
        setCampaignData(mapped);
      } catch (e) {
        setCampaignData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  if (loading) {
    return <div className="w-full flex justify-center items-center min-h-[200px] text-lg text-blue-700">Loading campaign data...</div>;
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

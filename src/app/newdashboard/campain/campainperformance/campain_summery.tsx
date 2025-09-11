"use client"

import { useMemo, useState } from 'react'
import { Typography } from '@mui/material'
import { useCampaignSummaryWithParams } from '@/lib/hooks/queries/use-dashboard'
import { useCurrency } from '@/lib/context/CurrencyContext' 
import type { CampaignSummaryItem } from '@/lib/api/services/dashboard.service'
import { AdvancedDataTable, type ColumnDefinition, type TableData } from '@/components/dashboard/table/advanced-data-table'

interface CampaignAdsSummaryProps {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export default function CampaignAdsSummary({ 
  startDate, 
  endDate, 
  period = '30d' 
}: CampaignAdsSummaryProps = {}) {

  const { formatCurrency, formatNumber, formatPercentage } = useCurrency();

  // Fetch real campaign data from API using provided date range
  const dateParams = useMemo(() => ({
    start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: endDate || new Date().toISOString().split('T')[0],
    period,
    focus_level: 'all' as const
  }), [startDate, endDate, period]);

  const { data: apiCampaignData, isLoading: loading, error } = useCampaignSummaryWithParams(dateParams);

  // Define columns for the AdvancedDataTable
  const tableColumns: ColumnDefinition[] = useMemo(() => [
    {
      field: 'campaign_name',
      headerName: 'Campaign Name',
      type: 'text',
      editable: false,
      sortable: true,
      filterable: true,
      width: 280,
      minWidth: 200,
      pinned: 'left'
    },
    {
      field: 'impressions',
      headerName: 'Impressions',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 200
    },
    {
      field: 'clicks',
      headerName: 'Clicks',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 180,
      minWidth: 200
    },
    {
      field: 'ctr_percent',
      headerName: 'CTR%',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 180,
      minWidth: 180
    },
    {
      field: 'ad_cost',
      headerName: 'Ad Cost',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 180,
      minWidth: 180
    },
    {
      field: 'cost_per_click',
      headerName: 'Cost/Click',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 200
    },
    {
      field: 'units_sold',
      headerName: 'Units Sold',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 200
    },
    {
      field: 'sales',
      headerName: 'Sales',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 200
    },
    {
      field: 'acos_percent',
      headerName: 'ACOS%',
      type: 'number',
      editable: false,
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 200
    }
  ], []);

  const [columns, setColumns] = useState<ColumnDefinition[]>(tableColumns);

  // Transform API data to match AdvancedDataTable format
  const transformedData: TableData[] = useMemo(() => {
    if (!apiCampaignData || !Array.isArray(apiCampaignData)) {
      console.log('No valid campaign data found');
      return [];
    }
    
    console.log('Processing campaign items:', apiCampaignData.length);
    
    return apiCampaignData.map((campaign: CampaignSummaryItem, index: number) => {
      return {
        campaign_name: campaign.campaign_name || '',
        impressions: formatNumber(campaign.impressions),
        clicks: formatNumber(campaign.clicks),
        ctr_percent: formatPercentage(campaign.ctr_percent),
        ad_cost: formatCurrency(campaign.ad_cost),
        cost_per_click: formatCurrency(campaign.cost_per_click),
        units_sold: formatNumber(campaign.purchases),
        sales: formatCurrency(campaign.sales),
        acos_percent: formatPercentage(campaign.acos_percent),
        // Store raw values for sorting/filtering if needed
        _raw_impressions: campaign.impressions || 0,
        _raw_clicks: campaign.clicks || 0,
        _raw_ctr_percent: campaign.ctr_percent || 0,
        _raw_ad_cost: campaign.ad_cost || 0,
        _raw_cost_per_click: campaign.cost_per_click || 0,
        _raw_units_sold: campaign.purchases || 0,
        _raw_sales: campaign.sales || 0,
        _raw_acos_percent: campaign.acos_percent || 0,
      };
    });
  }, [apiCampaignData]);

  // Debug log for transformed data
  console.log('Transformed campaign data:', transformedData);

  // Handle loading state
  if (loading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign Ads Summary
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <Typography variant="h6" color="text.secondary" className="ml-3">
            Loading campaign data...
          </Typography>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign Ads Summary
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="error">
              Failed to load campaign data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error?.message || 'Unknown error occurred'}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data state
  if (!transformedData || transformedData.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign Ads Summary
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h6" color="text.secondary">
              No campaign data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No campaigns found for the selected date range
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      {/* Header - matches ASIN Performance styling */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Campaign Ads Summary
          </h6>
          
          {/* Summary info */}
          <div className="text-right">
            <div className="text-sm font-medium text-slate-700">
              {transformedData.length} campaigns • {period.replace('d', ' days')}
            </div>
            <div className="text-xs text-slate-500">
              {dateParams.start_date} to {dateParams.end_date}
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <AdvancedDataTable
          data={transformedData}
          columns={columns}
          onDataChange={(newData) => {
            // Handle data changes if needed for campaign data
            console.log('Campaign data changed:', newData);
          }}
          onColumnsChange={setColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
        />
        
        {/* Footer info */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <Typography variant="body2" color="text.secondary">
            Campaign performance metrics for the last 30 days. Use filters and sorting to analyze individual campaign performance.
            ACOS% represents advertising cost of sales, CTR% shows click-through rate.
          </Typography>
        </div>
      </div>
    </div>
  );
}
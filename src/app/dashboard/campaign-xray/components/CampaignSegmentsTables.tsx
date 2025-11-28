// app/dashboard/campaign-xray/components/CampaignSegmentsTables.tsx

"use client";
import React, { useMemo } from "react";
import { TrendingUp, Zap, AlertTriangle, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import { useCampaignSegmentation } from "@/lib/hooks/useCampaignQueries";
import type { CampaignSegmentData } from "@/lib/api/services/campaign.service";
import { useDateRange } from "@/lib/context/DateRangeContext";

// ==================== COLUMN DEFINITIONS ====================

const SEGMENT_COLUMNS: ColumnDefinition[] = [
  {
    field: "campaign_name",
    headerName: "Campaign Name",
    type: "text",
    editable: false,
    pinned: "left",
    width: 250,
    autoFitHeader: true,
  },
  {
    field: "sales",
    headerName: "Sales",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "cost",
    headerName: "Cost",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "acos",
    headerName: "ACOS%",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "roas",
    headerName: "ROAS",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "impressions",
    headerName: "Impressions",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "clicks",
    headerName: "Clicks",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "ctr",
    headerName: "CTR%",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "orders",
    headerName: "Orders",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },

];

// ==================== HELPER FUNCTIONS ====================

const transformSegmentData = (campaigns: CampaignSegmentData[]): TableData[] => {
  return campaigns.map((campaign, index) => ({
    ...campaign,
    _uniqueKey: `${campaign.campaign_name}-${index}`,
    _originalIndex: index,
  }));
};

// ==================== SEGMENT TABLE COMPONENT ====================

interface SegmentTableProps {
  title: string;
  icon: React.ReactNode;
  campaigns: CampaignSegmentData[];
  count: number;
  color: string;
  bgColor: string;
  description: string;
}

const SegmentTable: React.FC<SegmentTableProps> = ({
  title,
  icon,
  campaigns,
  count,
  color,
  bgColor,
  description,
}) => {
  const tableData = useMemo(() => transformSegmentData(campaigns), [campaigns]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-jungle-teal-200 overflow-hidden">
      {/* Header */}
      <div className={`${bgColor} px-6 py-4 border-b border-jungle-teal-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-jungle-teal-900">{title}</h3>
              <p className="text-sm text-jungle-teal-700">{description}</p>
            </div>
          </div>
          <div className={`px-4 py-2 ${color} bg-opacity-10 rounded-lg`}>
            <span className={`text-2xl font-bold ${color}`}>{count}</span>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="p-4">
        {tableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-jungle-teal-500">
            <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No campaigns in this segment</p>
          </div>
        ) : (
          <AdvancedDataTable
            data={tableData}
            columns={SEGMENT_COLUMNS}
            rowsPerPage={5}
            showCheckboxColumn={false}
            showExportCard={false}
            // className="h-[400px]"
          />
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export const CampaignSegmentsTables: React.FC = () => {
  const { dateRange } = useDateRange();

  // Prepare options for the hook
  const segmentOptions = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return undefined;
    
    return {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const { data, isLoading, error } = useCampaignSegmentation(segmentOptions);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-jungle-teal-600 animate-spin" />
          <p className="text-jungle-teal-700 font-medium">Loading campaign segments...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Error loading segment data</p>
            <p className="text-xs text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // No Data State
  if (!data) {
    return (
      <div className="bg-jungle-teal-50 rounded-xl p-12 text-center">
        <AlertCircle className="w-16 h-16 text-jungle-teal-400 mx-auto mb-4" />
        <p className="text-jungle-teal-700 font-medium">No segment data available</p>
        <p className="text-sm text-jungle-teal-600 mt-2">
          Select a date range to view campaign segments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="bg-white rounded-xl border border-powder-blue-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="flex flex-col">
            <div className="text-sm text-powder-blue-700 font-medium mb-2">Total Campaigns</div>
            <div className="text-3xl font-bold text-powder-blue-900">{data.summary.total_campaigns_analyzed}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm text-powder-blue-700 font-medium mb-2">Top 80% Campaigns</div>
            <div className="text-3xl font-bold text-powder-blue-900">{data.summary.top_80_campaigns}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm text-powder-blue-700 font-medium mb-2">Scalers</div>
            <div className="text-3xl font-bold text-powder-blue-900">{data.summary.scalers_count}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm text-powder-blue-700 font-medium mb-2">Efficient Low-Scale</div>
            <div className="text-3xl font-bold text-powder-blue-900">{data.summary.efficient_low_scale_count}</div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm text-powder-blue-700 font-medium mb-2">Need Attention</div>
            <div className="text-3xl font-bold text-powder-blue-900">
              {data.summary.inefficient_wasteful_count + data.summary.decline_diagnostic_count}
            </div>
          </div>
        </div>
        
        {/* Period Info */}
        <div className="mt-6 pt-4 border-t border-powder-blue-200 text-xs text-powder-blue-600">
          <p>
            Current Period: {data.period_info.current_start} to {data.period_info.current_end}
          </p>
          <p className="mt-1">
            Previous Period: {data.period_info.previous_start} to {data.period_info.previous_end}
          </p>
        </div>
      </div>

      {/* Segment Tables - 2 per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scalers */}
        <SegmentTable
          title="Scalers"
          icon={<TrendingUp className="w-5 h-5 text-powder-blue-800" />}
          campaigns={data.scalers}
          count={data.summary.scalers_count}
          color="text-powder-blue-800"
          bgColor="bg-powder-blue-100"
          description="Healthy growth with improving efficiency"
        />

        {/* Efficient Low-Scale */}
        <SegmentTable
          title="Efficient Low-Scale"
          icon={<Zap className="w-5 h-5 text-powder-blue-800" />}
          campaigns={data.efficient_low_scale}
          count={data.summary.efficient_low_scale_count}
          color="text-powder-blue-800"
          bgColor="bg-powder-blue-100"
          description="Stable performance, room to scale"
        />

        {/* Inefficient/Wasteful */}
        <SegmentTable
          title="Inefficient/Wasteful"
          icon={<AlertTriangle className="w-5 h-5 text-powder-blue-800" />}
          campaigns={data.inefficient_wasteful}
          count={data.summary.inefficient_wasteful_count}
          color="text-powder-blue-800"
          bgColor="bg-powder-blue-50"
          description="Poor conversion, needs optimization"
        />

        {/* Decline/Diagnostic */}
        <SegmentTable
          title="Decline/Diagnostic"
          icon={<TrendingDown className="w-5 h-5 text-powder-blue-800" />}
          campaigns={data.decline_diagnostic}
          count={data.summary.decline_diagnostic_count}
          color="text-powder-blue-800"
          bgColor="bg-powder-blue-50"
          description="Declining performance, requires attention"
        />
      </div>
    </div>
  );
};
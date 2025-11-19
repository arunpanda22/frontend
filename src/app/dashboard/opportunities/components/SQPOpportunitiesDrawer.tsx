import React, { useMemo } from "react";
import { X, TrendingUp, DollarSign, Target } from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { SQPSearchQuery } from "@/lib/hooks/use-sqp-opportunities";

// ==================== COLUMN DEFINITIONS ====================

const SQP_COLUMNS: ColumnDefinition[] = [
  {
    field: "asin",
    headerName: "ASIN",
    type: "text",
    editable: false,
    pinned: "left",
    autoFitHeader: true,
  },
  {
    field: "search_query",
    headerName: "Search Query",
    type: "text",
    editable: false,
    pinned: "left",
    autoFitHeader: true,
  },
  {
    field: "asin_conversion",
    headerName: "Your Conversion %",
    type: "number",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "total_conversion",
    headerName: "Market Conversion %",
    type: "number",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "conversion_advantage",
    headerName: "Conversion Advantage",
    type: "text",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "asin_median_click_price",
    headerName: "Your CPC",
    type: "number",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "total_median_click_price",
    headerName: "Market CPC",
    type: "number",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "asin_click_count",
    headerName: "Your Clicks",
    type: "number",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "total_click_count",
    headerName: "Market Clicks",
    type: "number",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "asin_purchase_count",
    headerName: "Your Orders",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "total_purchase_count",
    headerName: "Market Orders",
    type: "number",
    editable: false,
    width: 140,
    autoFitHeader: true,
  },
  {
    field: "BROAD",
    headerName: "Broad Match",
    type: "text",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "PHRASE",
    headerName: "Phrase Match",
    type: "text",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "EXACT",
    headerName: "Exact Match",
    type: "text",
    editable: false,
    autoFitHeader: true,
  },
  {
    field: "keyword_exists",
    headerName: "In Campaigns",
    type: "text",
    editable: false,
    width: 140,
    autoFitHeader: true,
  },
//   {
//     field: "suggested_bid",
//     headerName: "Suggested Bid",
//     type: "number",
//     editable: false, // read-only
//     width: 140,
//     autoFitHeader: true,
//   },
//   {
//     field: "suggested_match_type",
//     headerName: "Suggested Match Type",
//     type: "text",
//     editable: false, // read-only
//     width: 180,
//     autoFitHeader: true,
//   },
];

// ==================== HELPER FUNCTIONS ====================

const transformSQPData = (queries: SQPSearchQuery[]): TableData[] => {
  return queries.map((query, index) => {
    const conversionDiff = query.asin_conversion - query.total_conversion;
    const conversionAdvantage =
      conversionDiff > 0
        ? `+${conversionDiff.toFixed(2)}%`
        : `${conversionDiff.toFixed(2)}%`;

    // Determine suggested match type based on existing campaigns
 

    return {
      ...query,
      conversion_advantage: conversionAdvantage,
      keyword_exists: query.keyword_exists ? "Yes" : "No",
      _uniqueKey: `${query.asin}-${query.search_query}-${index}`,
      _originalIndex: index,
    };
  });
};

const calculateMetrics = (data: TableData[]) => {
  const totalQueries = data.length || 0;

  const avgConversionAdvantage =
    totalQueries === 0
      ? 0
      : data.reduce((sum, row) => {
          const advantage = row.asin_conversion - row.total_conversion;
          return sum + advantage;
        }, 0) / totalQueries;

  const potentialKeywords = data.filter((row) => row.keyword_exists === "No")
    .length;

  return {
    totalQueries,
    avgConversionAdvantage: avgConversionAdvantage.toFixed(2),
    potentialKeywords,
  };
};

// ==================== COMPONENT ====================

interface SQPOpportunitiesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: SQPSearchQuery[];
  topAsins?: string[];
  metadata?: {
    date_range: {
      start_date: string;
      end_date: string;
    };
    total_queries: number;
    total_asins: number;
  };
}

export const SQPOpportunitiesDrawer: React.FC<SQPOpportunitiesDrawerProps> = ({
  isOpen,
  onClose,
  data,
  topAsins = [],
  metadata,
}) => {
  const tableData = useMemo(() => transformSQPData(data || []), [data]);
  const metrics = useMemo(() => calculateMetrics(tableData), [tableData]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 pt-16 z-50 w-[82vw] max-w-[1500px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              SQP Advantage Opportunities
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {tableData.length} high-converting keyword
              {tableData.length !== 1 ? "s" : ""} where you outperform the
              market
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Metrics Summary */}
        <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs opacity-90">Total Opportunities</div>
                <div className="text-2xl font-bold">{metrics.totalQueries}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs opacity-90">
                  Avg Conversion Advantage
                </div>
                <div className="text-2xl font-bold">
                  +{metrics.avgConversionAdvantage}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs opacity-90">Not Yet in Campaigns</div>
                <div className="text-2xl font-bold">
                  {metrics.potentialKeywords}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          <AdvancedDataTable
            data={tableData}
            columns={SQP_COLUMNS}
            rowsPerPage={10}
            showCheckboxColumn={false}
            className="h-full"
          />
        </div>
      </div>
    </>
  );
};

// components/opportunities/AsinSuggestDrawer.tsx
import React, { useState, useMemo } from "react";
import { X, Target, AlertCircle, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { KeywordRecommendation } from "@/lib/hooks/use-asin-suggest-opportunities";
import { useAsinSuggestOpportunities } from "@/lib/hooks/use-asin-suggest-opportunities";
import toast from "react-hot-toast";

// ==================== COLUMN DEFINITIONS ====================

const ASIN_SUGGEST_COLUMNS: ColumnDefinition[] = [
  {
    field: "keyword",
    headerName: "Keyword",
    type: "text",
    editable: false,
    pinned: "left",
    width: 250,
    autoFitHeader: true,
  },
  {
    field: "matchType",
    headerName: "Match Type",
    type: "text",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "rank",
    headerName: "Rank",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "average_rank",
    headerName: "Avg Rank",
    type: "number",
    editable: false,
    width: 110,
    autoFitHeader: true,
  },
  {
    field: "bid",
    headerName: "Current Bid",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "average_suggested_bid",
    headerName: "Avg Suggested Bid",
    type: "number",
    editable: false,
    width: 160,
    autoFitHeader: true,
  },
  {
    field: "suggestedBid_rangeStart",
    headerName: "Bid Range (Low)",
    type: "number",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "suggestedBid_rangeMedian",
    headerName: "Bid Range (Mid)",
    type: "number",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "suggestedBid_rangeEnd",
    headerName: "Bid Range (High)",
    type: "number",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "average_bid_lower_range",
    headerName: "Avg Bid (Low)",
    type: "number",
    editable: false,
    width: 140,
    autoFitHeader: true,
  },
  {
    field: "average_bid_higher_range",
    headerName: "Avg Bid (High)",
    type: "number",
    editable: false,
    width: 140,
    autoFitHeader: true,
  },
  {
    field: "region",
    headerName: "Region",
    type: "text",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "valid_data_count",
    headerName: "Data Points",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
];

// ==================== HELPER FUNCTIONS ====================

const transformAsinSuggestData = (keywords: KeywordRecommendation[]): TableData[] => {
  return keywords.map((keyword, index) => ({
    ...keyword,
    _uniqueKey: `${keyword.asin}-${keyword.keyword}-${keyword.matchType}-${index}`,
    _originalIndex: index,
  }));
};

// ==================== COMPONENT ====================

interface AsinSuggestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AsinSuggestDrawer: React.FC<AsinSuggestDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [asinInput, setAsinInput] = useState<string>("");
  const [submittedAsin, setSubmittedAsin] = useState<string | null>(null);

  const { data, isLoading, error, fetchData } = useAsinSuggestOpportunities(submittedAsin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate ASIN
    if (!asinInput.trim()) {
      toast.error("Please enter an ASIN");
      return;
    }

    setSubmittedAsin(asinInput.trim());
    fetchData();
  };

  const tableData = useMemo(() => {
    if (!data?.keywords) return [];
    return transformAsinSuggestData(data.keywords);
  }, [data]);

  // Calculate summary metrics
  const matchTypeBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    tableData.forEach((row) => {
      const matchType = row.matchType as string;
      breakdown[matchType] = (breakdown[matchType] || 0) + 1;
    });
    return breakdown;
  }, [tableData]);

  const averageBid = useMemo(() => {
    if (tableData.length === 0) return 0;
    const total = tableData.reduce((sum, row) => sum + (row.bid as number || 0), 0);
    return total / tableData.length;
  }, [tableData]);

  const topRankKeywords = useMemo(() => {
    return tableData.filter((row) => (row.rank as number) <= 5).length;
  }, [tableData]);

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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-pink-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ASINSuggest</h2>
            <p className="text-sm text-gray-600 mt-1">
              Get Amazon ads keyword recommendations for any ASIN - powered by Amazon Ads API
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input Form */}
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="flex flex-col md:flex-row md:items-end gap-4">

      {/* ASIN INPUT */}
      <div className="flex-1 items-center md:max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ASIN
        </label>
        <input
          type="text"
          value={asinInput}
          onChange={(e) => setAsinInput(e.target.value)}
          placeholder="e.g., B0DGT5J8SD"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter an ASIN to get Amazon-backed keyword recommendations
        </p>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex-1 h-full ">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-lg"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Get Recommendations
            </>
          )}
        </button>
      </div>
    </div>
  </form>
</div>


        {/* Error State */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Error loading recommendations</p>
                <p className="text-xs text-red-600 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        {/* {data && (
          <div className="px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <div className="grid grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Total Keywords</div>
                  <div className="text-2xl font-bold">{data.total_keywords}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Top Rank Keywords</div>
                  <div className="text-2xl font-bold">{topRankKeywords}</div>
                  <div className="text-xs opacity-75">(Rank ≤ 5)</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Average Bid</div>
                  <div className="text-2xl font-bold">₹{averageBid.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Match Types</div>
                  <div className="text-sm font-semibold">
                    {Object.entries(matchTypeBreakdown).map(([type, count]) => (
                      <span key={type} className="mr-2">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Target className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Enter an ASIN to Begin</p>
              <p className="text-sm mt-2">
                Get Amazon-backed keyword recommendations for profitable targeting
              </p>
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Recommendations Found</p>
              <p className="text-sm mt-2">
                Try a different ASIN or check back later
              </p>
            </div>
          )}

          {data && tableData.length > 0 && (
            <AdvancedDataTable
              data={tableData}
              columns={ASIN_SUGGEST_COLUMNS}
              rowsPerPage={25}
              showCheckboxColumn={false}
              className="h-full"
            />
          )}
        </div>
      </div>
    </>
  )};
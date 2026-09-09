// components/opportunities/AsinSuggestDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Target,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { KeywordRecommendation } from "@/lib/hooks/use-opportunities";
import { useAsinSuggestOpportunities } from "@/lib/hooks/use-opportunities";
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

const transformAsinSuggestData = (
  keywords: KeywordRecommendation[]
): TableData[] => {
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

  const { data, isLoading, error, fetchData } =
    useAsinSuggestOpportunities(submittedAsin);

  useEffect(() => {
    if (submittedAsin !== null) {
      fetchData();
    }
  }, [submittedAsin, fetchData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!asinInput.trim()) {
      toast.error("Please enter an ASIN");
      return;
    }

    setSubmittedAsin(asinInput.trim());
  };

  const tableData = useMemo(() => {
    if (!data?.keywords) return [];
    return transformAsinSuggestData(data.keywords);
  }, [data]);

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
    const total = tableData.reduce(
      (sum, row) => sum + ((row.bid as number) || 0),
      0
    );
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
      <div className="fixed inset-y-0 right-0 pt-16 z-50 w-[82vw] max-w-[1500px] bg-white shadow-2xl flex flex-col animate-slide-in-right font-montserrat">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-ocean-600">
          <div>
            <h2 className="text-xl font-semibold text-white">ASINSuggest</h2>
            <p className="text-sm text-white/80 mt-0.5">
              Get Amazon ads keyword recommendations for any ASIN - powered by Amazon Ads API
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="px-6 py-4 bg-ocean-100 border-b border-gray-200 font-montserrat">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            {/* ASIN LABEL AND INPUT */}
            <label className=" font-bold text-gray-700 whitespace-nowrap">
              Enter ASIN
            </label>
            <input
              type="text"
              value={asinInput}
              onChange={(e) => setAsinInput(e.target.value)}
              placeholder="B0C6K691XQ"
              className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 text-sm"
            />

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 rounded-md font-medium text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap ${
                isLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gold-400 hover:bg-gold-500"
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
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Error loading recommendations
                </p>
                <p className="text-xs text-red-600 mt-0.5">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
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
              rowsPerPage={10}
              showCheckboxColumn={false}
              className="h-full"
            />
          )}
        </div>
      </div>
    </>
  );
};
// components/CompetiRankDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  AlertCircle,
  Loader2,
  TrendingUp,
  Package,
} from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import { useCompetiRankData } from "@/lib/hooks/use-opportunities";
import type { CompetiRankRecord } from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== COLUMN DEFINITIONS ====================

const COMPETIRANK_COLUMNS: ColumnDefinition[] = [
  {
    field: "search_term",
    headerName: "Search Term",
    type: "text",
    editable: false,
    pinned: "left",
    width: 250,
    autoFitHeader: true,
  },
  {
    field: "clicked_asin",
    headerName: "ASIN",
    type: "text",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "clicked_item_name",
    headerName: "Product Name",
    type: "text",
    editable: false,
    width: 250,
    autoFitHeader: true,
  },
  {
    field: "search_frequency_rank",
    headerName: "Search Rank",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "click_share",
    headerName: "Click Share",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "click_share_rank",
    headerName: "Click Rank",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "conversion_share",
    headerName: "Conversion Share",
    type: "number",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "department_name",
    headerName: "Department",
    type: "text",
    editable: false,
    width: 180,
    autoFitHeader: true,
  },
  {
    field: "report_period",
    headerName: "Period",
    type: "text",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
];

// ==================== HELPER FUNCTIONS ====================

const transformCompetiRankData = (records: CompetiRankRecord[]): TableData[] => {
  return records.map((record, index) => ({
    ...record,
    click_share: (record.click_share * 100).toFixed(2) + "%",
    conversion_share: (record.conversion_share * 100).toFixed(2) + "%",
    _uniqueKey: `${record.clicked_asin}-${record.search_term}-${index}`,
    _originalIndex: index,
  }));
};

// ==================== COMPONENT ====================

interface CompetiRankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompetiRankDrawer: React.FC<CompetiRankDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [asinsInput, setAsinsInput] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("");
  const [reportPeriod, setReportPeriod] = useState<string>("");
  const [limit, setLimit] = useState<string>("1000");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { data, isLoading, error, fetchData, isEnabled } = useCompetiRankData({
    asins: asinsInput || undefined,
    limit: parseInt(limit) || 1000,
  });

  useEffect(() => {
    if (hasSubmitted && isEnabled) {
      fetchData();
      setHasSubmitted(false);
    }
  }, [hasSubmitted, isEnabled, fetchData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!asinsInput.trim()) {
      toast.error("Please enter at least one ASIN");
      return;
    }

    setHasSubmitted(true);
    fetchData();
  };

  const tableData = useMemo(() => {
    if (!data) return [];
    return transformCompetiRankData(data.data);
  }, [data]);

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
        <div className="flex items-center justify-between p-4 border-b border-deep-space-200 bg-gradient-to-r from-deep-space-50 to-deep-space-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">CompetiRank</h2>
            <p className="text-sm text-gray-600 mt-1">
              See the keywords your competitors dominate — and take their market share
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-deep-space-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input Form */}
        <div className="px-6 py-4 bg-deep-space-50 border-b border-deep-space-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ASINs (comma-separated)
                </label>
                <input
                  type="text"
                  value={asinsInput}
                  onChange={(e) => setAsinsInput(e.target.value)}
                  placeholder="e.g., B007OU63NM,B009GCTZWC"
                  className="w-full px-4 py-2 border border-deep-space-300 rounded-sm focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter ASINs to find their search terms
                </p>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marketplace ID (optional)
                </label>
                <input
                  type="text"
                  value={marketplaceId}
                  onChange={(e) => setMarketplaceId(e.target.value)}
                  placeholder="e.g., ATVPDKIKX0DER"
                  className="w-full px-4 py-2 border border-deep-space-300 rounded-lg focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Filter by specific marketplace
                </p>
              </div> */}
            </div>

            {/* <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Period (optional)
                </label>
                <input
                  type="text"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  placeholder="e.g., 2024-11"
                  className="w-full px-4 py-2 border border-deep-space-300 rounded-lg focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Filter by report period
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit
                </label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="1000"
                  min="1"
                  max="10000"
                  className="w-full px-4 py-2 border border-deep-space-300 rounded-lg focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max records (1-10000)
                </p>
              </div>
            </div> */}

            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-deep-space-500 to-deep-space-600 hover:shadow-lg"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Find Search Terms"
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Error loading data
                </p>
                <p className="text-xs text-red-600 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        {data && (
          <div className="px-6 py-4 bg-gradient-to-r from-deep-space-500 to-deep-space-600 text-white">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Total Records</div>
                  <div className="text-2xl font-bold">
                    {data.summary.total_records}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Unique ASINs</div>
                  <div className="text-2xl font-bold">
                    {data.summary.unique_asins}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Search Terms</div>
                  <div className="text-2xl font-bold">
                    {data.summary.unique_search_terms}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Enter ASINs to Begin</p>
              <p className="text-sm mt-2">
                Discover which search terms your ASINs appear in
              </p>
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Results Found</p>
              <p className="text-sm mt-2">
                Try different ASINs or adjust your filters
              </p>
            </div>
          )}

          {data && tableData.length > 0 && (
            <AdvancedDataTable
              data={tableData}
              columns={COMPETIRANK_COLUMNS}
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

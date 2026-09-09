// components/KeywordClusterDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Grid3x3,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Package,
} from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import {
  useKeywordCluster,
  type KeywordClusterRecord,
} from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== COLUMN DEFINITIONS ====================

const KEYWORD_CLUSTER_COLUMNS: ColumnDefinition[] = [
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
    field: "search_frequency_rank",
    headerName: "Frequency Rank",
    type: "number",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "clicked_asin",
    headerName: "Clicked ASIN",
    type: "text",
    editable: false,
    width: 130,
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
    field: "click_share",
    headerName: "Click Share",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "click_share_rank",
    headerName: "Click Share Rank",
    type: "number",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "conversion_share",
    headerName: "Conversion Share",
    type: "number",
    editable: false,
    width: 160,
    autoFitHeader: true,
  },
  {
    field: "department_name",
    headerName: "Department",
    type: "text",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "report_period",
    headerName: "Report Period",
    type: "text",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "marketplace_id",
    headerName: "Marketplace",
    type: "text",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
];

// ==================== HELPER FUNCTIONS ====================

const transformKeywordClusterData = (
  records: KeywordClusterRecord[]
): TableData[] => {
  return records.map((record, index) => ({
    ...record,
    click_share: (record.click_share * 100).toFixed(2) + "%",
    conversion_share: (record.conversion_share * 100).toFixed(2) + "%",
    _uniqueKey: `${record.search_term}-${record.clicked_asin}-${index}`,
    _originalIndex: index,
  }));
};

// ==================== COMPONENT ====================

interface KeywordClusterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeywordClusterDrawer: React.FC<KeywordClusterDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [wordsInput, setWordsInput] = useState<string>("");
  const [matchMode, setMatchMode] = useState<"all" | "any">("all");
  const [marketplaceId, setMarketplaceId] = useState<string>("");
  const [reportPeriod, setReportPeriod] = useState<string>("");
  const [limit, setLimit] = useState<string>("1000");

  const [submittedParams, setSubmittedParams] = useState<{
    words: string;
    match_mode?: "all" | "any";
    marketplace_id?: string;
    report_period?: string;
    limit?: number;
  }>({ words: "" });

  const { data, isLoading, error, fetchData } =
    useKeywordCluster(submittedParams);

  useEffect(() => {
    if (submittedParams.words && submittedParams.words.trim().length > 0) {
      fetchData();
    }
  }, [submittedParams, fetchData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordsInput.trim()) {
      toast.error("Please enter at least one word");
      return;
    }

    const params: any = {
      words: wordsInput.trim(),
      match_mode: matchMode,
    };

    if (marketplaceId.trim()) {
      params.marketplace_id = marketplaceId.trim();
    }

    if (reportPeriod.trim()) {
      params.report_period = reportPeriod.trim();
    }

    const limitNum = parseInt(limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      params.limit = limitNum;
    }

    setSubmittedParams(params);
  };

  const tableData = useMemo(() => {
    if (!data) return [];
    return transformKeywordClusterData(data.data);
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
        <div className="flex items-center justify-between px-6 py-4 bg-ocean-600">
          <div>
            <h2 className="text-xl font-semibold text-white">KeywordCluster</h2>
            <p className="text-sm text-white/80 mt-0.5">
              Enter one keyword. Get every related variant instantly.
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
        <div className="flex justify-between px-6 py-3 bg-ocean-100 border-b border-gray-200">
          <div>
            <form onSubmit={handleSubmit}>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Keywords/Words
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={wordsInput}
                      onChange={(e) => setWordsInput(e.target.value)}
                      placeholder="triangle"
                      className="max-w-lg pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                        isLoading
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-gold-400 hover:bg-gold-500"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                      ) : (
                        <Search className="w-4 h-4 text-gray-900" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Space or comma separated
                  </p>
                </div>
              </div>
            </form>
          </div>
          <div>
            {/* Summary Metrics */}
            {data && (
              <div className="bg-gradient-to-br from-ocean-600 to-ocean-700 rounded-2xl">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Total Records</div>
                      <div className="text-xl font-bold text-white">
                        {data.summary.total_records}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Grid3x3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">
                        Unique Search Terms
                      </div>
                      <div className="text-xl font-bold text-white">
                        {data.summary.unique_search_terms}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Unique ASINs</div>
                      <div className="text-xl font-bold text-white">
                        {data.summary.unique_asins}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Match Mode</div>
                      <div className="text-lg font-bold text-white capitalize">
                        {data.summary.match_mode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Error loading data
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
              <Grid3x3 className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Enter Keywords to Find Clusters
              </p>
              <p className="text-sm mt-2">
                Discover all search terms containing your keywords
              </p>
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Results Found</p>
              <p className="text-sm mt-2">
                Try different keywords or change the match mode
              </p>
            </div>
          )}

          {data && tableData.length > 0 && (
            <AdvancedDataTable
              data={tableData}
              columns={KEYWORD_CLUSTER_COLUMNS}
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

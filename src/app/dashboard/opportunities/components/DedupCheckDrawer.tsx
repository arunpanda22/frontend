import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Copy,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { DedupResult } from "@/lib/hooks/use-opportunities";
import { useDedupOpportunities } from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== COLUMN DEFINITIONS ====================

const DEDUP_COLUMNS: ColumnDefinition[] = [
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
    field: "has_duplicates",
    headerName: "Duplicate Status",
    type: "text",
    editable: false,
    width: 150,
    autoFitHeader: true,
  },
  {
    field: "exact",
    headerName: "Exact Match",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "phrase",
    headerName: "Phrase Match",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "broad",
    headerName: "Broad Match",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "total_matches",
    headerName: "Total Match Types",
    type: "number",
    editable: false,
    width: 160,
    autoFitHeader: true,
  },
];

// ==================== HELPER FUNCTIONS ====================

const transformDedupData = (results: DedupResult[]): TableData[] => {
  return results.map((result, index) => {
    const totalMatches = result.exact + result.phrase + result.broad;

    return {
      ...result,
      has_duplicates: result.has_duplicates
        ? "✓ Duplicate Found"
        : "✗ No Duplicates",
      total_matches: totalMatches,
      _uniqueKey: `${result.asin}-${result.keyword}-${index}`,
      _originalIndex: index,
    };
  });
};

// ==================== COMPONENT ====================

interface DedupOpportunitiesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DedupOpportunitiesDrawer: React.FC<
  DedupOpportunitiesDrawerProps
> = ({ isOpen, onClose }) => {
  const [asinInput, setAsinInput] = useState<string>("");
  const [keywordsInput, setKeywordsInput] = useState<string>("");
  const [submittedAsin, setSubmittedAsin] = useState<string | null>(null);
  const [submittedKeywords, setSubmittedKeywords] = useState<string[] | null>(
    null
  );

  const { data, isLoading, error, fetchData } = useDedupOpportunities(
    submittedAsin,
    submittedKeywords
  );

  useEffect(() => {
    if (submittedAsin !== null && submittedKeywords !== null) {
      fetchData();
    }
  }, [submittedAsin, submittedKeywords, fetchData]);

  // Simplify handleSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!asinInput.trim()) {
      toast.error("Please enter an ASIN");
      return;
    }

    const keywordArray = keywordsInput
      .split(",")
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);

    if (keywordArray.length === 0) {
      toast.error("Please enter at least one keyword");
      return;
    }

    setSubmittedAsin(asinInput.trim());
    setSubmittedKeywords(keywordArray);
    // Remove fetchData() from here
  };

  const tableData = useMemo(() => {
    if (!data) return [];
    return transformDedupData(data.results);
  }, [data]);

  const duplicateCount = useMemo(() => {
    return tableData.filter((row) => row.has_duplicates === "✓ Duplicate Found")
      .length;
  }, [tableData]);

  const noDuplicateCount = useMemo(() => {
    return tableData.filter((row) => row.has_duplicates === "✗ No Duplicates")
      .length;
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
        <div className="flex items-center justify-between p-4 border-b border-deep-space-200 bg-gradient-to-r from-deep-space-50 to-deep-space-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">DedupCheck</h2>
            <p className="text-sm text-gray-600 mt-1">
              Instantly detect duplicate keywords across all campaigns & match
              types
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
                  ASIN
                </label>
                <input
                  type="text"
                  value={asinInput}
                  onChange={(e) => setAsinInput(e.target.value)}
                  placeholder="e.g., B0DGT5J8SD"
                  className="w-full px-4 py-2 border border-deep-space-300 rounded-lg focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the ASIN to check for duplicates
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g., wooden toys, wooden toys for kids, toys"
                  className="w-full px-4 py-2 border border-deep-space-300 rounded-lg focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter comma-separated keywords to check
                </p>
              </div>
            </div>

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
                  Checking...
                </span>
              ) : (
                "Check for Duplicates"
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
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Copy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Keywords Checked</div>
                  <div className="text-2xl font-bold">
                    {data.keywords_checked}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Duplicates Found</div>
                  <div className="text-2xl font-bold">{duplicateCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Copy className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Enter ASIN and Keywords to Begin
              </p>
              <p className="text-sm mt-2">
                Check for duplicate keywords across different match types
              </p>
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Results Found</p>
              <p className="text-sm mt-2">
                Try checking different keywords for this ASIN
              </p>
            </div>
          )}

          {data && tableData.length > 0 && (
            <AdvancedDataTable
              data={tableData}
              columns={DEDUP_COLUMNS}
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

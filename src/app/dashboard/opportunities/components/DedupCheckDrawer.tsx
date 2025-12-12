import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Copy,
  AlertCircle,
  Loader2,
  XCircle,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { DedupResult, DedupRequest } from "@/lib/hooks/use-opportunities";
import { useDedupOpportunities } from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== TYPES ====================

interface ParsedData {
  asin: string;
  keyword: string;
}

// ==================== COLUMN DEFINITIONS ====================

const DEDUP_COLUMNS: ColumnDefinition[] = [
  {
    field: "asin",
    headerName: "ASIN",
    type: "text",
    editable: false,
    pinned: "left",
    width: 150,
    autoFitHeader: true,
  },
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

const parseExcelData = (text: string): ParsedData[] => {
  const lines = text.split("\n").filter((line) => line.trim());
  const parsed: ParsedData[] = [];

  lines.forEach((line) => {
    const [asin, keyword] = line.split("\t").map((col) => col.trim());

    // Skip rows without both ASIN and keyword
    if (!asin || !keyword) {
      return;
    }

    parsed.push({ asin, keyword });
  });

  return parsed;
};

const convertParsedDataToRequest = (
  parsedData: ParsedData[]
): DedupRequest => {
  // Group keywords by ASIN
  const asinKeywords: Record<string, string[]> = {};

  parsedData.forEach(({ asin, keyword }) => {
    if (!asinKeywords[asin]) {
      asinKeywords[asin] = [];
    }
    if (!asinKeywords[asin].includes(keyword)) {
      asinKeywords[asin].push(keyword);
    }
  });

  return { asin_keywords: asinKeywords };
};

// ==================== COMPONENT ====================

interface DedupOpportunitiesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DedupOpportunitiesDrawer: React.FC<
  DedupOpportunitiesDrawerProps
> = ({ isOpen, onClose }) => {
  // State for input mode (manual or excel paste)
  const [inputMode, setInputMode] = useState<"manual" | "excel">("manual");

  // Manual input states
  const [asinInput, setAsinInput] = useState<string>("");
  const [keywordsInput, setKeywordsInput] = useState<string>("");

  // Excel paste states
  const [pastedData, setPastedData] = useState<ParsedData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Request state
  const [submittedRequest, setSubmittedRequest] = useState<DedupRequest | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);

  const { data, isLoading, error, fetchData } = useDedupOpportunities(
    submittedRequest
  );

  useEffect(() => {
    if (submittedRequest !== null) {
      fetchData();
      setShowResults(true);
    }
  }, [submittedRequest, fetchData]);

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
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

    setSubmittedRequest({
      asin: asinInput.trim(),
      keywords: keywordArray,
    });
  };

  // Handle Excel paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setParseError(null);

    const text = e.clipboardData.getData("text");
    const parsed = parseExcelData(text);

    if (parsed.length === 0) {
      setParseError(
        "No valid ASIN-keyword pairs found. Please ensure you have 2 columns (ASIN and keyword) with data in both columns."
      );
      setPastedData([]);
      return;
    }

    setPastedData(parsed);
    toast.success(`Parsed ${parsed.length} ASIN-keyword pairs`);
  };

  // Handle Excel data submission
  const handleExcelSubmit = () => {
    if (pastedData.length === 0) {
      toast.error("Please paste data first");
      return;
    }

    const request = convertParsedDataToRequest(pastedData);
    setSubmittedRequest(request);
  };

  // Clear all data
  const handleClear = () => {
    setAsinInput("");
    setKeywordsInput("");
    setPastedData([]);
    setParseError(null);
    setSubmittedRequest(null);
    setShowResults(false);
  };

  const tableData = useMemo(() => {
    if (!data) return [];
    return transformDedupData(data.results);
  }, [data]);

  const duplicateCount = useMemo(() => {
    return tableData.filter((row) => row.has_duplicates === "✓ Duplicate Found")
      .length;
  }, [tableData]);

  const uniqueAsinsCount = useMemo(() => {
    if (!data) return 0;
    return data.asins.length;
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

        {/* Input Mode Toggle */}
        <div className="px-6 py-3 bg-white border-b border-deep-space-200">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInputMode("manual");
                handleClear();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                inputMode === "manual"
                  ? "bg-deep-space-500 text-white shadow-md"
                  : "bg-deep-space-50 text-gray-600 hover:bg-deep-space-100"
              }`}
            >
              <Copy className="w-4 h-4 inline mr-2" />
              Manual Input
            </button>
            <button
              onClick={() => {
                setInputMode("excel");
                handleClear();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                inputMode === "excel"
                  ? "bg-deep-space-500 text-white shadow-md"
                  : "bg-deep-space-50 text-gray-600 hover:bg-deep-space-100"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 inline mr-2" />
              Excel Paste
            </button>
          </div>
        </div>

        {/* Manual Input Form */}
        {inputMode === "manual" && (
          <div className="px-6 py-4 bg-deep-space-50 border-b border-deep-space-200">
            <form onSubmit={handleManualSubmit} className="space-y-4">
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
        )}

        {/* Excel Paste Form */}
        {inputMode === "excel" && (
          <div className="px-6 py-4 bg-deep-space-50 border-b border-deep-space-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Paste Excel Data (ASIN | Keyword)
                </label>
                <textarea
                  onPaste={handlePaste}
                  placeholder="Copy 2 columns from Excel (ASIN [tab] Keyword) and paste here..."
                  className="w-full h-32 px-4 py-2 border border-deep-space-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy ASIN and keyword columns from Excel and paste here. Rows
                  with missing data will be skipped.
                </p>
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{parseError}</p>
                </div>
              )}

              {/* Parsed Data Preview - Hidden when results are shown */}
              {pastedData.length > 0 && !showResults && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Parsed: {pastedData.length} ASIN-keyword pair
                    {pastedData.length !== 1 ? "s" : ""} from{" "}
                    {new Set(pastedData.map((d) => d.asin)).size} unique ASIN
                    {new Set(pastedData.map((d) => d.asin)).size !== 1
                      ? "s"
                      : ""}
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-deep-space-300 rounded-lg bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-deep-space-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            ASIN
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Keyword
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pastedData.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="hover:bg-deep-space-50">
                            <td className="px-4 py-2 text-xs font-mono text-gray-900">
                              {item.asin}
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-700">
                              {item.keyword}
                            </td>
                          </tr>
                        ))}
                        {pastedData.length > 10 && (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-2 text-center text-xs text-gray-500"
                            >
                              +{pastedData.length - 10} more items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleExcelSubmit}
                  disabled={pastedData.length === 0 || isLoading}
                  className={`flex-1 px-6 py-2 rounded-lg font-semibold text-white transition-all ${
                    pastedData.length === 0 || isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-deep-space-500 to-deep-space-600 hover:shadow-lg"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </span>
                  ) : (
                    "Check for Duplicates"
                  )}
                </button>
                {pastedData.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-white border border-deep-space-300 hover:bg-deep-space-50 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">ASINs Checked</div>
                  <div className="text-2xl font-bold">{uniqueAsinsCount}</div>
                </div>
              </div>

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
              {inputMode === "manual" ? (
                <>
                  <Copy className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    Enter ASIN and Keywords to Begin
                  </p>
                  <p className="text-sm mt-2">
                    Check for duplicate keywords across different match types
                  </p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    Paste Excel Data to Begin
                  </p>
                  <p className="text-sm mt-2">
                    Copy ASIN and keyword columns from Excel and paste above
                  </p>
                </>
              )}
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Results Found</p>
              <p className="text-sm mt-2">
                Try checking different keywords for these ASINs
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
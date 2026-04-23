import React, { useState, useMemo, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Target, AlertCircle, Loader2 } from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import type { NgramKeyword, NgramResponse } from "@/lib/hooks/use-opportunities";
import { useNgramOpportunities } from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== COLUMN DEFINITIONS ====================

const POSITIVE_COLUMNS: ColumnDefinition[] = [
  {
    field: "ASIN",
    headerName: "ASIN",
    type: "text",
    editable: false,
    pinned: "left",
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Keyword",
    headerName: "Keyword",
    type: "text",
    editable: false,
    pinned: "left",
    width: 200,
    autoFitHeader: true,
  },
  {
    field: "match_type",
    headerName: "Match Type",
    type: "text",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Keyword_Type",
    headerName: "Keyword Type",
    type: "text",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "ACOS_Value",
    headerName: "ACOS",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "ACOS_Comment",
    headerName: "ACOS vs Target",
    type: "text",
    editable: false,
    width: 140,
    autoFitHeader: true,
  },
  {
    field: "CTR_Value",
    headerName: "CTR",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "CTR_Comment",
    headerName: "CTR vs Avg",
    type: "text",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Conversion_Value",
    headerName: "Conversion",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Conversion_Comment",
    headerName: "Conv vs Avg",
    type: "text",
    editable: false,
    width: 130,
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
    field: "cost",
    headerName: "Cost",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "sales_30d",
    headerName: "Sales (30d)",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "purchases_30d",
    headerName: "Orders (30d)",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "Units",
    headerName: "Units",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "Product_Name",
    headerName: "Product Name",
    type: "text",
    editable: false,
    width: 300,
    autoFitHeader: true,
  },
];

const NEGATIVE_COLUMNS: ColumnDefinition[] = [
  {
    field: "ASIN",
    headerName: "ASIN",
    type: "text",
    editable: false,
    pinned: "left",
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Keyword",
    headerName: "Keyword to Negate",
    type: "text",
    editable: false,
    pinned: "left",
    width: 220,
    autoFitHeader: true,
  },
  {
    field: "match_type",
    headerName: "Negative Match Type",
    type: "text",
    editable: false,
    width: 170,
    autoFitHeader: true,
  },
  {
    field: "Keyword_Type",
    headerName: "Keyword Type",
    type: "text",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "ACOS_Comment",
    headerName: "ACOS Status",
    type: "text",
    editable: false,
    width: 140,
    autoFitHeader: true,
  },
  {
    field: "CTR_Value",
    headerName: "CTR",
    type: "number",
    editable: false,
    width: 100,
    autoFitHeader: true,
  },
  {
    field: "CTR_Comment",
    headerName: "CTR vs Avg",
    type: "text",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Conversion_Value",
    headerName: "Conversion",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "Conversion_Comment",
    headerName: "Conv vs Avg",
    type: "text",
    editable: false,
    width: 130,
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
    field: "cost",
    headerName: "Wasted Cost",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "sales_30d",
    headerName: "Sales (30d)",
    type: "number",
    editable: false,
    width: 120,
    autoFitHeader: true,
  },
  {
    field: "purchases_30d",
    headerName: "Orders (30d)",
    type: "number",
    editable: false,
    width: 130,
    autoFitHeader: true,
  },
  {
    field: "Product_Name",
    headerName: "Product Name",
    type: "text",
    editable: false,
    width: 300,
    autoFitHeader: true,
  },
];

// ==================== HELPER FUNCTIONS ====================

const transformNgramData = (keywords: NgramKeyword[]): TableData[] => {
  return keywords.map((keyword, index) => ({
    ...keyword,
    ACOS_Value: typeof keyword.ACOS_Value === "number" 
      ? keyword.ACOS_Value.toFixed(4)
      : keyword.ACOS_Value,
    CTR_Value: keyword.CTR_Value.toFixed(4),
    Conversion_Value: keyword.Conversion_Value.toFixed(4),
    cost: keyword.cost.toFixed(2),
    sales_30d: keyword.sales_30d.toFixed(2),
    _uniqueKey: `${keyword.ASIN}-${keyword.Keyword}-${index}`,
    _originalIndex: index,
  }));
};

// ==================== COMPONENT ====================

interface NgramOpportunitiesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "positive" | "negative";
}

export const NgramOpportunitiesDrawer: React.FC<NgramOpportunitiesDrawerProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const [targetAcos, setTargetAcos] = useState<string>("0.20");
  const [submittedAcos, setSubmittedAcos] = useState<number | null>(null);

  const { data, isLoading, error, fetchData } = useNgramOpportunities();

  useEffect(() => {
    if (submittedAcos !== null) {
      fetchData();
    }
  }, [submittedAcos, fetchData]);

  // Simplify handleSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const acosValue = parseFloat(targetAcos);
    
    if (isNaN(acosValue) || acosValue < 0 || acosValue > 1) {
      toast.error("Target ACOS must be between 0 and 1");
      return;
    }

    setSubmittedAcos(acosValue);  // This will trigger the useEffect
  };

  const tableData = useMemo(() => {
    if (!data) return [];
    const keywords = type === "positive" ? data.ngram_positive : data.ngram_negative;
    return transformNgramData(keywords);
  }, [data, type]);

  const summary = data?.summary;

  const columns = type === "positive" ? POSITIVE_COLUMNS : NEGATIVE_COLUMNS;

//   const totalCost = useMemo(() => {
//     return tableData.reduce((sum, row) => sum + parseFloat(row.cost as string || "0"), 0);
//   }, [tableData]);

  if (!isOpen) return null;

  const isPositive = type === "positive";
  const headerColor = isPositive 
    ? "from-deep-space-50 to-deep-space-100" 
    : "from-deep-space-100 to-deep-space-200";
  const gradientColor = isPositive
    ? "from-deep-space-500 to-deep-space-600"
    : "from-deep-space-600 to-deep-space-700";
  const iconBgColor = isPositive
    ? "bg-white/20"
    : "bg-white/20";

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
        <div className={`flex items-center justify-between p-4 border-b border-deep-space-200 bg-gradient-to-r ${headerColor}`}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isPositive ? "N-Gram Booster" : "N-Gram Filter AI"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isPositive 
                ? "Extract winning phrases to scale profitable keywords"
                : "Identify wasteful terms causing spend leakage"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-deep-space-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Target ACOS Form */}
        <div className="px-6 py-4 bg-deep-space-50 border-b border-deep-space-200">
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target ACOS
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={targetAcos}
                onChange={(e) => setTargetAcos(e.target.value)}
                placeholder="e.g., 0.20 for 20%"
                className="w-full px-4 py-2 border border-deep-space-300 rounded-lg focus:ring-2 focus:ring-deep-space-500 focus:border-deep-space-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter value between 0 and 1 (e.g., 0.20 = 20%)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : `bg-gradient-to-r ${gradientColor} hover:shadow-lg`
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Analyze"
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
                <p className="text-sm font-medium text-red-800">Error loading data</p>
                <p className="text-xs text-red-600 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Summary */}
        {data && summary && (
          <div className={`px-6 py-4 bg-gradient-to-r ${gradientColor} text-white`}>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">
                    {isPositive ? "Opportunities" : "Keywords to Negate"}
                  </div>
                  <div className="text-2xl font-bold">
                    {isPositive ? summary.positive_count : summary.negative_count}
                  </div>
                </div>
              </div>

              {isPositive ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs opacity-90">BMM Keywords</div>
                      <div className="text-2xl font-bold">
                        {summary.positive_bmm_count}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs opacity-90">Exact Keywords</div>
                      <div className="text-2xl font-bold">
                        {summary.positive_exact_count}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs opacity-90">Phrase Negatives</div>
                      <div className="text-2xl font-bold">
                        {summary.negative_phrase_count}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs opacity-90">Exact Negatives</div>
                      <div className="text-2xl font-bold">
                        {summary.negative_exact_count}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
                  <span className="text-lg font-bold">$</span>
                </div>
                <div>
                  <div className="text-xs opacity-90">
                    {isPositive ? "Total Spend" : "Wasted Spend"}
                  </div>
                  <div className="text-2xl font-bold">
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Target className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Enter Target ACOS to Begin</p>
              <p className="text-sm mt-2">
                {isPositive 
                  ? "Discover winning keyword patterns that drive profitable conversions"
                  : "Identify costly keywords draining your budget without results"}
              </p>
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Opportunities Found</p>
              <p className="text-sm mt-2">
                Try adjusting your target ACOS to find more insights
              </p>
            </div>
          )}

          {data && tableData.length > 0 && (
            <AdvancedDataTable
              data={tableData}
              columns={columns}
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
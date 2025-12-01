// components/CompetingAsinsDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  AlertCircle,
  Loader2,
  TrendingUp,
  Package,
  Target,
} from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type {
  ColumnDefinition,
  TableData,
} from "@/components/dashboard/table/advanced-data-table";
import {
  useCompetingAsins,
  type CompetingAsinRecord,
  type TopCompetitor,
} from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== COLUMN DEFINITIONS ====================

const COMPETING_ASINS_COLUMNS: ColumnDefinition[] = [
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
    headerName: "Competing ASIN",
    type: "text",
    editable: false,
    width: 140,
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
    field: "conversion_share",
    headerName: "Conversion Share",
    type: "number",
    editable: false,
    width: 160,
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
    field: "click_share_rank",
    headerName: "Click Share Rank",
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
];

// ==================== HELPER FUNCTIONS ====================

const transformCompetingAsinsData = (
  records: CompetingAsinRecord[]
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

interface CompetingAsinsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompetingAsinsDrawer: React.FC<CompetingAsinsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [asinsInput, setAsinsInput] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("");
  const [reportPeriod, setReportPeriod] = useState<string>("");
  const [limit, setLimit] = useState<string>("1000");
  const [minClickShare, setMinClickShare] = useState<string>("");

  const [submittedParams, setSubmittedParams] = useState<{
    asins?: string;
    marketplace_id?: string;
    report_period?: string;
    limit?: number;
    min_click_share?: number;
  }>({});

  const { data, isLoading, error, fetchData } =
    useCompetingAsins(submittedParams);

  useEffect(() => {
    if (Object.keys(submittedParams).length > 0) {
      fetchData();
    }
  }, [submittedParams, fetchData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params: any = {};

    if (asinsInput.trim()) {
      params.asins = asinsInput.trim();
    }

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

    const clickShareNum = parseFloat(minClickShare);
    if (!isNaN(clickShareNum) && clickShareNum >= 0 && clickShareNum <= 1) {
      params.min_click_share = clickShareNum;
    } else if (minClickShare.trim()) {
      toast.error("Min Click Share must be between 0.0 and 1.0");
      return;
    }

    if (Object.keys(params).length === 0) {
      toast.error("Please provide at least one filter parameter");
      return;
    }

    setSubmittedParams(params);
  };

  const tableData = useMemo(() => {
    if (!data) return [];
    return transformCompetingAsinsData(data.data);
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
        <div className="flex items-center justify-between p-4 border-b border-powder-blue-200 bg-gradient-to-r from-powder-blue-50 to-powder-blue-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              RivalASIN Finder
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Uncover your Amazon-defined direct competitors in one click
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-powder-blue-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input Form */}
        <div className="px-6 py-4 bg-powder-blue-50 border-b border-powder-blue-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    ASINs
                  </label>
                  <input
                    type="text"
                    value={asinsInput}
                    onChange={(e) => setAsinsInput(e.target.value)}
                    placeholder="e.g., B00LN30QJI,B007OU63NM"
                    className="w-full px-4 py-2 border border-powder-blue-300 rounded-sm focus:ring-2 focus:ring-powder-blue-500 focus:border-powder-blue-500"
                  />
                </div>
              </div>
              <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-sm h-10 font-semibold text-white transition-all ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-powder-blue-500 to-powder-blue-600 hover:shadow-lg"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Finding Competitors...
                    </span>
                  ) : (
                    "Find Competing ASINs"
                  )}
                </button>
            </div>
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
          <>
            <div className="px-6 py-4 bg-gradient-to-r from-powder-blue-500 to-powder-blue-600 text-white">
              <div className="grid grid-cols-4 gap-6">
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
                    <div className="text-xs opacity-90">Competing ASINs</div>
                    <div className="text-2xl font-bold">
                      {data.summary.competing_asins_count}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Search Terms</div>
                    <div className="text-2xl font-bold">
                      {data.summary.shared_search_terms_count}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Top Competitors</div>
                    <div className="text-2xl font-bold">
                      {data.top_competitors.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* {data.summary.searched_asins && data.summary.searched_asins.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-xs opacity-90 mb-2">Your ASINs:</div>
                  <div className="flex flex-wrap gap-2">
                    {data.summary.searched_asins.map((asin, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
                      >
                        {asin}
                      </span>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-2">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Enter ASINs to Find Competitors
              </p>
              <p className="text-sm mt-2">
                Discover ASINs competing for the same search terms
              </p>
            </div>
          )}

          {data && tableData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Competitors Found</p>
              <p className="text-sm mt-2">
                Try different ASINs or adjust your filters
              </p>
            </div>
          )}

          {data && tableData.length > 0 && (
            <AdvancedDataTable
              data={tableData}
              columns={COMPETING_ASINS_COLUMNS}
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

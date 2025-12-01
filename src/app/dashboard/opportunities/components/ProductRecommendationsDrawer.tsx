// components/opportunities/ProductRecommendationsDrawer.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Package,
  AlertCircle,
  Loader2,
  TrendingUp,
  Star,
  Eye,
  Copy,
  ExternalLink,
  Download,
} from "lucide-react";
import type { ProductRecommendation } from "@/lib/hooks/use-opportunities";
import {
  useProductRecommendations,
  extractAllAsins,
  getRecommendationsByCategory,
  countRecommendationTypes,
} from "@/lib/hooks/use-opportunities";
import toast from "react-hot-toast";

// ==================== HELPER FUNCTIONS ====================

const copyToClipboard = (text: string, label?: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`Copied ${label || text} to clipboard`);
};

const openAmazonLink = (asin: string) => {
  const url = `https://www.amazon.in/dp/${asin}`;
  window.open(url, "_blank");
};

const downloadAsCSV = (asins: string[], filename: string) => {
  const csv = "ASIN\n" + asins.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
};

// ==================== CATEGORY CARD COMPONENT ====================

interface CategoryCardProps {
  title: string;
  description: string;
  asins: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  asins,
  icon: Icon,
  color,
  bgColor,
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayLimit = 5;
  const hasMore = asins.length > displayLimit;
  const displayAsins = expanded ? asins : asins.slice(0, displayLimit);

  return (
    <div className={`${bgColor} rounded-xl p-6 border-2 border-gray-200 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{asins.length}</div>
          <div className="text-xs text-gray-500">ASINs</div>
        </div>
      </div>

      {/* ASINs List */}
      {asins.length > 0 ? (
        <div className="space-y-2 mb-4">
          {displayAsins.map((asin, index) => (
            <div
              key={`${asin}-${index}`}
              className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
            >
              <span className="font-mono text-sm text-gray-700">{asin}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => copyToClipboard(asin)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Copy ASIN"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openAmazonLink(asin)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="View on Amazon"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {expanded ? "Show Less" : `Show ${asins.length - displayLimit} More`}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          No recommendations in this category
        </div>
      )}

      {/* Actions */}
      {asins.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => copyToClipboard(asins.join(", "), `${asins.length} ASINs`)}
            className={`flex-1 py-2 ${color} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium`}
          >
            <Copy className="w-4 h-4" />
            Copy All
          </button>
          <button
            onClick={() => downloadAsCSV(asins, `${title.toLowerCase().replace(/\s+/g, "-")}.csv`)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

interface ProductRecommendationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductRecommendationsDrawer: React.FC<
  ProductRecommendationsDrawerProps
> = ({ isOpen, onClose }) => {
  const [asinInput, setAsinInput] = useState<string>("");
  const [submittedAsin, setSubmittedAsin] = useState<string | null>(null);

  const { data, isLoading, error, fetchData } =
    useProductRecommendations(submittedAsin);

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

  // Calculate summary metrics
  const recommendationCounts = useMemo(() => {
    if (!data?.recommendations) return null;
    return countRecommendationTypes(data.recommendations);
  }, [data]);

  const categorizedRecommendations = useMemo(() => {
    if (!data?.recommendations) return null;
    return getRecommendationsByCategory(data.recommendations);
  }, [data]);

  const uniqueAsins = useMemo(() => {
    if (!data?.recommendations) return [];
    return extractAllAsins(data.recommendations);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-powder-blue-50 to-powder-blue-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Product Targeting Recommendations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Discover high-converting product targets based on Amazon's intelligence
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
        <div className="px-6 py-5 bg-powder-blue-50 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* ASIN INPUT */}
              <div className="flex-1 md:max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target ASIN
                </label>
                <input
                  type="text"
                  value={asinInput}
                  onChange={(e) => setAsinInput(e.target.value)}
                  placeholder="e.g., B0DGT5J8SD"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-powder-blue-500 focus:border-powder-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter an ASIN to discover related product recommendations
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-powder-blue-500 to-powder-blue-600 hover:shadow-lg hover:from-powder-blue-600 hover:to-powder-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
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
          <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Error loading recommendations
                </p>
                <p className="text-xs text-red-600 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        {data && recommendationCounts && (
          <div className="px-6 py-5 bg-gradient-to-r from-powder-blue-500 to-powder-blue-600 text-white border-b border-powder-blue-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Total ASINs</div>
                  <div className="text-2xl font-bold">{uniqueAsins.length}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Top Converting</div>
                  <div className="text-2xl font-bold">
                    {recommendationCounts.topConvertingCount}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Low Competition</div>
                  <div className="text-2xl font-bold">
                    {recommendationCounts.lowRatingsCount}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs opacity-90">Frequently Viewed</div>
                  <div className="text-2xl font-bold">
                    {recommendationCounts.frequentlyViewedCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-20 h-20 bg-powder-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-powder-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Enter an ASIN to Begin
              </p>
              <p className="text-sm mt-2 text-center max-w-md">
                Discover recommended products for targeting based on Amazon's data
              </p>
            </div>
          )}

          {data && uniqueAsins.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                No Recommendations Found
              </p>
              <p className="text-sm mt-2 text-center max-w-md">
                Try a different ASIN or check back later
              </p>
            </div>
          )}

          {data && categorizedRecommendations && uniqueAsins.length > 0 && (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <button
                  onClick={() =>
                    copyToClipboard(
                      uniqueAsins.join(", "),
                      `${uniqueAsins.length} ASINs`
                    )
                  }
                  className="px-4 py-2 bg-powder-blue-600 text-white rounded-lg hover:bg-powder-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Copy All ASINs ({uniqueAsins.length})
                </button>
                <button
                  onClick={() =>
                    downloadAsCSV(uniqueAsins, `product-recommendations-${submittedAsin}.csv`)
                  }
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download All CSV
                </button>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <CategoryCard
                  title="Top Converting Targets"
                  description="High-performing products with proven conversion rates"
                  asins={categorizedRecommendations.topConverting}
                  icon={TrendingUp}
                  color="bg-powder-blue-600"
                  bgColor="bg-powder-blue-50"
                />
                <CategoryCard
                  title="Low Competition Products"
                  description="Similar items with fewer ratings and reviews"
                  asins={categorizedRecommendations.lowRatings}
                  icon={Star}
                  color="bg-powder-blue-600"
                  bgColor="bg-powder-blue-50"
                />
                <CategoryCard
                  title="Frequently Viewed Together"
                  description="Products customers often view alongside this ASIN"
                  asins={categorizedRecommendations.frequentlyViewed}
                  icon={Eye}
                  color="bg-powder-blue-600"
                  bgColor="bg-powder-blue-50"
                />
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>💡 Pro Tip:</strong> Use "Top Converting Targets" for aggressive scaling, 
                  "Low Competition Products" for easier wins, and "Frequently Viewed Together" for 
                  complementary product targeting.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
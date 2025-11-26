"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  TrendingUp,
  Search,
  Grid3x3,
  Target,
  Filter,
  Sparkles,
  Lock,
} from "lucide-react";
import { useSQPOpportunities } from "@/lib/hooks/use-sqp-opportunities";
import { SQPOpportunitiesDrawer } from "./components/SQPOpportunitiesDrawer";
import { NgramOpportunitiesDrawer } from "./components/NgramOpportunitiesDrawer";
import { DedupOpportunitiesDrawer } from "./components/DedupCheckDrawer";
import { AsinSuggestDrawer } from "./components/AsinSuggestDrawer";
import toast, { Toaster } from "react-hot-toast";

// Opportunities metadata
const OPPORTUNITIES = [
  {
    id: "dedup",
    name: "DedupCheck",
    headline: "Instantly Detect Duplicate Keywords Across All Campaigns & Match Types.",
    description: "Eliminate overlap. Improve efficiency. Maximize ad clarity.",
    icon: Copy,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Find Duplicates",
    disabled: false,
  },
  {
    id: "sqp",
    name: "SQP Advantage",
    headline: "Discover Keywords That Outsell the Market — Your Competitive Conversion Edge.",
    description: "Find the terms where you outperform the entire category.",
    icon: TrendingUp,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-300",
    buttonText: "Discover Winners",
    disabled: false,
  },
  {
    id: "asin",
    name: "ASINSuggest",
    headline: "Get Amazon ads Keyword Recommendations for Any ASIN",
    description: "Unlock Amazon-backed suggestions for profitable targeting.",
    icon: Target,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Get Suggestions",
    disabled: false,
  },
  {
    id: "competitor",
    name: "CompetiRank",
    headline: "See the Keywords Your Competitors Dominate — And Take Their Market Share.",
    description: "Reverse-engineer their rankings. Outrank them with precision.",
    icon: Search,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Coming soon",
    disabled: true,
  },
  {
    id: "similar",
    name: "KeywordCluster",
    headline: "Enter One Keyword. Get Every Related Variant Instantly.",
    description: "Build deep keyword clusters for ads, ranking, and listing optimization.",
    icon: Grid3x3,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Coming soon",
    disabled: true,
  },
  {
    id: "rivalasin",
    name: "RivalASIN Finder",
    headline: "Uncover Your Amazon-Defined Direct Competitors in One Click.",
    description: "Analyze, benchmark, and optimize against the exact ASINs competing for your customers.",
    icon: Search,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Coming soon",
    disabled: true,
  },
  {
    id: "ngram-positive",
    name: "N-Gram Booster",
    headline: "Extract the Winning Phrases Behind Your Best-Performing Keywords.",
    description: "Find thematic winning patterns to scale profitable keywords.",
    icon: Sparkles,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Boost Keywords",
    disabled: false,
  },
  {
    id: "ngram-negative",
    name: "N-Gram Filter",
    headline: "Identify Wasteful Words Causing Spend Leakage — Negate in One Click.",
    description: "Cut inefficiency. Protect your budget. Improve ROAS instantly.",
    icon: Filter,
    color: "bg-powder-blue-600",
    bgColor: "from-powder-blue-50 to-powder-blue-100",
    borderColor: "border-powder-blue-200",
    buttonText: "Filter Waste",
    disabled: false,
  },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  // Fetch SQP data
  const { data: sqpData, isLoading: sqpLoading, error: sqpError } = useSQPOpportunities();

  const handleCardClick = (opportunityId: string) => {
    if (opportunityId === "sqp") {
      if (sqpLoading) {
        toast.loading("Loading SQP opportunities...", { duration: 1000 });
        return;
      }
      if (sqpError) {
        toast.error("Failed to load SQP opportunities. Please try again.");
        return;
      }
      if (!sqpData?.search_queries || sqpData.search_queries.length === 0) {
        toast.error("No SQP opportunities found.");
        return;
      }
      setSelectedOpportunity("sqp");
    } else if (opportunityId === "ngram-positive" || opportunityId === "ngram-negative") {
      setSelectedOpportunity(opportunityId);
    } else if (opportunityId === "dedup") {
      setSelectedOpportunity("dedup");
    } else if (opportunityId === "asin") {
      setSelectedOpportunity("asin");
    } else {
      // Placeholder for other opportunities
      console.log(`Clicked on: ${opportunityId}`);
    }
  };

  const closeDrawer = () => {
    setSelectedOpportunity(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-powder-blue-50 via-white to-powder-blue-100">
      {/* Toast Container */}
      <Toaster />

      {/* Drawers */}
      {selectedOpportunity === "sqp" && sqpData && (
        <SQPOpportunitiesDrawer
          isOpen={true}
          onClose={closeDrawer}
          data={sqpData.search_queries}
          topAsins={sqpData.top_asins}
          metadata={sqpData.metadata}
        />
      )}

      {selectedOpportunity === "ngram-positive" && (
        <NgramOpportunitiesDrawer
          isOpen={true}
          onClose={closeDrawer}
          type="positive"
        />
      )}

      {selectedOpportunity === "ngram-negative" && (
        <NgramOpportunitiesDrawer
          isOpen={true}
          onClose={closeDrawer}
          type="negative"
        />
      )}

      {selectedOpportunity === "dedup" && (
        <DedupOpportunitiesDrawer
          isOpen={true}
          onClose={closeDrawer}
        />
      )}

      {selectedOpportunity === "asin" && (
        <AsinSuggestDrawer
          isOpen={true}
          onClose={closeDrawer}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-powder-blue-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Growth Opportunities
              </h1>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-powder-blue-600">
                Unlock Your Potential
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Intro Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-powder-blue-50 to-powder-blue-100 rounded-2xl shadow-lg border border-powder-blue-200">
          <h2 className="text-2xl font-bold text-powder-blue-900 mb-2">
            Discover Your Next Competitive Advantage
          </h2>
          <p className="text-powder-blue-800 text-sm leading-relaxed">
            Explore advanced tools designed to identify hidden opportunities,
            eliminate waste, and maximize your Amazon advertising ROI. Each tool
            provides actionable insights to help you dominate your market.
          </p>
        </div>

        {/* Opportunities Sections */}
        <div className="space-y-10">
          {/* InsightScale Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-powder-blue-400 to-powder-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  InsightScale
                </h2>
                <p className="text-sm text-gray-600">
                  Uses insights from existing campaigns to scale spend, bids, or winning keywords
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPPORTUNITIES.filter((o) =>
                ["sqp", "ngram-positive", "ngram-negative"].includes(o.id)
              ).map((opportunity) => {
                const Icon = opportunity.icon;
                const isHovered = hoveredCard === opportunity.id;

                return (
                  <div
                    key={opportunity.id}
                    onMouseEnter={() => setHoveredCard(opportunity.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() =>
                      !opportunity.disabled && handleCardClick(opportunity.id)
                    }
                    className={`
                      bg-white rounded-xl border-2 shadow-md
                      transition-all duration-300 p-6 flex flex-col
                      ${
                        opportunity.disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:shadow-xl hover:border-powder-blue-400 cursor-pointer"
                      }
                      ${isHovered && !opportunity.disabled ? "scale-105" : ""}
                      relative overflow-hidden
                    `}
                  >
                    {/* Disabled Lock Overlay */}
                    {opportunity.disabled && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${opportunity.bgColor} ${opportunity.borderColor} border-2 flex items-center justify-center transition-transform duration-300 ${
                          isHovered && !opportunity.disabled
                            ? "scale-110 rotate-3"
                            : ""
                        }`}
                      >
                        <Icon className="w-7 h-7 text-powder-blue-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {opportunity.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 mb-3 leading-relaxed">
                      {opportunity.headline}
                    </p>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed flex-grow">
                      {opportunity.description}
                    </p>

                    {/* Action Button */}
                    <div className="mt-auto">
                      <button
                        disabled={opportunity.disabled}
                        className={`
                          w-full py-2.5 rounded-lg font-semibold text-sm
                          transition-all duration-300
                          ${
                            opportunity.disabled
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : `${opportunity.color} text-white hover:shadow-lg hover:bg-powder-blue-700`
                          }
                        `}
                      >
                         {opportunity.buttonText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ScaleFinder Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-powder-blue-400 to-powder-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  ScaleFinder
                </h2>
                <p className="text-sm text-gray-600">
                  Identifies new keywords specifically for scaling ad performance
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPPORTUNITIES.filter((o) =>
                ["dedup", "competitor", "similar", "asin", "rivalasin"].includes(o.id)
              ).map((opportunity) => {
                const Icon = opportunity.icon;
                const isHovered = hoveredCard === opportunity.id;

                return (
                  <div
                    key={opportunity.id}
                    onMouseEnter={() => setHoveredCard(opportunity.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() =>
                      !opportunity.disabled && handleCardClick(opportunity.id)
                    }
                    className={`
                      bg-white rounded-xl border-2 shadow-md
                      transition-all duration-300 p-6 flex flex-col
                      ${
                        opportunity.disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:shadow-xl hover:border-powder-blue-400 cursor-pointer"
                      }
                      ${isHovered && !opportunity.disabled ? "scale-105" : ""}
                      relative overflow-hidden
                    `}
                  >
                    {/* Disabled Lock Overlay */}
                    {opportunity.disabled && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${opportunity.bgColor} ${opportunity.borderColor} border-2 flex items-center justify-center transition-transform duration-300 ${
                          isHovered && !opportunity.disabled
                            ? "scale-110 rotate-3"
                            : ""
                        }`}
                      >
                        <Icon className="w-7 h-7 text-powder-blue-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {opportunity.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 mb-3 leading-relaxed">
                      {opportunity.headline}
                    </p>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed flex-grow">
                      {opportunity.description}
                    </p>

                    {/* Action Button */}
                    <div className="mt-auto">
                      <button
                        disabled={opportunity.disabled}
                        className={`
                          w-full py-2.5 rounded-lg font-semibold text-sm
                          transition-all duration-300
                          ${
                            opportunity.disabled
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : `${opportunity.color} text-white hover:shadow-lg hover:bg-powder-blue-700`
                          }
                        `}
                      >
                         {opportunity.buttonText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push("/dashboard/command-center")}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-powder-blue-300 text-gray-700 rounded-lg shadow-sm hover:bg-powder-blue-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Command Center
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-powder-blue-50 border border-powder-blue-200 rounded-xl">
          <p className="text-sm text-powder-blue-900 text-center">
            💡 <strong>Note:</strong> These tools are being rolled out
            progressively. Check back soon as we activate each AI-powered
            feature to help you optimize your campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}
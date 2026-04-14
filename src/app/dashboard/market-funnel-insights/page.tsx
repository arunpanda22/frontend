// src/app/dashboard/market-funnel-insights/sqp-v2/page.tsx
// V2 revamped SQP page — old page.tsx untouched
"use client";

import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";
import { useSQPDataV2 } from "./hooks/useSQPDataV2";
import { SQPV2RequestParams } from "./types/sqp_v2.types";
import SQPSummaryCards from "./components/SQPSummaryCards";
import SQPOverallTrends from "./components/SQPOverallTrends";
import SQPFunnelChart from "./components/SQPFunnelChart";
import ASINCard from "./components/ASINCard";
import ASINFilterDropdown from "./components/ASINFilterDropdown";

export default function SQPPageV2() {
  const [selectedAsin, setSelectedAsin] = useState<string>("");

  const { data, loading, error, refetch } = useSQPDataV2();

  const handleSelectAsin = async (asin: string) => {
    setSelectedAsin(asin);
    const params: SQPV2RequestParams = { selected_asin: asin };
    await refetch(params);
  };

  const handleSelectAll = async () => {
    setSelectedAsin("");
    await refetch({});
  };

  // ---------- States ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4 mx-auto" />
          <p className="text-base text-gray-500 font-medium">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Failed to load data</h2>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => refetch(selectedAsin ? { selected_asin: selectedAsin } : {})}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white
                       rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-base text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // ---------- Main render ----------

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-6 lg:px-10 py-8">
      <div className="max-w-full space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4
                        flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              🔍 Market Funnel Insights
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Last 12 months · {data.metadata.total_asins} ASINs
              {data.metadata.start_date && (
                <span className="ml-1">
                  · {data.metadata.start_date} → {data.metadata.end_date}
                </span>
              )}
            </p>
          </div>

          <ASINFilterDropdown
            asins={data.top_asins}
            selectedAsin={selectedAsin}
            onSelect={handleSelectAsin}
            onSelectAll={handleSelectAll}
          />
        </div>

        {/* ── Summary Cards ── */}
        <SQPSummaryCards summary={data.summary} />

        {/* ── Overall Trends + Funnel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <SQPOverallTrends data={data.overall_trend} />
          </div>
          <SQPFunnelChart funnel={data.overall_funnel} title="Overall Conversion Funnel" />
        </div>

        {/* ── Per-ASIN Cards ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">
              {selectedAsin ? `ASIN: ${selectedAsin}` : `Top ${data.asins.length} ASINs`}
            </h2>
            <span className="text-xs text-gray-400">
              Click any row to expand trends &amp; search queries
            </span>
          </div>

          <div className="space-y-3">
            {data.asins.map((asinData, index) => (
              <ASINCard
                key={asinData.asin}
                asinData={asinData}
                rank={index + 1}
              />
            ))}
          </div>

          {data.asins.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No ASIN data found for this selection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
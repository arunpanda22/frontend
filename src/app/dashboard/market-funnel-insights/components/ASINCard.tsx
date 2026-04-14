// src/app/dashboard/market-funnel-insights/sqp-v2/components/ASINCard.tsx
"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { SQPASINData } from "../types/sqp_v2.types";
import { TrendChart } from "./SQPOverallTrends";
import SQPFunnelChart from "./SQPFunnelChart";
import SQPTableV2 from "./SQPTableV2";

interface ASINCardProps {
  asinData: SQPASINData;
  rank: number;
}

function DiffBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

export default function ASINCard({ asinData, rank }: ASINCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header — always visible, clickable */}
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/70
                   transition-colors text-left"
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Left: rank + ASIN */}
        <div className="flex items-center gap-4">
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50
                           text-blue-700 text-xs font-bold shrink-0">
            {rank}
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900 font-mono tracking-wide">
              {asinData.asin}
            </p>
          </div>
        </div>

        {/* Right: metric badges + chevron */}
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Avg CTR</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-800">
                {asinData.avg_our_ctr.toFixed(2)}%
              </span>
              <DiffBadge value={asinData.ctr_vs_market} />
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Avg CVR</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-800">
                {asinData.avg_our_cvr.toFixed(2)}%
              </span>
              <DiffBadge value={asinData.cvr_vs_market} />
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              Search Terms
            </p>
            <span className="text-sm font-bold text-gray-800">
              {asinData.search_queries.length}
            </span>
          </div>
          <div className="ml-2 text-gray-400">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-6 pt-1 border-t border-gray-50 space-y-6">
          {/* Trend charts + funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TrendChart
              data={asinData.monthly_trend}
              title="CTR — Ours vs Market"
              ourKey="our_ctr"
              marketKey="market_ctr"
              ourLabel="Our CTR"
              marketLabel="Market CTR"
            />
            <TrendChart
              data={asinData.monthly_trend}
              title="CVR — Ours vs Market"
              ourKey="our_cvr"
              marketKey="market_cvr"
              ourLabel="Our CVR"
              marketLabel="Market CVR"
            />
            <SQPFunnelChart funnel={asinData.funnel} title="ASIN Funnel" />
          </div>

          {/* Search query table */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Search Query Performance
            </p>
            <SQPTableV2 data={asinData.search_queries} />
          </div>
        </div>
      )}
    </div>
  );
}
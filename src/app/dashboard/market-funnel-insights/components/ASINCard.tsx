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
      {(value ?? 0).toFixed(2)}
      {suffix}
    </span>
  );
}

function ASINThumbnail({ asin, imageUrl }: { asin: string; imageUrl: string | null }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      <img
        src={imageUrl}
        alt={asin}
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100 border border-gray-100"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
      <span className="text-[9px] font-mono text-gray-400 leading-none text-center px-0.5">
        {(asin ?? "????").slice(0, 4)}
      </span>
    </div>
  );
}

export default function ASINCard({ asinData, rank }: ASINCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize: coerce undefined → null / safe defaults
  const asin = asinData?.asin ?? "Unknown";
  const productName = asinData?.product_name ?? null;
  const imageUrl = asinData?.image_url ?? null;
  const avgOurCtr = asinData?.avg_our_ctr ?? 0;
  const avgOurCvr = asinData?.avg_our_cvr ?? 0;
  const ctrVsMarket = asinData?.ctr_vs_market ?? 0;
  const cvrVsMarket = asinData?.cvr_vs_market ?? 0;
  const searchQueries = asinData?.search_queries ?? [];
  const monthlyTrend = asinData?.monthly_trend ?? [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header — always visible, clickable */}
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/70
                   transition-colors text-left"
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Left: rank + thumbnail + ASIN + product name */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50
                           text-blue-700 text-xs font-bold shrink-0">
            {rank}
          </span>

          <ASINThumbnail asin={asin} imageUrl={imageUrl} />

          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 font-mono tracking-wide leading-tight">
              {asin}
            </p>
            {productName ? (
              <p className="text-xs text-gray-500 truncate leading-tight mt-0.5 max-w-[260px] lg:max-w-[400px]">
                {productName}
              </p>
            ) : (
              <p className="text-xs text-gray-300 italic leading-tight mt-0.5">
                No product name
              </p>
            )}
          </div>
        </div>

        {/* Right: metric badges + chevron */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Avg CTR</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-800">
                {avgOurCtr.toFixed(2)}%
              </span>
              <DiffBadge value={ctrVsMarket} />
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Avg CVR</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-800">
                {avgOurCvr.toFixed(2)}%
              </span>
              <DiffBadge value={cvrVsMarket} />
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              Search Terms
            </p>
            <span className="text-sm font-bold text-gray-800">
              {searchQueries.length}
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
              data={monthlyTrend}
              title="CTR — Ours vs Market"
              ourKey="our_ctr"
              marketKey="market_ctr"
              ourLabel="Our CTR"
              marketLabel="Market CTR"
            />
            <TrendChart
              data={monthlyTrend}
              title="CVR — Ours vs Market"
              ourKey="our_cvr"
              marketKey="market_cvr"
              ourLabel="Our CVR"
              marketLabel="Market CVR"
            />
            {asinData?.funnel && (
              <SQPFunnelChart funnel={asinData.funnel} title="ASIN Funnel" />
            )}
          </div>

          {/* Search query table */}
          {searchQueries.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Search Query Performance
              </p>
              <SQPTableV2 data={searchQueries} />
            </div>
          )}

          {searchQueries.length === 0 && (
            <p className="text-xs text-gray-400 italic">No search query data available.</p>
          )}
        </div>
      )}
    </div>
  );
}
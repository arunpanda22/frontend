// src/app/dashboard/market-funnel-insights/sqp-v2/components/SQPSummaryCards.tsx
"use client";

import React from "react";
import { TrendingUp, TrendingDown, Eye, ShoppingCart } from "lucide-react";
import { SQPSummary } from "../types/sqp_v2.types";

interface SQPSummaryCardsProps {
  summary: SQPSummary;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

interface MetricCardProps {
  title: string;
  ourValue: string;
  marketValue?: string;
  diff?: number;
  icon: React.ReactNode;
  suffix?: string;
}

function MetricCard({ title, ourValue, marketValue, diff, icon, suffix = "%" }: MetricCardProps) {
  const positive = diff !== undefined ? diff >= 0 : true;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <span className="text-gray-400">{icon}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {ourValue}
            <span className="text-base font-medium text-gray-500 ml-0.5">{suffix}</span>
          </p>
          {marketValue !== undefined && (
            <p className="text-xs text-gray-400 mt-0.5">
              Market: <span className="font-medium text-gray-600">{marketValue}{suffix}</span>
            </p>
          )}
        </div>

        {diff !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {positive ? "+" : ""}
            {diff.toFixed(2)}{suffix}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SQPSummaryCards({ summary }: SQPSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Avg CTR (Ours)"
        ourValue={summary.avg_our_ctr.toFixed(2)}
        marketValue={summary.avg_market_ctr.toFixed(2)}
        diff={parseFloat((summary.avg_our_ctr - summary.avg_market_ctr).toFixed(2))}
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <MetricCard
        title="Avg CVR (Ours)"
        ourValue={summary.avg_our_cvr.toFixed(2)}
        marketValue={summary.avg_market_cvr.toFixed(2)}
        diff={parseFloat((summary.avg_our_cvr - summary.avg_market_cvr).toFixed(2))}
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <MetricCard
        title="Total Impressions"
        ourValue={formatNumber(summary.total_impressions)}
        icon={<Eye className="w-4 h-4" />}
        suffix=""
      />
      <MetricCard
        title="Total Purchases"
        ourValue={formatNumber(summary.total_purchases)}
        icon={<ShoppingCart className="w-4 h-4" />}
        suffix=""
      />
    </div>
  );
}
// src/app/dashboard/market-funnel-insights/sqp-v2/components/SQPFunnelChart.tsx
"use client";

import React from "react";
import { Eye, MousePointer, ShoppingCart } from "lucide-react";
import { SQPFunnel } from "../types/sqp_v2.types";

interface SQPFunnelChartProps {
  funnel: SQPFunnel;
  title?: string;
}

function formatNumber(num: number, exact = false): string {
  if (exact) return num.toLocaleString();
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

export default function SQPFunnelChart({ funnel, title = "Conversion Funnel" }: SQPFunnelChartProps) {
  const { impressions, clicks, purchases } = funnel;

  const stages = [
    {
      label: "Impressions",
      value: impressions,
      icon: Eye,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: "Clicks",
      value: clicks,
      icon: MousePointer,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-700",
    },
    {
      label: "Purchases",
      value: purchases,
      icon: ShoppingCart,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
  ];

  const maxValue = impressions || 1;

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
  const cvr = clicks > 0 ? ((purchases / clicks) * 100).toFixed(2) : "0.00";
  const overallCvr = impressions > 0 ? ((purchases / impressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPct = Math.max((stage.value / maxValue) * 100, 4);
          const prevValue = index > 0 ? stages[index - 1].value : stage.value;
          const convRate =
            index > 0 && prevValue > 0
              ? ((stage.value / prevValue) * 100).toFixed(1)
              : null;

          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <stage.icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700">{stage.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {convRate && (
                    <span className="text-gray-400">{convRate}% of {stages[index - 1].label.toLowerCase()}</span>
                  )}
                  <span className="font-semibold text-gray-900">
                    {formatNumber(stage.value, stage.label === "Purchases")}
                  </span>
                </div>
              </div>
              <div className="h-7 bg-gray-50 rounded-md overflow-hidden border border-gray-100">
                <div
                  className={`h-full ${stage.color} flex items-center justify-end pr-2 transition-all duration-700`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-[10px] font-semibold text-white drop-shadow">
                    {widthPct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">CTR</p>
          <p className="text-base font-bold text-blue-600">{ctr}%</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">CVR</p>
          <p className="text-base font-bold text-emerald-600">{cvr}%</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Overall</p>
          <p className="text-base font-bold text-gray-700">{overallCvr}%</p>
        </div>
      </div>
    </div>
  );
}
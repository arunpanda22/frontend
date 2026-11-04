"use client";

/**
 * Conversion funnel (impressions -> clicks -> units) for the Flipkart Keywords page.
 * Flipkart counterpart of Amazon's SQPFunnelChart.
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordFunnel.tsx
 *
 * TWO EXPORTS
 *   KeywordFunnelCard (named)   presentational: pass a funnel from the API. Used inside each campaign card body.
 *   FlipkartKeywordFunnel (default)  loads the ACCOUNT-wide funnel itself (summary endpoint; the summary cards use the
 *                               same query, so it is one request) and renders KeywordFunnelCard.
 *
 * Flipkart reports units (not "purchases"), so the last stage is "Units".
 *
 * RATES ON HOVER
 * The CTR / CVR / Overall figures are shown in a tooltip when the user hovers (or keyboard-focuses) a bar, instead of
 * in a block under the funnel. They are the values computed by the BACKEND (keyword_analysis.build_funnel), already on
 * the 0-100 scale, so the tooltip always agrees with the summary cards and the campaign headers:
 *     CTR     = clicks / impressions x 100
 *     CVR     = units / clicks x 100
 *     Overall = units / impressions x 100
 * Which rates a bar shows (see STAGES.rates):
 *     Impressions bar -> CTR
 *     Clicks bar      -> CTR and CVR
 *     Units bar       -> CVR and Overall
 * The "x% of previous stage" text next to each bar is a step ratio computed here from the stage counts, rounded to
 * one decimal; the tooltip values come from the API with two decimals.
 */
import React from "react";
import { Eye, MousePointer, ShoppingCart } from "lucide-react";
import { useKeywordSummary } from "@/lib/hooks/queries/use-flipkart-keywords";
import type { KeywordFunnel } from "@/lib/api/services/flipkart-keywords.service";
import { formatCount, formatPercent } from "../utils/keywordFormat";

interface KeywordFunnelCardProps {
  funnel: KeywordFunnel;
  title?: string;
}

/** One rate shown in a bar's tooltip. */
interface RateLine {
  label: string;
  /** What the rate is a ratio of, shown in small text. */
  hint: string;
  /** Picks the value out of the API funnel (percent scale). */
  value: (funnel: KeywordFunnel) => number;
}

const CTR_RATE: RateLine = { label: "CTR", hint: "clicks ÷ impressions", value: (f) => f.CTR };
const CVR_RATE: RateLine = { label: "CVR", hint: "units ÷ clicks", value: (f) => f.CVR };
const OVERALL_RATE: RateLine = { label: "Overall", hint: "units ÷ impressions", value: (f) => f.overall_cvr };

const STAGES = [
  { key: "Impressions", label: "Impressions", icon: Eye, color: "bg-blue-500", rates: [CTR_RATE] },
  { key: "Clicks", label: "Clicks", icon: MousePointer, color: "bg-indigo-500", rates: [CTR_RATE, CVR_RATE] },
  { key: "Units", label: "Units", icon: ShoppingCart, color: "bg-emerald-500", rates: [CVR_RATE, OVERALL_RATE] },
] as const;

export function KeywordFunnelCard({ funnel, title = "Conversion Funnel" }: KeywordFunnelCardProps) {
  const maxValue = funnel.Impressions || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>

      <div className="space-y-3">
        {STAGES.map((stage, index) => {
          const value = funnel[stage.key];
          const widthPct = Math.max((value / maxValue) * 100, 4);
          const previousValue = index > 0 ? funnel[STAGES[index - 1].key] : value;
          const stepRate = index > 0 && previousValue > 0 ? ((value / previousValue) * 100).toFixed(1) : null;
          const Icon = stage.icon;

          return (
            // `group` lets the tooltip (a sibling of the clipped bar track) appear on hover or keyboard focus.
            <div key={stage.key} className="relative group" tabIndex={0}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700">{stage.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {stepRate && (
                    <span className="text-gray-400">
                      {stepRate}% of {STAGES[index - 1].label.toLowerCase()}
                    </span>
                  )}
                  <span className="font-semibold text-gray-900">{formatCount(value)}</span>
                </div>
              </div>

              <div className="h-7 bg-gray-50 rounded-md overflow-hidden border border-gray-100 cursor-default">
                <div
                  className={`h-full ${stage.color} flex items-center justify-end pr-2 transition-all duration-700`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-[10px] font-semibold text-white drop-shadow">{widthPct.toFixed(0)}%</span>
                </div>
              </div>

              {/* Tooltip: outside the overflow-hidden track so it is not clipped. */}
              <div
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-20 hidden
                           group-hover:block group-focus:block min-w-[170px] rounded-lg bg-gray-900 text-white
                           shadow-lg px-3 py-2 text-xs"
              >
                <p className="font-semibold mb-1">
                  {stage.label}: {formatCount(value)}
                </p>
                {stage.rates.map((rate) => (
                  <div key={rate.label} className="flex items-baseline justify-between gap-4 mt-0.5">
                    <span className="text-gray-300">
                      {rate.label} <span className="text-[10px] text-gray-400">({rate.hint})</span>
                    </span>
                    <span className="font-semibold">{formatPercent(rate.value(funnel))}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FlipkartKeywordFunnelProps {
  startDate: string;
  endDate: string;
  adsTenant?: string;
}

export default function FlipkartKeywordFunnel({ startDate, endDate, adsTenant }: FlipkartKeywordFunnelProps) {
  const { data, isLoading, isError } = useKeywordSummary({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: adsTenant,
  });

  if (isLoading) {
    return <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full min-h-64 animate-pulse" />;
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center h-full">
        <p className="text-sm font-semibold text-red-500">Failed to load the funnel</p>
      </div>
    );
  }

  return <KeywordFunnelCard funnel={data.funnel} title="Overall Conversion Funnel" />;
}
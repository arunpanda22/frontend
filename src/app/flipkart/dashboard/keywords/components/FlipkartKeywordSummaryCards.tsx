"use client";

/**
 * Summary KPI cards at the top of the Flipkart Keywords page (account-wide keyword totals).
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordSummaryCards.tsx
 *
 * Data: GET keywords/summary/ through useKeywordSummary (the funnel component reads the same query, so it costs one
 * request). Each card shows the current value and the percent change vs the previous window, which is the same number
 * of WHOLE months right before the selected months.
 *
 * CHANGE BADGE COLOURS
 * For cost-type metrics (Spend, CPC, ACOS) a rise is bad, so `lowerIsBetter` flips the colour. The arrow always shows
 * the direction of the number.
 *
 * COVERAGE NOTICES (month based)
 * Keyword data is stored per calendar month, so the notices talk about MONTHS, not days. They come from
 * buildCoverageNotices() (../../utils/dataCoverageNotices.ts, shared with the Search Terms page), which reads the API's
 * data_days: missing months ("data for 5 of 6 selected months"), a month-to-date month ("Oct 2026 is month-to-date,
 * data up to 29 Oct"), no previous data, and an incomplete previous period. When the previous window has no stored data
 * the change badges are hidden, because the API reports +100% against an empty period.
 */
import React from "react";
import {
  BarChart3,
  DollarSign,
  Eye,
  MousePointer,
  Package,
  PercentIcon,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useKeywordSummary } from "@/lib/hooks/queries/use-flipkart-keywords";
import type { KeywordMetrics } from "@/lib/api/services/flipkart-keywords.service";
import { buildCoverageNotices } from "../utils/dataCoverageNotices";
import { formatChange, formatCount, formatMoney, formatPercent, formatRoas } from "../utils/keywordFormat";

interface FlipkartKeywordSummaryCardsProps {
  startDate: string;
  endDate: string;
  adsTenant?: string;
}

interface CardConfig {
  key: keyof KeywordMetrics;
  label: string;
  icon: LucideIcon;
  format: (value: number) => string;
  /** True for cost-type metrics, where a decrease is the good direction. */
  lowerIsBetter?: boolean;
}

const CARDS: CardConfig[] = [
  { key: "Impressions", label: "Impressions", icon: Eye, format: formatCount },
  { key: "Clicks", label: "Clicks", icon: MousePointer, format: formatCount },
  { key: "CTR", label: "CTR", icon: Target, format: formatPercent },
  { key: "Spend", label: "Spend", icon: DollarSign, format: (v) => formatMoney(v), lowerIsBetter: true },
  { key: "CPC", label: "CPC", icon: DollarSign, format: (v) => formatMoney(v, 2), lowerIsBetter: true },
  { key: "Units", label: "Units", icon: Package, format: formatCount },
  { key: "CVR", label: "CVR", icon: TrendingUp, format: formatPercent },
  { key: "Revenue", label: "Revenue", icon: BarChart3, format: (v) => formatMoney(v) },
  { key: "ROAS", label: "ROAS", icon: PercentIcon, format: formatRoas },
  { key: "ACOS", label: "ACOS", icon: PercentIcon, format: formatPercent, lowerIsBetter: true },
];

const NOTICE_CLASS = {
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  info: "text-gray-500 bg-gray-50 border-gray-200",
} as const;

function ChangeBadge({ change, lowerIsBetter }: { change: number; lowerIsBetter?: boolean }) {
  const isGood = lowerIsBetter ? change <= 0 : change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
        isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {formatChange(change)}
    </span>
  );
}

export default function FlipkartKeywordSummaryCards({
  startDate,
  endDate,
  adsTenant,
}: FlipkartKeywordSummaryCardsProps) {
  const { data, isLoading, isError, error } = useKeywordSummary({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: adsTenant,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {CARDS.map((card) => (
          <div key={card.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm font-semibold text-red-500">Failed to load the keyword summary</p>
        <p className="text-xs text-gray-400 mt-1">{(error as Error | null)?.message ?? "Please try again later"}</p>
      </div>
    );
  }

  const current = data.current_period;
  const { hasCurrentData, hasPreviousData, notices } = buildCoverageNotices(
    data.data_days.current_period,
    data.data_days.previous_period,
    data.period,
    "keyword",
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <Icon className="w-4 h-4 text-gray-300" />
              </div>
              <div className="text-xl font-bold text-gray-900">{card.format(current[card.key])}</div>
              <div className="mt-2 h-5">
                {hasCurrentData && hasPreviousData && (
                  <ChangeBadge change={data.changes[card.key]} lowerIsBetter={card.lowerIsBetter} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {notices.map((notice) => (
        <p key={notice.message} className={`text-xs border rounded-lg px-3 py-2 ${NOTICE_CLASS[notice.tone]}`}>
          {notice.message}
        </p>
      ))}
    </div>
  );
}
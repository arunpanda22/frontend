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
 * NO PREVIOUS DATA
 * When the previous window has no stored data (days_with_data = 0) the API reports +100% for everything, which would
 * be misleading, so the badges are hidden and a note says why. When the previous window is covered much less than the
 * current one, an amber note warns that the changes are not like-for-like.
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
  const currentDays = data.data_days.current_period;
  const previousDays = data.data_days.previous_period;

  const hasCurrentData = currentDays.periods_with_data > 0;
  const hasPreviousData = previousDays.days_with_data > 0;
  const previousCoverageLow = hasPreviousData && previousDays.days_with_data < currentDays.days_with_data * 0.8;

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

      {!hasCurrentData && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No keyword data is stored for the selected months yet.
        </p>
      )}
      {hasCurrentData && !hasPreviousData && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          There is no keyword data for the previous period ({data.period.previous_start} to {data.period.previous_end}),
          so the changes are not shown.
        </p>
      )}
      {previousCoverageLow && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          The previous period has data for {previousDays.days_with_data} days against {currentDays.days_with_data} in the
          selected period, so the changes are not like-for-like.
        </p>
      )}
    </div>
  );
}
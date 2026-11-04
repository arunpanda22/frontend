"use client";

/**
 * FlipkartTopSearchTerms: two ranked lists with proportional bars.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartTopSearchTerms.tsx
 *
 * DATA: GET /api/v1/fk/dashboard/search-terms/top/ via useFlipkartSearchTermsTop.
 *   Top terms by revenue      the terms earning the most revenue (what to protect and scale)
 *   Top wasted terms          "wasted" terms (enough clicks, zero units) ranked by spend (what to negate first)
 * Bars are proportional to the largest value in their own list. Plain Tailwind bars, no chart library needed.
 *
 * Clicking a term opens its detail modal (onSelectTerm; the page owns the modal). A small "keyword" badge marks
 * terms that already earned keyword-attributed traffic (already_targeted).
 */
import React from "react";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useFlipkartSearchTermsTop } from "@/lib/hooks/queries/use-flipkart-search-terms";
import type { FlipkartSearchTermRow } from "@/lib/api/services/flipkart-search-terms.service";
import { useFlipkartFormatters } from "./flipkart-search-terms-utils";

const TOP_LIMIT = 10;

interface PanelProps {
  title: string;
  subtitle: string;
  rows: FlipkartSearchTermRow[];
  /** Value that drives the bar length and the right-hand number. */
  valueOf: (row: FlipkartSearchTermRow) => number;
  formatValue: (value: number) => string;
  /** Second line under the term. */
  detailOf: (row: FlipkartSearchTermRow) => string;
  barClass: string;
  emptyMessage: string;
  isLoading: boolean;
  isError: boolean;
  onSelectTerm: (term: string) => void;
}

function RankedPanel({
  title,
  subtitle,
  rows,
  valueOf,
  formatValue,
  detailOf,
  barClass,
  emptyMessage,
  isLoading,
  isError,
  onSelectTerm,
}: PanelProps) {
  const maxValue = rows.reduce((max, row) => Math.max(max, valueOf(row)), 0);

  return (
    <div className="rounded-2xl bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b-2 border-gray-300">
        <h6 className="text-base font-semibold text-gray-900">{title}</h6>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="p-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            <div className="w-4 h-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-48 text-red-500 text-sm">Failed to load data</div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm text-center">{emptyMessage}</div>
        ) : (
          <ol className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const value = valueOf(row);
              const widthPct = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
              return (
                <li key={row.search_term}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => onSelectTerm(row.search_term)}
                      className="flex items-baseline gap-2 min-w-0 text-left font-medium text-gray-800 hover:text-blue-700 hover:underline"
                      title="Open term details"
                    >
                      <span className="text-xs text-gray-400 w-4 flex-shrink-0">{index + 1}</span>
                      <span className="truncate">{row.search_term}</span>
                      {row.already_targeted && (
                        <span
                          className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
                          title="Already earned keyword-attributed traffic in this range"
                        >
                          keyword
                        </span>
                      )}
                    </button>
                    <span className="font-semibold text-gray-900 flex-shrink-0">{formatValue(value)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${barClass}`} style={{ width: `${widthPct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1 pl-6">{detailOf(row)}</div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

interface FlipkartTopSearchTermsProps {
  adsTenant?: string;
  campaignId: string | null;
  minClicks: number;
  /** Called with the (lower-cased) term when a row is clicked. */
  onSelectTerm: (term: string) => void;
}

export default function FlipkartTopSearchTerms({
  adsTenant,
  campaignId,
  minClicks,
  onSelectTerm,
}: FlipkartTopSearchTermsProps) {
  const { dateRange } = useDateRange();
  const format = useFlipkartFormatters();
  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError } = useFlipkartSearchTermsTop(
    {
      start_date: startDate,
      end_date: endDate,
      ads_tenant: adsTenant,
      campaign_id: campaignId ?? undefined,
      min_clicks: minClicks,
      limit: TOP_LIMIT,
    },
    !!(startDate && endDate)
  );

  const loading = isLoading || (!data && !isError);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <RankedPanel
        title="Top Terms by Revenue"
        subtitle="The terms earning the most revenue in this range"
        rows={data?.top_by_revenue ?? []}
        valueOf={(row) => row.Revenue}
        formatValue={format.money}
        detailOf={(row) =>
          `ROAS ${format.roas(row.ROAS)} · Spend ${format.money(row.Spend)} · ${format.count(row.Units)} units`
        }
        barClass="bg-ocean-400"
        emptyMessage="No search terms earned revenue in the selected date range"
        isLoading={loading}
        isError={isError}
        onSelectTerm={onSelectTerm}
      />
      <RankedPanel
        title="Top Wasted Terms"
        subtitle={`Terms with at least ${minClicks} clicks and no units, by spend: negative-keyword candidates`}
        rows={data?.top_wasted ?? []}
        valueOf={(row) => row.Spend}
        formatValue={format.money}
        detailOf={(row) => `${format.count(row.Clicks)} clicks · CPC ${format.money2(row.CPC)} · 0 units`}
        barClass="bg-rose-400"
        emptyMessage="No wasted terms in the selected date range"
        isLoading={loading}
        isError={isError}
        onSelectTerm={onSelectTerm}
      />
    </div>
  );
}
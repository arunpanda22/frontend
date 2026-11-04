"use client";

/**
 * FlipkartSearchTermClassificationChart: how the account's spend splits across the four search-term classes.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartSearchTermClassificationChart.tsx
 *
 * DATA: classification_summary from GET /search-terms/summary/ (the same query as the KPI cards: same params
 * through buildSearchTermsParams(), so React Query shares one request).
 *   winner       converts at or above the baseline ROAS
 *   inefficient  converts, but below the baseline ROAS
 *   wasted       enough clicks (>= min clicks) and no units: negative-keyword candidates
 *   low_data     too few clicks to judge
 * The donut shows each class's share of the scope's TOTAL spend. The legend lists terms, spend and revenue per
 * class (with the class's own ROAS computed from those two sums).
 *
 * CROSS-FILTER: clicking a legend row selects that class (clicking it again clears it). The page passes the
 * selected class to the terms table, which then lists only those terms. `selected` / `onSelect` are controlled
 * by the page.
 */
import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useFlipkartSearchTermsSummary } from "@/lib/hooks/queries/use-flipkart-search-terms";
import type { SearchTermClassification } from "@/lib/api/services/flipkart-search-terms.service";
import {
  CLASSIFICATION_META,
  buildSearchTermsParams,
  useFlipkartFormatters,
} from "./flipkart-search-terms-utils";

// Apex touches `window`, so it must not render on the server (same as the other donuts).
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CARD_CLASS = "w-full rounded-2xl bg-white shadow-lg flex flex-col transition-all duration-300 animate-fadein";

interface FlipkartSearchTermClassificationChartProps {
  adsTenant?: string;
  campaignId: string | null;
  minClicks: number;
  /** Currently selected class (filters the table), or null for all. */
  selected: SearchTermClassification | null;
  onSelect: (classification: SearchTermClassification | null) => void;
}

export default function FlipkartSearchTermClassificationChart({
  adsTenant,
  campaignId,
  minClicks,
  selected,
  onSelect,
}: FlipkartSearchTermClassificationChartProps) {
  const { dateRange } = useDateRange();
  const format = useFlipkartFormatters();
  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError } = useFlipkartSearchTermsSummary(
    buildSearchTermsParams({ startDate, endDate, adsTenant, campaignId, minClicks }),
    !!(startDate && endDate)
  );

  const header = (
    <div className="p-4 border-b-2 border-gray-300 flex items-center justify-between flex-wrap gap-2">
      <h6 className="text-base font-semibold text-gray-900">Search Term Health</h6>
      {data && (
        <div className="text-xs text-gray-500">
          Baseline ROAS <span className="font-semibold text-gray-800">{format.roas(data.baseline_roas)}</span>
          {" · "}
          {format.count(data.total_terms)} terms
        </div>
      )}
    </div>
  );

  if (isLoading || (!data && !isError)) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading search term health...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-8 text-center">
          <div className="text-red-500 text-sm mb-1">Failed to load data</div>
          <div className="text-xs text-gray-400">Please try again later</div>
        </div>
      </div>
    );
  }

  if (data.total_terms === 0) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-8 text-center text-sm text-gray-500">No search terms in the selected date range</div>
      </div>
    );
  }

  const items = data.classification_summary;

  const options: ApexOptions = {
    labels: items.map((item) => CLASSIFICATION_META[item.classification].label),
    chart: { height: 240, type: "donut", fontFamily: "inherit" },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: { show: false },
            value: { show: false },
            total: {
              show: true,
              showAlways: true,
              label: "Share of spend",
              fontSize: "11px",
              fontWeight: 500,
              color: "#64748B",
              formatter: () => "100%",
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: items.map((item) => CLASSIFICATION_META[item.classification].color),
    stroke: { width: 0 },
    tooltip: { enabled: true, y: { formatter: (value: number) => `${value.toFixed(1)}% of spend` } },
    responsive: [{ breakpoint: 768, options: { chart: { height: 200 } } }],
  };

  return (
    <div className={CARD_CLASS}>
      {header}
      <div className="p-4 md:p-6 flex flex-col lg:flex-row items-center gap-6">
        <div className="w-full lg:w-72 flex-shrink-0">
          <ReactApexChart
            options={options}
            series={items.map((item) => item.spend_share_pct)}
            type="donut"
            height={240}
            width="100%"
          />
        </div>

        <div className="flex-1 w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left font-semibold pb-2">Class</th>
                <th className="text-right font-semibold pb-2">Terms</th>
                <th className="text-right font-semibold pb-2">Spend</th>
                <th className="text-right font-semibold pb-2">Share</th>
                <th className="text-right font-semibold pb-2">Revenue</th>
                <th className="text-right font-semibold pb-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const meta = CLASSIFICATION_META[item.classification];
                const isSelected = selected === item.classification;
                const classRoas = item.Spend > 0 ? item.Revenue / item.Spend : 0;
                return (
                  <tr
                    key={item.classification}
                    onClick={() => onSelect(isSelected ? null : item.classification)}
                    aria-selected={isSelected}
                    title={`${meta.hint}. Click to ${isSelected ? "clear" : "filter the table by"} this class.`}
                    className={`cursor-pointer border-t border-gray-100 transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-700">{format.count(item.terms)}</td>
                    <td className="py-2.5 text-right text-gray-700">{format.money(item.Spend)}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{item.spend_share_pct.toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-gray-700">{format.money(item.Revenue)}</td>
                    <td className="py-2.5 text-right text-gray-700">{item.Spend > 0 ? format.roas(classRoas) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">
            Click a class to filter the table below. Wasted spend is money spent on terms with at least {minClicks}{" "}
            clicks and no units.
          </p>
        </div>
      </div>
    </div>
  );
}
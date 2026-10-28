"use client";

/**
 * FlipkartCampaignTypeSplit: donut showing each campaign type's share of revenue (or spend).
 * Flipkart counterpart of Amazon's SalesContributionDonut / AdsTypeSplit.
 *
 * Place at: src/app/flipkart/dashboard/command-center/components/FlipkartCampaignTypeSplit.tsx
 *
 * DATA: GET /api/v1/fk/dashboard/campaign-type-contribution/ via useFlipkartCampaignTypeContribution.
 *   One row per campaign type (e.g. "BRAND_PLA") with Spend, Revenue, Units and the two share
 *   percentages (already 0-100). The backend sorts by revenue, highest first.
 *
 * REVENUE / SPEND TOGGLE: the backend returns both shares, so switching is instant and local. Showing
 *   the two side by side reveals types that spend more than they earn.
 *
 * "UNKNOWN" TYPE: a campaign with report rows but no CampaignName row (or an empty type) is reported as
 *   UNKNOWN. It is drawn like any other slice so the total stays honest, and when it is the ONLY slice a
 *   note explains that real types appear once campaign details have synced.
 *
 * LABELS: "BRAND_PLA" becomes "Brand PLA": underscores to spaces, words of 3 letters or fewer stay
 *   upper-case (acronyms such as PLA / PCA), longer words are Title Case.
 */
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useFlipkartCampaignTypeContribution } from "@/lib/hooks/queries/use-flipkart-dashboard";
import { CURRENCY_SYMBOL, UNKNOWN_VALUE } from "./flipkart-constants";

// Apex touches `window`, so it must not render on the server (same as the Amazon donuts).
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ShareMetric = "revenue" | "spend";

// Ocean palette used by the Amazon donuts, then gold, teal and pink for extra slices.
const SLICE_COLORS = [
  "#7EAEED",
  "#4F94DE",
  "#407AB8",
  "#316095",
  "#234871",
  "#FFBF00",
  "#00E0B2",
  "#E41F66",
];

/** "BRAND_PLA" -> "Brand PLA". See LABELS in the file header. */
function formatTypeLabel(type: string): string {
  return type
    .split("_")
    .filter(Boolean)
    .map((word) =>
      word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

const CARD_CLASS =
  "h-full w-full rounded-2xl bg-white shadow-sm flex flex-col transition-all duration-300 animate-fadein delay-500";

interface FlipkartCampaignTypeSplitProps {
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
}

const FlipkartCampaignTypeSplit: React.FC<FlipkartCampaignTypeSplitProps> = ({ adsTenant }) => {
  const { dateRange } = useDateRange();
  const { formatCurrencyNoDecimal } = useCurrency();
  const [metric, setMetric] = useState<ShareMetric>("revenue");

  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError } = useFlipkartCampaignTypeContribution(
    { start_date: startDate, end_date: endDate, ads_tenant: adsTenant },
    !!(startDate && endDate)
  );

  const slices = useMemo(
    () =>
      (data?.campaign_type_contribution ?? []).map((item, index) => ({
        label: formatTypeLabel(item.campaign_type),
        isUnknown: item.campaign_type === UNKNOWN_VALUE,
        percent: metric === "revenue" ? item.revenue_contribution_pct : item.spend_contribution_pct,
        amount: metric === "revenue" ? item.Revenue : item.Spend,
        color: SLICE_COLORS[index % SLICE_COLORS.length],
      })),
    [data, metric]
  );

  const onlyUnknown = slices.length > 0 && slices.every((slice) => slice.isUnknown);

  const options: ApexOptions = {
    labels: slices.map((slice) => slice.label),
    chart: { height: 240, type: "donut", fontFamily: "inherit" },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { show: false },
            value: { show: false },
            total: {
              show: true,
              showAlways: true,
              label: metric === "revenue" ? "Revenue share" : "Spend share",
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
    colors: slices.map((slice) => slice.color),
    stroke: { width: 0 },
    tooltip: {
      enabled: true,
      y: { formatter: (value: number) => `${value.toFixed(1)}%` },
    },
    responsive: [{ breakpoint: 768, options: { chart: { height: 200 } } }],
  };

  const header = (
    <div className="p-4 border-b-2 border-gray-300 flex-shrink-0 flex items-center justify-between gap-2">
      <h6 className="text-base font-semibold text-gray-900">Campaign Type Split</h6>
      <div className="flex rounded-md bg-gray-100 p-0.5 text-xs font-medium" role="group" aria-label="Share metric">
        {(["revenue", "spend"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMetric(option)}
            aria-pressed={metric === option}
            className={`rounded px-2.5 py-1 capitalize transition-colors ${
              metric === option ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  if (isLoading || (!data && !isError)) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading campaign types...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">Failed to load data</div>
            <div className="text-xs text-gray-400">Please try again later</div>
          </div>
        </div>
      </div>
    );
  }

  if (slices.length === 0) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500">No spend or revenue in the selected date range</div>
        </div>
      </div>
    );
  }

  return (
    <div className={CARD_CLASS}>
      {header}
      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-center">
          <ReactApexChart
            // Remount when the metric changes so the slice colours / labels never go stale.
            key={metric}
            options={options}
            series={slices.map((slice) => slice.percent)}
            type="donut"
            height={220}
            width="100%"
          />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto max-h-44">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></div>
                <span className="text-xs text-slate-600 truncate">{slice.label}</span>
              </div>
              <div className="flex items-baseline gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">
                  {CURRENCY_SYMBOL}
                  {formatCurrencyNoDecimal(slice.amount)}
                </span>
                <span className="text-sm font-medium text-slate-900">{slice.percent.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>

        {onlyUnknown && (
          <div className="text-xs text-gray-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
            Campaign types will appear here once campaign details have synced.
          </div>
        )}
      </div>
    </div>
  );
};

export default FlipkartCampaignTypeSplit;
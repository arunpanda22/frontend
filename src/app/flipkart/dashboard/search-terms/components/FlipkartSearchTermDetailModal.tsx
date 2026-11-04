"use client";

/**
 * FlipkartSearchTermDetailModal: the detail view of ONE search term. A separate, importable component: the page
 * only passes the selected term; the modal fetches its own data.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartSearchTermDetailModal.tsx
 *
 * USAGE
 *     <FlipkartSearchTermDetailModal
 *       term={selectedTerm}            // null = closed (and nothing is fetched)
 *       startDate={...} endDate={...}  // YYYY-MM-DD, the page's date range
 *       adsTenant={...}                // optional
 *       onClose={() => setSelectedTerm(null)}
 *     />
 *
 * DATA: GET /api/v1/fk/dashboard/search-terms/detail/ via useFlipkartSearchTermDetail (only while `term` is set).
 *   totals        the term's metrics over every campaign
 *   campaigns     the same metrics per campaign (name, status, type), highest spend first
 *   timeline      one zero-filled bucket per day: Spend (bars) and Revenue (line)
 *   found         false when the term has no rows in the range
 *   already_targeted  the term also earned keyword-attributed traffic in the range
 * The chart footnote says on how many days the term has data, so partially loaded report data is visible.
 *
 * BEHAVIOUR: closes on Escape, on the backdrop click and on the close button; locks page scrolling while open;
 * rendered through a portal into document.body so no parent's overflow / z-index can clip it.
 */
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFlipkartSearchTermDetail } from "@/lib/hooks/queries/use-flipkart-search-terms";
import type { FlipkartMetrics } from "@/lib/api/services/flipkart-dashboard.service";
import { useFlipkartFormatters } from "./flipkart-search-terms-utils";

// Same palette as the Ads Timeline chart on the Campaign Summary page.
const SPEND_COLOR = "#316095";
const REVENUE_COLOR = "#FFBF00";

const formatAxisTick = (value: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

interface FlipkartSearchTermDetailModalProps {
  /** The (lower-cased) term to show, or null to keep the modal closed. */
  term: string | null;
  startDate: string;
  endDate: string;
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
  onClose: () => void;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

export default function FlipkartSearchTermDetailModal({
  term,
  startDate,
  endDate,
  adsTenant,
  onClose,
}: FlipkartSearchTermDetailModalProps) {
  const format = useFlipkartFormatters();
  const isOpen = term !== null;

  const { data, isLoading, isError, error } = useFlipkartSearchTermDetail(
    { start_date: startDate, end_date: endDate, ads_tenant: adsTenant, term: term ?? "" },
    isOpen
  );

  // Escape closes the modal; page scrolling is locked while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const renderTotals = (totals: FlipkartMetrics) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatBox label="Impressions" value={format.count(totals.Impressions)} />
      <StatBox label="Clicks" value={format.count(totals.Clicks)} />
      <StatBox label="CTR" value={format.percent(totals.CTR)} />
      <StatBox label="CPC" value={format.money2(totals.CPC)} />
      <StatBox label="Spend" value={format.money(totals.Spend)} />
      <StatBox label="Units" value={format.count(totals.Units)} />
      <StatBox label="CVR" value={format.percent(totals.CVR)} />
      <StatBox label="Revenue" value={format.money(totals.Revenue)} />
      <StatBox label="ROAS" value={format.roas(totals.ROAS)} />
      <StatBox label="ACOS" value={totals.Revenue > 0 ? format.percent(totals.ACOS) : "—"} />
    </div>
  );

  const renderBody = () => {
    if (isLoading || (!data && !isError)) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          <div className="w-5 h-5 mr-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading term details...
        </div>
      );
    }

    if (isError || !data) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-red-500 font-semibold">Failed to load term details</div>
          <div className="text-sm text-gray-500">{error?.message || "Unknown error occurred"}</div>
        </div>
      );
    }

    if (!data.found) {
      return (
        <div className="flex items-center justify-center h-64 text-sm text-gray-500 text-center">
          This term has no search-term data between {startDate} and {endDate}.
        </div>
      );
    }

    const daysWithData = data.timeline.filter((day) => day.Impressions > 0 || day.Spend > 0).length;

    return (
      <div className="flex flex-col gap-6">
        {renderTotals(data.totals)}

        {/* Daily trend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Daily trend</h4>
          <div className="rounded-lg border border-gray-100 p-3">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data.timeline} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" minTickGap={24} tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke={SPEND_COLOR}
                  tickFormatter={formatAxisTick}
                  width={60}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={REVENUE_COLOR}
                  tickFormatter={formatAxisTick}
                  width={60}
                />
                <Tooltip
                  // `any` on purpose: recharts types the tooltip formatter loosely.
                  formatter={(value: any, name: any) => [format.money(Number(value)), name]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Spend" name="Spend" fill={SPEND_COLOR} opacity={0.8} radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Revenue"
                  name="Revenue"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2.5}
                  dot={data.timeline.length <= 45 ? { fill: REVENUE_COLOR, r: 3 } : false}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Data on {daysWithData} of {data.timeline.length} days in this range. Days without data show as zero.
          </p>
        </div>

        {/* Per-campaign breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Campaigns serving this term ({data.campaigns.length})
          </h4>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2 text-left font-semibold">Campaign</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-right font-semibold">Impr.</th>
                  <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                  <th className="px-3 py-2 text-right font-semibold">Spend</th>
                  <th className="px-3 py-2 text-right font-semibold">Units</th>
                  <th className="px-3 py-2 text-right font-semibold">CVR</th>
                  <th className="px-3 py-2 text-right font-semibold">Revenue</th>
                  <th className="px-3 py-2 text-right font-semibold">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((campaign) => (
                  <tr key={campaign.campaign_id} className="border-b border-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[240px] truncate" title={campaign.campaign_name}>
                      {campaign.campaign_name}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{campaign.status === "UNKNOWN" ? "—" : campaign.status}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {campaign.campaign_type === "UNKNOWN" ? "—" : campaign.campaign_type}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{format.count(campaign.Impressions)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{format.count(campaign.Clicks)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{format.money(campaign.Spend)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{format.count(campaign.Units)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{format.percent(campaign.CVR)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{format.money(campaign.Revenue)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{format.roas(campaign.ROAS)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Search term details: ${term}`}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#1a2b3c] truncate">{term}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {startDate} to {endDate}
              {data?.already_targeted && (
                <span
                  className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
                  title="Already earned keyword-attributed traffic in this range"
                >
                  keyword
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{renderBody()}</div>
      </div>
    </div>,
    document.body
  );
}
"use client";

/**
 * The list of expandable campaign cards on the Flipkart Keywords page, with a campaign search box and a sort control.
 * Flipkart counterpart of the "Top 30 ASINs" card list on Amazon's Market Funnel Insights page, with every campaign of
 * the ad account that has keyword data in the selected months (there is no top-N cut).
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordCampaignList.tsx
 *
 * Data: GET keywords/campaigns/ through useKeywordCampaigns (headers only; each card loads its own body when opened).
 * Search and sort run on the server; the previous list stays on screen (dimmed) while a new one loads.
 *
 * BASELINE STRIP
 * The account baseline (CTR / CVR / ROAS over all keyword data in the range) is shown above the list, because every
 * green / red badge on a card header is that campaign's difference from it.
 */
import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Search } from "lucide-react";
import { useKeywordCampaigns } from "@/lib/hooks/queries/use-flipkart-keywords";
import type { KeywordCampaignSort, SortOrder } from "@/lib/api/services/flipkart-keywords.service";
import FlipkartKeywordCampaignCard from "./FlipkartKeywordCampaignCard";
import { formatPercent, formatRoas } from "../utils/keywordFormat";

interface FlipkartKeywordCampaignListProps {
  startDate: string;
  endDate: string;
  adsTenant?: string;
}

const SORT_OPTIONS: { value: KeywordCampaignSort; label: string }[] = [
  { value: "spend", label: "Spend" },
  { value: "revenue", label: "Revenue" },
  { value: "roas", label: "ROAS" },
  { value: "ctr", label: "CTR" },
  { value: "cvr", label: "CVR" },
  { value: "impressions", label: "Impressions" },
  { value: "clicks", label: "Clicks" },
  { value: "units", label: "Units" },
  { value: "acos", label: "ACOS" },
  { value: "keywords", label: "Keywords" },
  { value: "campaign_name", label: "Name" },
];

export default function FlipkartKeywordCampaignList({
  startDate,
  endDate,
  adsTenant,
}: FlipkartKeywordCampaignListProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<KeywordCampaignSort>("spend");
  const [order, setOrder] = useState<SortOrder>("desc");

  // Debounce the search box so typing does not send one request per key stroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } = useKeywordCampaigns({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: adsTenant,
    search: search || undefined,
    sort,
    order,
  });

  return (
    <div>
      {/* Section header: title, search, sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">
            Campaigns{data ? ` (${data.total_campaigns})` : ""}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Click a campaign to open its trends, funnel and keywords
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 text-gray-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Sort by</span>
            <select
              value={sort}
              onChange={(event) => {
                const next = event.target.value as KeywordCampaignSort;
                setSort(next);
                setOrder(next === "campaign_name" ? "asc" : "desc");
              }}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700
                         focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setOrder((current) => (current === "asc" ? "desc" : "asc"))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              title={order === "asc" ? "Ascending" : "Descending"}
              aria-label={order === "asc" ? "Sort ascending" : "Sort descending"}
            >
              {order === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Baseline strip */}
      {data && data.campaigns.length > 0 && (
        <p className="text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2 mb-3">
          Account baseline: CTR <strong>{formatPercent(data.baseline.CTR)}</strong> · CVR{" "}
          <strong>{formatPercent(data.baseline.CVR)}</strong> · ROAS <strong>{formatRoas(data.baseline.ROAS)}</strong>.
          The green / red badges show each campaign&apos;s difference from this baseline.
        </p>
      )}

      {/* States */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm h-[72px] animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm font-semibold text-red-500">Failed to load the campaigns</p>
          <p className="text-xs text-gray-400 mt-1">{(error as Error | null)?.message ?? "Please try again later"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {data && data.campaigns.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search
              ? "No campaign matches this search."
              : "No campaign has keyword data in the selected months."}
          </p>
        </div>
      )}

      {data && data.campaigns.length > 0 && (
        <div className={`space-y-3 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {data.campaigns.map((row, index) => (
            <FlipkartKeywordCampaignCard
              key={row.campaign_id}
              row={row}
              rank={index + 1}
              startDate={startDate}
              endDate={endDate}
              adsTenant={adsTenant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
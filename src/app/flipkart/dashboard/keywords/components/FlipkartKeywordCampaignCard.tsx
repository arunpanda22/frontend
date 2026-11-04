"use client";

/**
 * One expandable campaign card on the Flipkart Keywords page.
 * Flipkart counterpart of Amazon's ASINCard, with the campaign in place of the ASIN and the account baseline in place
 * of the market.
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordCampaignCard.tsx
 *
 * HEADER (always visible, from the keywords/campaigns/ row): rank, campaign name, status and type, spend, then CTR, CVR
 * and ROAS each with a green / red badge showing the difference from the account baseline, and the keyword count.
 *
 * BODY (FlipkartKeywordCampaignBody) is mounted only while the card is expanded, so it loads on first open and a closed
 * card costs nothing. React Query keeps the data, so reopening is instant.
 */
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { KeywordCampaignRow } from "@/lib/api/services/flipkart-keywords.service";
import FlipkartKeywordCampaignBody from "./FlipkartKeywordCampaignBody";
import FlipkartKeywordDiffBadge from "./FlipkartKeywordDiffBadge";
import { formatCount, formatMoney, formatPercent, formatRoas, statusBadgeClass } from "../utils/keywordFormat";

interface FlipkartKeywordCampaignCardProps {
  row: KeywordCampaignRow;
  /** 1-based position in the current list. */
  rank: number;
  startDate: string;
  endDate: string;
  adsTenant?: string;
}

function Metric({
  label,
  value,
  badge,
  className = "hidden sm:block",
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-right ${className}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-sm font-bold text-gray-800">{value}</span>
        {badge}
      </div>
    </div>
  );
}

export default function FlipkartKeywordCampaignCard({
  row,
  rank,
  startDate,
  endDate,
  adsTenant,
}: FlipkartKeywordCampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors text-left"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
      >
        {/* Left: rank + name + status */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-bold shrink-0">
            {rank}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[260px] lg:max-w-[420px]" title={row.campaign_name}>
              {row.campaign_name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusBadgeClass(row.status)}`}>
                {row.status}
              </span>
              <span className="text-[11px] text-gray-400 truncate">{row.campaign_type}</span>
            </div>
          </div>
        </div>

        {/* Right: metrics with baseline badges + chevron */}
        <div className="flex items-center gap-6 shrink-0">
          <Metric label="Spend" value={formatMoney(row.Spend)} className="hidden md:block" />
          <Metric
            label="CTR"
            value={formatPercent(row.CTR)}
            badge={
              <FlipkartKeywordDiffBadge value={row.ctr_vs_baseline} suffix="%" hasData={row.Impressions > 0} />
            }
          />
          <Metric
            label="CVR"
            value={formatPercent(row.CVR)}
            badge={<FlipkartKeywordDiffBadge value={row.cvr_vs_baseline} suffix="%" hasData={row.Clicks > 0} />}
          />
          <Metric
            label="ROAS"
            value={formatRoas(row.ROAS)}
            badge={<FlipkartKeywordDiffBadge value={row.roas_vs_baseline} suffix="x" hasData={row.Spend > 0} />}
          />
          <Metric label="Keywords" value={formatCount(row.keyword_count)} className="hidden lg:block" />
          <div className="ml-2 text-gray-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-6 pt-4 border-t border-gray-50">
          <FlipkartKeywordCampaignBody
            startDate={startDate}
            endDate={endDate}
            adsTenant={adsTenant}
            campaignId={row.campaign_id}
          />
        </div>
      )}
    </div>
  );
}

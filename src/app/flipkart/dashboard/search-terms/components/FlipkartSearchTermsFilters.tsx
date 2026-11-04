"use client";

/**
 * FlipkartSearchTermsFilters: the two page-level filters of the Search Terms page.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartSearchTermsFilters.tsx
 *
 *   Campaign     "All campaigns" or one campaign. Options come from GET /campaign-options/ (the CampaignName
 *                dimension, independent of the date range). Choosing a campaign also changes the BASELINE
 *                ROAS every term is compared against (it becomes that campaign's ROAS).
 *   Min clicks   click threshold between "wasted" and "low data" (a term with at least this many clicks and no
 *                units is "wasted"). Committed on blur or Enter, so typing does not fire a request per key.
 *
 * Controlled component: the page owns the state (campaignId, minClicks) because every other component reads it.
 */
import React, { useEffect, useState } from "react";
import { useFlipkartCampaignOptions } from "@/lib/hooks/queries/use-flipkart-search-terms";

/** Same bounds as the backend (search_term_params.MAX_MIN_CLICKS). */
const MIN_CLICKS_MAX = 100000;

interface FlipkartSearchTermsFiltersProps {
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
  campaignId: string | null;
  onCampaignChange: (campaignId: string | null) => void;
  minClicks: number;
  onMinClicksChange: (minClicks: number) => void;
}

export default function FlipkartSearchTermsFilters({
  adsTenant,
  campaignId,
  onCampaignChange,
  minClicks,
  onMinClicksChange,
}: FlipkartSearchTermsFiltersProps) {
  const { data, isLoading, isError } = useFlipkartCampaignOptions({ ads_tenant: adsTenant });

  // The input keeps its own draft text; the page value only changes when a valid number is committed.
  const [draft, setDraft] = useState(String(minClicks));
  useEffect(() => setDraft(String(minClicks)), [minClicks]);

  const commitDraft = () => {
    const value = Number(draft);
    if (draft.trim() !== "" && Number.isInteger(value) && value >= 0 && value <= MIN_CLICKS_MAX) {
      if (value !== minClicks) onMinClicksChange(value);
    } else {
      setDraft(String(minClicks)); // invalid: put the last good value back
    }
  };

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
      <div className="flex flex-col gap-1 min-w-[260px]">
        <label htmlFor="fk-st-campaign" className="text-xs font-semibold text-slate-600">
          Campaign
        </label>
        <select
          id="fk-st-campaign"
          value={campaignId ?? ""}
          onChange={(e) => onCampaignChange(e.target.value || null)}
          disabled={isLoading}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">{isLoading ? "Loading campaigns..." : "All campaigns"}</option>
          {campaigns.map((campaign) => (
            <option key={campaign.campaign_id} value={campaign.campaign_id}>
              {campaign.campaign_name}
              {campaign.status !== "UNKNOWN" ? ` (${campaign.status})` : ""}
            </option>
          ))}
        </select>
        {isError && <span className="text-xs text-red-500">Could not load the campaign list</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fk-st-min-clicks" className="text-xs font-semibold text-slate-600">
          Min clicks
        </label>
        <input
          id="fk-st-min-clicks"
          type="number"
          min={0}
          max={MIN_CLICKS_MAX}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitDraft();
          }}
          title="A term with at least this many clicks and no units is classified as 'wasted'; with fewer clicks it is 'low data'."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <p className="text-xs text-slate-500 sm:ml-auto sm:max-w-md">
        Terms are compared with the {campaignId ? "selected campaign's" : "account's"} overall ROAS. A term with at
        least {minClicks} clicks and no units is "wasted".
      </p>
    </div>
  );
}
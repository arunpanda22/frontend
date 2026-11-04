"use client";

/**
 * Body of an opened campaign card on the Flipkart Keywords page: the CTR / CVR / ROAS "campaign vs baseline" trend
 * charts, the funnel, the keyword classification summary and the keyword table.
 * Flipkart counterpart of the expanded part of Amazon's ASINCard.
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordCampaignBody.tsx
 *
 * LAZY: this component is only mounted while its card is expanded (FlipkartKeywordCampaignCard), so a closed card
 * costs no request. Data: GET keywords/campaign-detail/ through useKeywordCampaignDetail; the table below has its own
 * endpoint and state (FlipkartKeywordTable). React Query caches the detail, so reopening a card is instant.
 *
 * BASELINE
 * The dashed grey line in each chart is the ACCOUNT's value for the same month (baseline_CTR, baseline_CVR,
 * baseline_ROAS from the API), the stand-in for the "market" line on Amazon. The keyword table below judges keywords
 * against THEIR CAMPAIGN's totals instead.
 */
import React from "react";
import { RefreshCw } from "lucide-react";
import { useKeywordCampaignDetail } from "@/lib/hooks/queries/use-flipkart-keywords";
import FlipkartKeywordLineChart from "./FlipkartKeywordLineChart";
import FlipkartKeywordTable from "./FlipkartKeywordTable";
import { KeywordFunnelCard } from "./FlipkartKeywordFunnel";
import { CLASSIFICATION_META, formatCount, formatMoney, formatPercent, formatRoas } from "../utils/keywordFormat";

interface FlipkartKeywordCampaignBodyProps {
  startDate: string;
  endDate: string;
  adsTenant?: string;
  campaignId: string;
}

const CAMPAIGN_COLOR = "#1e40af";
const BASELINE_COLOR = "#9ca3af";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function FlipkartKeywordCampaignBody({
  startDate,
  endDate,
  adsTenant,
  campaignId,
}: FlipkartKeywordCampaignBodyProps) {
  const { data, isLoading, isError, error, refetch } = useKeywordCampaignDetail({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: adsTenant,
    campaign_id: campaignId,
  });

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading campaign insights...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-red-500">Failed to load this campaign</p>
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
    );
  }

  if (!data.found) {
    return (
      <p className="py-8 text-center text-sm text-gray-400 italic">
        This campaign has no keyword data in the selected months.
      </p>
    );
  }

  const timeline = data.timeline as unknown as Array<Record<string, string | number>>;

  return (
    <div className="space-y-6">
      {/* Trend charts: campaign vs account baseline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="CTR: campaign vs baseline">
          <FlipkartKeywordLineChart
            data={timeline}
            series={[
              { key: "CTR", name: "Campaign CTR", color: CAMPAIGN_COLOR },
              { key: "baseline_CTR", name: "Account CTR", color: BASELINE_COLOR, dashed: true },
            ]}
            formatValue={formatPercent}
          />
        </ChartCard>
        <ChartCard title="CVR: campaign vs baseline">
          <FlipkartKeywordLineChart
            data={timeline}
            series={[
              { key: "CVR", name: "Campaign CVR", color: CAMPAIGN_COLOR },
              { key: "baseline_CVR", name: "Account CVR", color: BASELINE_COLOR, dashed: true },
            ]}
            formatValue={formatPercent}
          />
        </ChartCard>
        <ChartCard title="ROAS: campaign vs baseline">
          <FlipkartKeywordLineChart
            data={timeline}
            series={[
              { key: "ROAS", name: "Campaign ROAS", color: CAMPAIGN_COLOR },
              { key: "baseline_ROAS", name: "Account ROAS", color: BASELINE_COLOR, dashed: true },
            ]}
            formatValue={formatRoas}
          />
        </ChartCard>
      </div>

      {/* Funnel + keyword classification summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KeywordFunnelCard funnel={data.funnel} title="Campaign Funnel" />

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Keyword health</p>
            <p className="text-xs text-gray-400">
              {formatCount(data.keyword_count)} keywords · judged against this campaign&apos;s ROAS of{" "}
              {formatRoas(data.totals.ROAS)}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.classification_summary.map((item) => {
              const meta = CLASSIFICATION_META[item.classification];
              return (
                <div key={item.classification} className="rounded-lg border border-gray-100 p-3" title={meta.description}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCount(item.terms)}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {formatMoney(item.Spend)} spend · {formatPercent(item.spend_share_pct)} of campaign
                  </p>
                </div>
              );
            })}
          </div>
          {data.truncated && (
            <p className="text-[11px] text-amber-600 mt-3">
              This campaign has more keywords than can be summarised; the figures cover the highest-spend ones.
            </p>
          )}
        </div>
      </div>

      {/* Keyword table (server-side) */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Keyword Performance</p>
        <FlipkartKeywordTable startDate={startDate} endDate={endDate} adsTenant={adsTenant} campaignId={campaignId} />
      </div>
    </div>
  );
}
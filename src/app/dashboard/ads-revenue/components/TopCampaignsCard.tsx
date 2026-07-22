"use client";

import { TopCampaign } from "@/lib/hooks/useRealtimeAdsRevenueData";
import { AD_TYPE_META } from "@/lib/constants/adTypes";
import { useCurrency } from "@/lib/context/CurrencyContext";

interface TopCampaignsCardProps {
  topCampaigns: TopCampaign[] | null;
  isLoading?: boolean;
}

const RANK_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-gray-100 text-gray-600",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-600",
  "bg-blue-100 text-blue-600",
];

export default function TopCampaignsCard({
  topCampaigns,
  isLoading = false,
}: TopCampaignsCardProps) {
  const { formatCurrencyNoDecimal, getCurrencySymbol } = useCurrency();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      <h3 className="text-base font-bold text-[#1a2b3c] mb-4">Top Campaigns Today</h3>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : !topCampaigns || topCampaigns.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-gray-400">No campaign data yet today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topCampaigns.map((campaign, idx) => {
            const meta = AD_TYPE_META[campaign.ad_type];
            return (
              <div
                key={`${campaign.ad_type}-${campaign.campaign_id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    RANK_COLORS[idx] ?? RANK_COLORS[RANK_COLORS.length - 1]
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    title={campaign.campaign_name ?? campaign.campaign_id}
                  >
                    {campaign.campaign_name ?? campaign.campaign_id}
                  </p>
                  {campaign.campaign_name && (
                    <p className="text-[11px] text-gray-400 truncate" title={campaign.campaign_id}>
                      ID: {campaign.campaign_id}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.shortLabel}
                    </span>
                    <span className="text-xs text-gray-400">{campaign.orders} orders</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {getCurrencySymbol()}
                    {formatCurrencyNoDecimal(campaign.revenue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
"use client";

import { AdType, AdTypeMetrics } from "@/lib/hooks/useRealtimeAdsRevenueData";
import { AD_TYPE_META, AD_TYPE_ORDER } from "@/lib/constants/adTypes";

type AdRevenueCardProps = {
  label: string;
  revenue?: number;
  byAdType?: Partial<Record<AdType, AdTypeMetrics>>;
  /** Show the per-ad-type chips under the total (mirrors showVendor in RevenueCard) */
  showBreakdown: boolean;
  color: "blue" | "purple" | "pink";
  formatRevenue: (value: number) => string;
};

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-500",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-500",
  },
};

export function AdRevenueCard({
  label,
  revenue,
  byAdType,
  showBreakdown,
  color,
  formatRevenue,
}: AdRevenueCardProps) {
  const colors = COLOR_MAP[color];

  const includedTypes = AD_TYPE_ORDER.filter((t) => byAdType?.[t]);
  const hasBreakdown = showBreakdown && includedTypes.length > 0;

  return (
    <div className={`text-center p-3 rounded-lg ${colors.bg}`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>

      {revenue !== undefined ? (
        <>
          <p className={`text-xl font-bold ${colors.text}`}>
            {formatRevenue(revenue)}
          </p>

          {hasBreakdown && (
            <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
              {includedTypes.map((adType) => (
                <div key={adType} className="flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${AD_TYPE_META[adType].dotColor}`}
                  />
                  <span>
                    {AD_TYPE_META[adType].shortLabel}: {formatRevenue(byAdType![adType]!.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
    </div>
  );
}
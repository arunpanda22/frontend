"use client";

import React, { useMemo, useState, useEffect } from "react";
import { DollarSign, Eye, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";
import { MetricsCard } from "@/components/dashboard/ui";
import { useRealtimeAdsRevenueDataLive } from "@/lib/hooks/useRealtimeAdsRevenueData";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { AdRevenueCard } from "./components/AdRevenueCard";
import HourlyAdsRevenueChart from "./components/HourlyAdsRevenueChart";
import TopCampaignsCard from "./components/TopCampaignsCard";
import { AD_TYPE_META, AD_TYPE_ORDER } from "@/lib/constants/adTypes";

// ---------------------------------------------------------------------------
// Timezone display helpers — same pattern as CombinedDashboardPage
// ---------------------------------------------------------------------------

/**
 * Given an IANA timezone string (e.g. "Asia/Kolkata") returns a short label
 * appropriate for the current moment — "GMT+5:30" for zones without a
 * common abbreviation, "PST"/"PDT" etc. for zones that have one.
 */
function getTimezoneAbbr(ianaTimezone: string): string {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      timeZoneName: "short",
    }).formatToParts(now);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? ianaTimezone;
  } catch {
    return ianaTimezone;
  }
}

/**
 * Formats a Date object in the given IANA timezone as "9:15 PM GMT+5:30".
 */
function formatMarketClock(date: Date, ianaTimezone: string): string {
  try {
    const timeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    const abbr = getTimezoneAbbr(ianaTimezone);
    return `${timeStr} ${abbr}`;
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Formats a YYYY-MM-DD string as "16 Jul" without any timezone shift.
 */
function formatDateShortFromISO(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const [, month, day] = dateStr.split("-").map(Number);
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${day} ${monthNames[month - 1]}`;
  } catch {
    return dateStr;
  }
}

/** Live-updating clock string for the tenant's ad marketplace timezone. */
function useMarketClock(ianaTimezone: string | undefined) {
  const [clockStr, setClockStr] = useState<string>("");

  useEffect(() => {
    if (!ianaTimezone) return;

    const tick = () => setClockStr(formatMarketClock(new Date(), ianaTimezone));
    tick();
    const id = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(id);
  }, [ianaTimezone]);

  return clockStr;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdsRevenueDashboardPage() {
  const { formatCurrency, formatCurrencyNoDecimal, getCurrencySymbol } = useCurrency();

  // Use the seller's actual marketplace timezone for bucketing/capping
  // "today" — not our IST default. Without this, the hourly chart's cutoff
  // for "today" is computed against India's clock while the underlying
  // hourly buckets are in the seller's own local marketplace time, which
  // desyncs the two (e.g. a Canada-based seller's "today" line wouldn't
  // stop at the right hour).
  const { data: userProfile } = useUserProfile();
  const activeAdvertisingProfile = useMemo(() => {
    const profiles = userProfile?.connected_advertising_profiles ?? [];
    return profiles.find((p) => p.is_active) ?? profiles[0];
  }, [userProfile]);
  const sellerTimezone = activeAdvertisingProfile?.timezone;

  const { data, isLoading, error, refetch, isRefetching } = useRealtimeAdsRevenueDataLive({
    timezone: sellerTimezone,
  });

  // Marketplace timezone from API metadata (e.g. "Asia/Kolkata")
  const marketTimezone = data?.metadata?.timezone;
  const marketDate = data?.metadata?.date; // "2026-07-16"
  const tzAbbr = marketTimezone ? getTimezoneAbbr(marketTimezone) : "";
  const marketClockStr = useMarketClock(marketTimezone);

  // Human-readable label for the market date, e.g. "16 Jul (GMT+5:30)"
  const marketDateLabel = marketDate
    ? `${formatDateShortFromISO(marketDate)} (${tzAbbr})`
    : "";

  const formatRevenue = (value: number) =>
    `${getCurrencySymbol()}${Math.round(value).toLocaleString()}`;

  const metricsData = useMemo(() => {
    if (!data?.today_performance) {
      return [
        { title: "Ad Revenue",   value: "Loading...", icon: DollarSign,        bgColor: "bg-white", color: "bg-ocean-300" },
        { title: "Orders",       value: "Loading...", icon: ShoppingCart,      bgColor: "bg-white", color: "bg-gold-400"  },
        { title: "Clicks",       value: "Loading...", icon: MousePointerClick, bgColor: "bg-white", color: "bg-ocean-300" },
        { title: "Impressions",  value: "Loading...", icon: Eye,               bgColor: "bg-white", color: "bg-gold-400"  },
        { title: "ASP",          value: "Loading...", icon: TrendingUp,        bgColor: "bg-white", color: "bg-ocean-300" },
      ];
    }

    const { revenue, orders, clicks, impressions, asp } = data.today_performance;

    return [
      { title: "Ad Revenue",  value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(revenue)}`, icon: DollarSign,        bgColor: "bg-white", color: "bg-ocean-300" },
      { title: "Orders",      value: orders.toString(),                                             icon: ShoppingCart,      bgColor: "bg-white", color: "bg-gold-400"  },
      { title: "Clicks",      value: clicks.toLocaleString(),                                       icon: MousePointerClick, bgColor: "bg-white", color: "bg-ocean-300" },
      { title: "Impressions", value: impressions.toLocaleString(),                                  icon: Eye,               bgColor: "bg-white", color: "bg-gold-400"  },
      { title: "ASP",         value: `${getCurrencySymbol()}${formatCurrency(asp)}`,               icon: TrendingUp,        bgColor: "bg-white", color: "bg-ocean-300" },
    ];
  }, [data, formatCurrency, formatCurrencyNoDecimal, getCurrencySymbol]);

  const adTypesIncluded = data?.metadata?.ad_types_included ?? AD_TYPE_ORDER;
  const showBreakdown = adTypesIncluded.length > 1;

  return (
    <div className="min-h-screen bg-[#f7fafc] p-12 font-montserrat">
      <div className="w-full">

        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-visible">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">Ads Revenue</h1>
            {data?.metadata?.generated_at && (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(data.metadata.generated_at).toLocaleString()}
                {marketClockStr && (
                  <span className="ml-2 text-gray-400">· Market time: {marketClockStr}</span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isRefetching
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
              }`}
            >
              <svg
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isRefetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Error banner                                                        */}
        {/* ------------------------------------------------------------------ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              Error:{" "}
              {error instanceof Error ? error.message : "Failed to load ads revenue data"}
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Metrics cards                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <h2 className="text-xl font-bold text-[#1a2b3c] tracking-tight px-2">
            Today's Ad Performance
            {marketDateLabel && (
              <span className="ml-2 text-base font-normal text-gray-400">
                · {marketDateLabel}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 py-6 gap-4 md:gap-6">
            {metricsData.map((metric) => (
              <MetricsCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                bgColor={metric.bgColor}
                color={metric.color}
                className="animate-fadeIn"
              />
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Revenue summary cards (Today / Yesterday / 2 Days Ago) by ad type   */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-3 gap-4">
            <AdRevenueCard
              label="Today"
              revenue={data?.today_performance?.revenue}
              byAdType={data?.today_performance?.by_ad_type}
              showBreakdown={showBreakdown}
              color="blue"
              formatRevenue={formatRevenue}
            />
            <AdRevenueCard
              label="Yesterday"
              revenue={data?.yesterday_performance?.revenue}
              byAdType={data?.yesterday_performance?.by_ad_type}
              showBreakdown={showBreakdown}
              color="purple"
              formatRevenue={formatRevenue}
            />
            <AdRevenueCard
              label="2 Days Ago"
              revenue={data?.two_days_ago_performance?.revenue}
              byAdType={data?.two_days_ago_performance?.by_ad_type}
              showBreakdown={showBreakdown}
              color="pink"
              formatRevenue={formatRevenue}
            />
          </div>

          <div className="mt-3 flex items-center pl-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 ml-1">
              Revenue is attributed sales (
              {AD_TYPE_ORDER.filter((t) => adTypesIncluded.includes(t))
                .map((t) => `${AD_TYPE_META[t].shortLabel}: ${data?.metadata?.attribution_windows?.[t] ?? "—"}`)
                .join(", ")}
              )
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Analytics                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1a2b3c] tracking-tight px-2">
            Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 py-6 gap-6">
            <div className="lg:col-span-3">
              <HourlyAdsRevenueChart
                hourlyTrend={data?.hourly_trend || null}
                metadata={data?.metadata || null}
                isLoading={isLoading}
              />
            </div>
            {/* <div className="lg:col-span-1">
              <TopCampaignsCard
                topCampaigns={data?.top_campaigns || null}
                isLoading={isLoading}
              />
            </div> */}
          </div>
        </div>

      </div>
    </div>
  );
}
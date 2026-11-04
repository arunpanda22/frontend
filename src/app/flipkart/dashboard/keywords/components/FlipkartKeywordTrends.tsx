"use client";

/**
 * Overall monthly trend charts of the Flipkart Keywords page: CTR, CVR and ROAS per month, account-wide.
 * Flipkart counterpart of Amazon's SQPOverallTrends, without a market line (Flipkart has none; the per-campaign
 * "vs baseline" lines are inside each campaign card).
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordTrends.tsx
 *
 * Data: GET keywords/trend/ through useKeywordTrend. One zero-filled point per calendar month; the current month is
 * month-to-date, so its last point can be lower than a full month would be.
 */
import React from "react";
import { useKeywordTrend } from "@/lib/hooks/queries/use-flipkart-keywords";
import FlipkartKeywordLineChart from "./FlipkartKeywordLineChart";
import { formatPercent, formatRoas } from "../utils/keywordFormat";

interface FlipkartKeywordTrendsProps {
  startDate: string;
  endDate: string;
  adsTenant?: string;
}

function ChartCard({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function FlipkartKeywordTrends({ startDate, endDate, adsTenant }: FlipkartKeywordTrendsProps) {
  const { data, isLoading, isError, error } = useKeywordTrend({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: adsTenant,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm font-semibold text-red-500">Failed to load the keyword trends</p>
        <p className="text-xs text-gray-400 mt-1">{(error as Error | null)?.message ?? "Please try again later"}</p>
      </div>
    );
  }

  // The API points extend the metrics type; recharts only needs a plain record.
  const timeline = data.timeline as unknown as Array<Record<string, string | number>>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Overall CTR trend">
        <FlipkartKeywordLineChart
          data={timeline}
          series={[{ key: "CTR", name: "CTR", color: "#1e40af" }]}
          formatValue={formatPercent}
        />
      </ChartCard>
      <ChartCard title="Overall CVR trend">
        <FlipkartKeywordLineChart
          data={timeline}
          series={[{ key: "CVR", name: "CVR", color: "#059669" }]}
          formatValue={formatPercent}
        />
      </ChartCard>
    </div>
  );
}
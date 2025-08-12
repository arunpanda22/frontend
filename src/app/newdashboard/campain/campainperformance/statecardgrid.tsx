import React, { useEffect, useState, useMemo } from "react";
import { FaUserFriends, FaFeather, FaShoppingCart, FaHeart, FaDollarSign, FaCoins, FaRedo, FaChartLine, FaEllipsisH, FaPercent } from "react-icons/fa";
import { useCampaignSummaryWithParams, useAdsSalesData } from '@/lib/hooks/queries/use-dashboard';
import type { CampaignSummaryItem } from '@/lib/api/services/dashboard.service';

function TrendBadge({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
      {positive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      {value}
    </span>
  );
}

function StatCard({ icon, label, value, trend, trendPositive }: { icon: any; label: string; value: string | number; trend?: string; trendPositive?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between min-w-[160px] sm:min-w-[220px] relative shadow-sm w-full">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          {icon}
          <span className="text-xs sm:text-sm">{label}</span>
        </div>
        <FaEllipsisH className="text-gray-300 text-lg" />
      </div>
      <div className="flex flex-col items-start gap-2 mt-2">
        <span className="text-xl sm:text-2xl font-bold text-gray-900">{value}</span>
        {trend && typeof trendPositive === "boolean" && <TrendBadge value={trend} positive={trendPositive} />}
      </div>
    </div>
  );
}

export default function StatCardGrid() {
  // Calculate date range for last 30 days
  const dateParams = useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  // Fetch real campaign and ads data
  const { data: campaignData, isLoading: campaignLoading, error: campaignError } = useCampaignSummaryWithParams(dateParams);
  const { data: adsSalesData, isLoading: adsLoading, error: adsError } = useAdsSalesData(dateParams);

  // Calculate aggregated stats from campaign data
  const cards = useMemo(() => {
    if (!campaignData || !adsSalesData) return [];

    // Aggregate campaign data
    const totalImpressions = campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.impressions || 0), 0);
    const totalClicks = campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.clicks || 0), 0);
    const totalAdCost = campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.ad_cost || 0), 0);
    const totalSales = campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.sales || 0), 0);
    const totalPurchases = campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.purchases || 0), 0);
    
    // Calculate averages
    const avgCTR = campaignData.length > 0 ? 
      campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.ctr_percent || 0), 0) / campaignData.length : 0;
    const avgACOS = campaignData.length > 0 ? 
      campaignData.reduce((sum: number, campaign: CampaignSummaryItem) => sum + (campaign.acos_percent || 0), 0) / campaignData.length : 0;

    // Use ads sales data for additional metrics
    const currentPeriod = adsSalesData.current_period || {};
    
    return [
      { 
        icon: <FaFeather />, 
        label: 'Impressions', 
        value: totalImpressions.toLocaleString(),
        trend: adsSalesData.changes?.Impressions ? `${adsSalesData.changes.Impressions > 0 ? '+' : ''}${adsSalesData.changes.Impressions.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.Impressions > 0
      },
      { 
        icon: <FaUserFriends />, 
        label: 'Clicks', 
        value: totalClicks.toLocaleString(),
        trend: adsSalesData.changes?.Clicks ? `${adsSalesData.changes.Clicks > 0 ? '+' : ''}${adsSalesData.changes.Clicks.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.Clicks > 0
      },
      { 
        icon: <FaDollarSign />, 
        label: 'Ad Cost', 
        value: `$${totalAdCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        trend: adsSalesData.changes?.Spend ? `${adsSalesData.changes.Spend > 0 ? '+' : ''}${adsSalesData.changes.Spend.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.Spend < 0 // Lower cost is better
      },
      { 
        icon: <FaCoins />, 
        label: 'Campaign Sales', 
        value: `$${totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        trend: adsSalesData.changes?.Sales ? `${adsSalesData.changes.Sales > 0 ? '+' : ''}${adsSalesData.changes.Sales.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.Sales > 0
      },
      { 
        icon: <FaShoppingCart />, 
        label: 'Orders', 
        value: totalPurchases.toLocaleString(),
        trend: adsSalesData.changes?.Orders ? `${adsSalesData.changes.Orders > 0 ? '+' : ''}${adsSalesData.changes.Orders.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.Orders > 0
      },
      { 
        icon: <FaPercent />, 
        label: 'Avg ACOS', 
        value: `${avgACOS.toFixed(2)}%`,
        trend: adsSalesData.changes?.ACOS ? `${adsSalesData.changes.ACOS > 0 ? '+' : ''}${adsSalesData.changes.ACOS.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.ACOS < 0 // Lower ACOS is better
      },
      { 
        icon: <FaPercent />, 
        label: 'Avg CTR', 
        value: `${avgCTR.toFixed(2)}%`,
        trend: adsSalesData.changes?.CTR ? `${adsSalesData.changes.CTR > 0 ? '+' : ''}${adsSalesData.changes.CTR.toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.CTR > 0
      },
      { 
        icon: <FaDollarSign />, 
        label: 'Total Sales', 
        value: `$${(currentPeriod.Sales || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        trend: adsSalesData.changes?.['Total Sales'] ? `${adsSalesData.changes['Total Sales'] > 0 ? '+' : ''}${adsSalesData.changes['Total Sales'].toFixed(1)}%` : undefined,
        trendPositive: adsSalesData.changes?.['Total Sales'] > 0
      }
    ];
  }, [campaignData, adsSalesData]);

  // Handle loading state
  if (campaignLoading || adsLoading) {
    return <div className="w-full text-center py-8">Loading campaign data...</div>;
  }

  // Handle error state
  if (campaignError || adsError) {
    return (
      <div className="w-full text-center py-8 text-red-600">
        Error loading campaign data: {campaignError?.message || adsError?.message}
      </div>
    );
  }

  if (!cards.length) return <div className="w-full text-center py-8">No campaign data available</div>;

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}

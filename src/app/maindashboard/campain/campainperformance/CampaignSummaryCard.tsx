import { FaEllipsisH } from "react-icons/fa";
import { useMemo } from 'react';
import { useCampaignSummaryWithParams } from '@/lib/hooks/queries/use-dashboard';
import type { CampaignSummaryItem } from '@/lib/api/services/dashboard.service';

export default function CampaignSummaryCard() {
  // Fetch real campaign data from API
  const dateParams = useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  const { data: campaignData, isLoading, error } = useCampaignSummaryWithParams(dateParams);

  // Calculate real campaign metrics
  const stats = useMemo(() => {
    if (!campaignData || campaignData.length === 0) return [];

    const totalCampaigns = campaignData.length;
    const activeCampaigns = campaignData.filter((c: CampaignSummaryItem) => (c.impressions || 0) > 0).length;
    const clickingCampaigns = campaignData.filter((c: CampaignSummaryItem) => (c.clicks || 0) > 0).length;
    const convertingCampaigns = campaignData.filter((c: CampaignSummaryItem) => (c.purchases || 0) > 0).length;
    const profitableCampaigns = campaignData.filter((c: CampaignSummaryItem) => (c.acos_percent || 0) < 30).length;

    return [
      {
        label: "Active",
        color: "bg-green-100 text-green-700",
        dot: "bg-green-500",
        value: totalCampaigns > 0 ? `${((activeCampaigns / totalCampaigns) * 100).toFixed(1)}%` : "0%",
        count: activeCampaigns,
        total: totalCampaigns
      },
      {
        label: "Getting Clicks",
        color: "bg-blue-100 text-blue-700", 
        dot: "bg-blue-500",
        value: totalCampaigns > 0 ? `${((clickingCampaigns / totalCampaigns) * 100).toFixed(1)}%` : "0%",
        count: clickingCampaigns,
        total: totalCampaigns
      },
      {
        label: "Converting",
        color: "bg-purple-100 text-purple-700",
        dot: "bg-purple-500", 
        value: totalCampaigns > 0 ? `${((convertingCampaigns / totalCampaigns) * 100).toFixed(1)}%` : "0%",
        count: convertingCampaigns,
        total: totalCampaigns
      },
      {
        label: "Profitable",
        color: "bg-yellow-100 text-yellow-700",
        dot: "bg-yellow-500",
        value: totalCampaigns > 0 ? `${((profitableCampaigns / totalCampaigns) * 100).toFixed(1)}%` : "0%",
        count: profitableCampaigns,
        total: totalCampaigns
      },
    ];
  }, [campaignData]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 w-full max-w-xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-16 bg-gray-100 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 w-full max-w-xl mx-auto">
        <div className="text-center text-red-600">
          <p>Failed to load campaign data</p>
          <p className="text-sm">{error?.message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 w-full max-w-xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-bold text-lg">Campaign Performance</h2>
        <FaEllipsisH className="text-gray-400" />
      </div>
      <div className="bg-blue-100 text-blue-700 rounded-lg p-3 mb-4 text-sm">
        Real-time analysis of your {campaignData?.length || 0} active advertising campaigns.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
          >
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${stat.color} mb-1 w-fit`}
            >
              <span className={`w-2 h-2 rounded-full mr-1 ${stat.dot}`}></span>
              {stat.label}
            </span>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.count}/{stat.total} campaigns</div>
          </div>
        ))}
      </div>
    </div>
  );
} 
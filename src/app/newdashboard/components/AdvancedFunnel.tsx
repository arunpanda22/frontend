"use client";
import React from 'react';
import { useAdsSalesData } from "@/lib/hooks/queries/use-dashboard";

// Define the structure of a metric
interface MetricData {
  title: string;
  value: string;
  change: string;
  changeUp: boolean;
}

const Metric: React.FC<MetricData> = ({ title, value, change, changeUp }) => (
  <div className="text-gray-800 flex-1">
    <div className="text-l md:text-xl text-gray-500">{title}</div>
    <div className="text-xl md:text-3xl font-bold my-1 text-gray-900">{value}</div>
    <div
      className="text-xs md:text-sm flex items-center"
      style={{ color: changeUp ? '#16a34a' : '#E3144D' }}
    >
      <span>{changeUp ? '↑' : '↓'}</span>
      <span className="ml-1">{change}</span>
    </div>
  </div>
);

// Helper function to format numbers and determine change direction
const formatMetric = (current: number, previous: number, isCurrency = false) => {
  // Handle undefined or null values
  if (current === undefined || current === null || previous === undefined || previous === null) {
    return { value: 'N/A', change: 'N/A', changeUp: true };
  }
  
  if (previous === 0) {
    return { value: (isCurrency ? '$' : '') + current.toFixed(2), change: 'N/A', changeUp: true };
  }
  const change = ((current - previous) / previous) * 100;
  const changeUp = change >= 0;
  const prefix = isCurrency ? '$' : '';
  
  const formatValue = (val: number) => {
    if (val === undefined || val === null) return 'N/A';
    if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(1)}K`;
    return `${prefix}${val.toFixed(2)}`;
  };
  
  return {
    value: formatValue(current),
    change: `${changeUp ? '+' : ''}${change.toFixed(1)}%`,
    changeUp
  };
};

export default function AdvancedFunnel() {
  // Calculate date range for last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Previous period (30 days before that)
  const prevEndDate = startDate;
  const prevStartDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Current period data
  const { data: currentData, isLoading: currentLoading, error: currentError } = useAdsSalesData({
    start_date: startDate,
    end_date: endDate,
    focus_level: 'all'
  });

  // Previous period data
  const { data: previousData, isLoading: previousLoading, error: previousError } = useAdsSalesData({
    start_date: prevStartDate,
    end_date: prevEndDate,
    focus_level: 'all'
  });

  const isLoading = currentLoading || previousLoading;
  const error = currentError || previousError;

  // Calculate metrics from API data
  const metrics = React.useMemo(() => {
    if (!currentData || !previousData) return null;

    const current = currentData.current_period || {};
    const previous = previousData.previous_period || {};

    // Calculate CPM (Cost Per Mille)
    const currentImpressions = current.Impressions || 0;
    const currentAdCost = current.Spend || 0;
    const currentCPM = currentImpressions > 0 ? (currentAdCost / currentImpressions) * 1000 : 0;
    
    const previousImpressions = previous.Impressions || 0;
    const previousAdCost = previous.Spend || 0;
    const previousCPM = previousImpressions > 0 ? (previousAdCost / previousImpressions) * 1000 : 0;

    // Calculate CTR (Click Through Rate)
    const currentClicks = current.Clicks || 0;
    const currentCTR = currentImpressions > 0 ? (currentClicks / currentImpressions) * 100 : 0;
    
    const previousClicks = previous.Clicks || 0;
    const previousCTR = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0;

    // Calculate CPC (Cost Per Click)
    const currentCPC = currentClicks > 0 ? currentAdCost / currentClicks : 0;
    const previousCPC = previousClicks > 0 ? previousAdCost / previousClicks : 0;

    // Calculate Conversion Rate
    const currentOrders = current.Orders || 0;
    const currentConvRate = currentClicks > 0 ? (currentOrders / currentClicks) * 100 : 0;
    
    const previousOrders = previous.Orders || 0;
    const previousConvRate = previousClicks > 0 ? (previousOrders / previousClicks) * 100 : 0;

    return {
      impressions: { title: 'Impressions', ...formatMetric(currentImpressions, previousImpressions) },
      avgCPM: { title: 'Avg. CPM', ...formatMetric(currentCPM, previousCPM, true) },
      clicks: { title: 'Clicks', ...formatMetric(currentClicks, previousClicks) },
      ctr: { title: 'CTR', value: `${currentCTR.toFixed(2)}%`, change: `vs ${previousCTR.toFixed(2)}%`, changeUp: currentCTR >= previousCTR },
      avgCPC: { title: 'Avg. CPC', ...formatMetric(currentCPC, previousCPC, true) },
      conversions: { title: 'Conversions', ...formatMetric(currentOrders, previousOrders) },
      convRate: { title: 'Conv. rate', value: `${currentConvRate.toFixed(2)}%`, change: `vs ${previousConvRate.toFixed(2)}%`, changeUp: currentConvRate >= previousConvRate },
      adsSales: { title: 'Ads Sales', ...formatMetric(currentAdCost, previousAdCost, true) },
    };
  }, [currentData, previousData]);

  if (isLoading) {
    return (
      <div className="w-full p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error || !metrics) {
    return <div className="text-red-500 w-full text-center p-4">Error: {error?.message || 'Failed to load data'}</div>;
  }

  return (
    <div className="w-full p-4 flex flex-col md:flex-row items-center gap-6 md:gap-8">
      <style jsx>{`
        .funnel-section {
          transition: all 0.3s ease-in-out;
          cursor: pointer;
          transform-origin: center;
          transform-box: fill-box;
        }
        .funnel-section:hover {
          transform: scale(1.05);
          filter: brightness(1.15);
        }
      `}</style>
      {/* Left side: Metric sections */}
      <div className="flex flex-col gap-6 flex-1 w-full">
        {/* Impressions Section */}
        <div className="border-t-4 px-4 pt-4 flex justify-around gap-4" style={{ borderTopColor: '#E3144D' }}>
          <Metric {...metrics.impressions} />
          <Metric {...metrics.avgCPM} />
        </div>
        {/* Clicks Section */}
        <div className="border-t-4 px-4 border-blue-500 pt-4 flex justify-around gap-4">
          <Metric {...metrics.clicks} />
          <Metric {...metrics.ctr} />
          <Metric {...metrics.avgCPC} />
        </div>
        {/* Conversions Section */}
        <div className="border-t-4 px-4 border-blue-500 pt-4 flex justify-around gap-4">
          <Metric {...metrics.conversions} />
          <Metric {...metrics.convRate} />
          <Metric {...metrics.adsSales} />
        </div>
      </div>

      {/* Right side: Funnel SVG */}
      <div className="w-full md:w-1/3 h-48 md:h-full">
        <svg viewBox="0 0 200 220" className="w-full h-full">
          <g className="funnel-section">
            <path d="M 10 30 C 10 10, 190 10, 190 30 L 170 80 C 170 90, 30 90, 30 80 Z" fill="#E3144D" />
            <ellipse cx="100" cy="30" rx="90" ry="15" fill="#C51244" />
            <text x="100" y="65" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">VISIBILITY</text>
          </g>
          <g className="funnel-section">
            <path d="M 30 80 C 30 90, 170 90, 170 80 L 150 140 C 150 150, 50 150, 50 140 Z" fill="#2563eb" />
            <text x="100" y="120" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">ENGAGEMENT</text>
          </g>
          <g className="funnel-section">
            <path d="M 50 140 C 50 150, 150 150, 150 140 L 130 200 C 130 210, 70 210, 70 200 Z" fill="#60a5fa" />
            <text x="100" y="180" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CONVERSION</text>
          </g>
        </svg>
      </div>
    </div>
  );
} 
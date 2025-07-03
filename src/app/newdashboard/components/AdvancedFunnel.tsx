"use client";
import React, { useState, useEffect } from 'react';

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
  if (previous === 0) {
    return { value: (isCurrency ? '$' : '') + current.toFixed(2), change: 'N/A', changeUp: true };
  }
  const change = ((current - previous) / previous) * 100;
  const changeUp = change >= 0;
  const prefix = isCurrency ? '$' : '';
  
  const formatValue = (val: number) => {
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
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/add_and_sale_ads.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || data.length === 0) {
          throw new Error("No data found in JSON file.");
        }

        const current = data.find((d: any) => d.Period === 'Current');
        const previous = data.find((d: any) => d.Period === 'Previous');

        if (!current || !previous) {
          throw new Error("Could not find 'Current' or 'Previous' period data in JSON file.");
        }
        
        // Calculate missing values
        current['Avg. CPM'] = (current['Ad Cost'] / current.Impressions) * 1000;
        previous['Avg. CPM'] = (previous['Ad Cost'] / previous.Impressions) * 1000;

        const formattedMetrics = {
          impressions: { title: 'Impressions', ...formatMetric(current.Impressions, previous.Impressions) },
          avgCPM: { title: 'Avg. CPM', ...formatMetric(current['Avg. CPM'], previous['Avg. CPM'], true) },
          clicks: { title: 'Clicks', ...formatMetric(current.Clicks, previous.Clicks) },
          ctr: { title: 'CTR', value: `${current['CTR%'].toFixed(2)}%`, change: `vs ${previous['CTR%'].toFixed(2)}%`, changeUp: current['CTR%'] >= previous['CTR%'] },
          avgCPC: { title: 'Avg. CPC', ...formatMetric(current.CPC, previous.CPC, true) },
          conversions: { title: 'Conversions', ...formatMetric(current['Ads Quantity'], previous['Ads Quantity']) },
          convRate: { title: 'Conv. rate', value: `${current['Conversion%'].toFixed(2)}%`, change: `vs ${previous['Conversion%'].toFixed(2)}%`, changeUp: current['Conversion%'] >= previous['Conversion%'] },
          adsSales: { title: 'Ads Sales', ...formatMetric(current['Ads Sales'], previous['Ads Sales'], true) },
        };

        setMetrics(formattedMetrics);
      } catch (e: any) {
        setError(e.message);
        console.error("Failed to fetch or process campaign data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500 w-full text-center p-4">Error: {error}</div>;
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
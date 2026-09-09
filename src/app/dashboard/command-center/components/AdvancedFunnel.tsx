"use client";
import React from "react";
import { useDateRange } from '@/lib/context/DateRangeContext';
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useAdsSalesData } from "@/lib/hooks/queries/use-dashboard";

interface MetricData {
  title: string;
  value: string;
  change: string;
  changeUp: boolean;
}

const Metric: React.FC<MetricData> = ({ title, value, change, changeUp }) => (
  <div className="text-gray-800 flex-1">
    <div className="text-sm  text-gray-500">{title}</div>
    <div className="text-lg md:text-xl font-bold my-1 text-gray-900">{value}</div>
    <div
      className="text-xs md:text-xs flex items-center"
      style={{ color: changeUp ? "#16a34a" : "#dc2626" }}
    >
      <span>{changeUp ? "↑" : "↓"}</span>
      <span className="ml-1">{change}</span>
    </div>
  </div>
);

export default function AdvancedFunnel() {
  const { dateRange } = useDateRange();
  const { formatCurrency, formatNumber, formatPercentage, formatChange } = useCurrency();
  
  const endDate = dateRange.endDate || new Date().toISOString().split("T")[0];
  const startDate = dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: apiResponse, isLoading, error } = useAdsSalesData({
    start_date: startDate,
    end_date: endDate,
    focus_level: "all",
  });

  if (isLoading) {
    return (
      <div className="w-full p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ocean-500"></div>
      </div>
    );
  }

  if (error || !apiResponse) {
    return (
      <div className="text-red-500 w-full text-center p-4">
        <div className="text-lg font-semibold">Unable to load funnel data</div>
        <div className="text-sm mt-2">
          {error?.message || "Please try refreshing or check your connection"}
        </div>
      </div>
    );
  }

  const { current_period, previous_period, changes } = apiResponse;

  const metrics = {
    impressions: {
      title: "Impressions",
      value: formatNumber(current_period.Impressions),
      change: formatChange(changes.Impressions),
      changeUp: changes.Impressions >= 0
    },
    avgCPM: {
      title: "Avg. CPM",
      value: formatCurrency(current_period.CPM),
      change: formatChange(changes.CPM),
      changeUp: changes.CPM >= 0
    },
    adCost: {
      title: "Ad cost",
      value: formatNumber(current_period.Spend),
      change: formatChange(changes.Spend),
      changeUp: changes.Spend >= 0
    },
    clicks: {
      title: "Clicks",
      value: formatNumber(current_period.Clicks),
      change: formatChange(changes.Clicks),
      changeUp: changes.Clicks >= 0
    },
    ctr: {
      title: "CTR",
      value: formatPercentage(current_period.CTR),
      change: formatChange(changes.CTR),
      changeUp: changes.CTR >= 0
    },
    avgCPC: {
      title: "Avg. CPC",
      value: formatCurrency(current_period.CPC),
      change: formatChange(changes.CPC),
      changeUp: changes.CPC >= 0
    },
    orders: {
      title: "Total Units",
      value: formatNumber(current_period["Total Order Items"]),
      change: formatChange(changes["Total Order Items"]),
      changeUp: changes.Orders >= 0
    },
    convRate: {
      title: "Conv. Rate",
      value: formatPercentage(current_period.CVR),
      change: formatChange(changes.CVR),
      changeUp: changes.CVR >= 0
    },
    adsSales: {
      title: "Ads Sales",
      value: formatNumber(current_period.Sales),
      change: formatChange(changes.Sales),
      changeUp: changes.Sales >= 0
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-semibold text-gray-900">
            Advanced Funnel
          </h6>
          <div className="text-xs text-gray-500">
            {startDate} to {endDate}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1">
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

        <div className="w-full flex md:flex-row flex-col items-center gap-6 md:gap-8 h-full">
          {/* Metrics */}
          <div className="flex flex-col gap-6 flex-1 w-full">
            {/* Visibility Stage */}
            <div className="border-t-4 border-ocean-300 px-4 pt-4 flex justify-around gap-4">
              <Metric {...metrics.impressions} />
              <Metric {...metrics.avgCPM} />
              <Metric {...metrics.adCost} />
            </div>
            
            {/* Engagement Stage */}
            <div className="border-t-4 border-ocean-500 px-4 pt-4 flex justify-around gap-4">
              <Metric {...metrics.clicks} />
              <Metric {...metrics.ctr} />
              <Metric {...metrics.avgCPC} />
            </div>
            
            {/* Conversion Stage */}
            <div className="border-t-4 border-ocean-700 px-4 pt-4 flex justify-around gap-4">
              <Metric {...metrics.orders} />
              <Metric {...metrics.convRate} />
              <Metric {...metrics.adsSales} />
            </div>
          </div>

          {/* Funnel SVG */}
          <div className="w-full md:w-1/3 h-56 md:h-full flex items-center justify-center">
            <svg viewBox="0 0 200 240" className="w-full h-full max-h-80">
              {/* Visibility Stage - Light Blue */}
              <g className="funnel-section">
                <path
                  d="M 10 30 C 10 10, 190 10, 190 30 L 170 80 C 170 90, 30 90, 30 80 Z"
                  fill="#7EAEED"
                />
                <ellipse cx="100" cy="30" rx="90" ry="15" fill="#4F94DE" />
                <text
                  x="100"
                  y="68"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  VISIBILITY
                </text>
              </g>
              
              {/* Engagement Stage - Medium Blue */}
              <g className="funnel-section">
                <path
                  d="M 30 80 C 30 90, 170 90, 170 80 L 150 140 C 150 150, 50 150, 50 140 Z"
                  fill="#407AB8"
                />
                <text
                  x="100"
                  y="120"
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  ENGAGEMENT
                </text>
              </g>
              
              {/* Conversion Stage - Dark Blue */}
              <g className="funnel-section">
                <path
                  d="M 50 140 C 50 150, 150 150, 150 140 L 130 200 C 130 210, 70 210, 70 200 Z"
                  fill="#234871"
                />
                <text
                  x="100"
                  y="178"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                >
                  CONVERSION
                </text>
              </g>
            </svg>
          </div>
        </div>  
      </div>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useAdsSalesData } from "@/lib/hooks/queries/use-dashboard";

// Mock chart data, as the API doesn't provide time series for the mini chart
const chartData = [
  { value: 3000 },
  { value: 3200 },
  { value: 3100 },
  { value: 3600 },
  { value: 4000 },
];

// Helper functions
const parseNumber = (str: string) => parseFloat(String(str).replace(/,/g, ''));
const parsePercent = (str: string) => parseFloat(String(str).replace(/%/g, ''));
const formatToK = (num: number) => `₹${(num / 1000).toFixed(0)}k`;

const ChangeText = ({ value }: { value: string }) => {
  if (!value) return null;
  const isPositive = value.startsWith('+');
  return <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{value}</p>;
};

const RevenueCard = () => {
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

  // Debug logging
  console.log('RevenueCard - Current data:', currentData);
  console.log('RevenueCard - Previous data:', previousData);

  const isLoading = currentLoading || previousLoading;
  const error = currentError || previousError;

  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 w-[300px] max-w-md mx-auto animate-pulse">
        <div className="h-2 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (error || !currentData || !previousData) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 w-[300px] max-w-md mx-auto">
        <div className="text-red-500 text-center">
          <p>Failed to load revenue data</p>
          <p className="text-sm text-gray-500">{error?.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Calculate metrics from API data
  const currentPeriod = currentData.current_period;
  const previousPeriod = previousData.previous_period;

  const currentTotalSales = currentPeriod?.Sales || 0;
  const previousTotalSales = previousPeriod?.Sales || 0;
  const salesChange = previousTotalSales > 0 
    ? ((currentTotalSales - previousTotalSales) / previousTotalSales) * 100 
    : 0;

  const currentAdSales = currentPeriod?.Spend || 0; // Using Spend as proxy for ad sales
  const previousAdSales = previousPeriod?.Spend || 0;
  const adSalesChange = previousAdSales > 0 
    ? ((currentAdSales - previousAdSales) / previousAdSales) * 100 
    : 0;

  const currentOrganicSales = currentTotalSales - currentAdSales;
  const previousOrganicSales = previousTotalSales - previousAdSales;
  const organicSalesChange = previousOrganicSales > 0 
    ? ((currentOrganicSales - previousOrganicSales) / previousOrganicSales) * 100 
    : 0;

  const adSalesPercent = currentTotalSales > 0 ? (currentAdSales / currentTotalSales) * 100 : 0;
  const organicSalesPercent = currentTotalSales > 0 ? (currentOrganicSales / currentTotalSales) * 100 : 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-6 bg-yellow-400 rounded" />
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
          <h2 className="text-2xl font-bold">{formatToK(currentTotalSales)}</h2>
          <p className="text-gray-500 text-sm">{formatToK(previousTotalSales)}</p>
          <ChangeText value={`${salesChange > 0 ? '+' : ''}${salesChange.toFixed(1)}%`} />
        </div>

        {/* Chart */}
        <div className="w-24 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#FACC15"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full flex mt-4 h-4 rounded-full overflow-hidden text-xs font-semibold">
        <div style={{ width: `${adSalesPercent}%` }} className="bg-pink-600 text-center text-white flex items-center justify-center">
            {adSalesPercent.toFixed(1)}%
        </div>
        <div style={{ width: `${organicSalesPercent}%` }} className="bg-yellow-400 text-center text-black flex items-center justify-center">
            {organicSalesPercent.toFixed(1)}%
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="flex justify-between mt-6">
        <div className="text-left">
          <p className="text-sm text-gray-600">Ad Revenue</p>
          <h3 className="text-xl font-bold">{formatToK(currentAdSales)}</h3>
          <p className="text-gray-500 text-sm">{formatToK(previousAdSales)}</p>
          <ChangeText value={`${adSalesChange > 0 ? '+' : ''}${adSalesChange.toFixed(1)}%`} />
        </div>

        <div className="border-l mx-4" />

        <div className="text-left">
          <p className="text-sm text-gray-600">Organic Revenue</p>
          <h3 className="text-xl font-bold">{formatToK(currentOrganicSales)}</h3>
          <p className="text-gray-500 text-sm">{formatToK(previousOrganicSales)}</p>
          <ChangeText value={`${organicSalesChange > 0 ? '+' : ''}${organicSalesChange.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;
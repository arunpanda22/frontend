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
const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

const ChangeText = ({ value }: { value: string }) => {
  if (!value) return null;
  const isPositive = value.startsWith('+');
  return <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{value}</p>;
};

const QuantityCard = () => {
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
          <p>Failed to load quantity data</p>
          <p className="text-sm text-gray-500">{error?.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Calculate metrics from API data
  const currentPeriod = currentData.current_period;
  const previousPeriod = previousData.previous_period;

  // Using orders as proxy for quantity since the API doesn't provide direct quantity data
  const currentTotalQuantity = currentPeriod?.Orders || 0;
  const previousTotalQuantity = previousPeriod?.Orders || 0;
  const quantityChange = previousTotalQuantity > 0 
    ? ((currentTotalQuantity - previousTotalQuantity) / previousTotalQuantity) * 100 
    : 0;

  // Estimate ad vs organic quantity based on ad cost vs total sales ratio
  const currentAdCost = currentPeriod?.Spend || 0;
  const currentTotalSales = currentPeriod?.Sales || 1; // Avoid division by zero
  const adCostRatio = currentTotalSales > 0 ? currentAdCost / currentTotalSales : 0;
  const currentAdQuantity = Math.round(currentTotalQuantity * adCostRatio);
  const currentOrganicQuantity = currentTotalQuantity - currentAdQuantity;

  const previousAdCost = previousPeriod?.Spend || 0;
  const previousTotalSales = previousPeriod?.Sales || 1; // Avoid division by zero
  const previousAdQuantity = Math.round(previousTotalQuantity * (previousAdCost / previousTotalSales));
  const previousOrganicQuantity = previousTotalQuantity - previousAdQuantity;

  const adQuantityPercent = currentTotalQuantity > 0 ? (currentAdQuantity / currentTotalQuantity) * 100 : 0;
  const organicQuantityPercent = currentTotalQuantity > 0 ? (currentOrganicQuantity / currentTotalQuantity) * 100 : 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-6 bg-blue-600 rounded" />
            <p className="text-sm text-gray-500">Total Quantity</p>
          </div>
          <h2 className="text-2xl font-bold">{formatNumber(currentTotalQuantity)}</h2>
          <p className="text-gray-500 text-sm">{formatNumber(previousTotalQuantity)}</p>
          <ChangeText value={`${quantityChange > 0 ? '+' : ''}${quantityChange.toFixed(1)}%`} />
        </div>

        {/* Chart */}
        <div className="w-24 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1976d2"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full flex mt-4 h-4 rounded-full overflow-hidden text-xs font-semibold">
        <div style={{ width: `${adQuantityPercent}%` }} className="bg-pink-600 text-center text-white flex items-center justify-center">
          {adQuantityPercent.toFixed(1)}%
        </div>
        <div style={{ width: `${organicQuantityPercent}%` }} className="bg-blue-600 text-center text-white flex items-center justify-center">
          {organicQuantityPercent.toFixed(1)}%
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="flex justify-between mt-6">
        <div className="text-left">
          <p className="text-sm text-gray-600">Ad Quantity</p>
          <h3 className="text-xl font-bold">{formatNumber(currentAdQuantity)}</h3>
          <p className="text-gray-500 text-sm">{formatNumber(previousAdQuantity)}</p>
          <ChangeText value={`${adCostRatio > 0 ? '+' : ''}${(adCostRatio * 100).toFixed(1)}%`} />
        </div>

        <div className="border-l mx-4" />

        <div className="text-left">
          <p className="text-sm text-gray-600">Organic Quantity</p>
          <h3 className="text-xl font-bold">{formatNumber(currentOrganicQuantity)}</h3>
          <p className="text-gray-500 text-sm">{formatNumber(previousOrganicQuantity)}</p>
          <ChangeText value={`${(1 - adCostRatio) > 0 ? '+' : ''}${((1 - adCostRatio) * 100).toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
};

export default QuantityCard;

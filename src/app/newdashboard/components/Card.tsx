"use client";
import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/add_sales.json');
        const jsonData = await response.json();
        
        const salesMetrics = {
          current: jsonData.sales_metrics.find((d: any) => d.Period === 'Current'),
          previous: jsonData.sales_metrics.find((d: any) => d.Period === 'Previous'),
          change: jsonData.sales_metrics.find((d: any) => d.Period === 'Change %'),
        };

        const adsPerformance = {
          current: jsonData.ads_performance.find((d: any) => d.Period === 'Current'),
          previous: jsonData.ads_performance.find((d: any) => d.Period === 'Previous'),
          change: jsonData.ads_performance.find((d: any) => d.Period === 'Change %'),
        };

        setData({ salesMetrics, adsPerformance });
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 w-[300px] max-w-md mx-auto animate-pulse">
        <div className="h-2 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }
  
  const { salesMetrics, adsPerformance } = data;
  
  const adSalesPercent = parsePercent(adsPerformance.current['Ads Sales %']);
  const organicSalesPercent = parsePercent(salesMetrics.current['Organic Sales %']);

  return (
    <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-6 bg-yellow-400 rounded" />
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
          <h2 className="text-2xl font-bold">{formatToK(parseNumber(salesMetrics.current['Total Sales']))}</h2>
          <p className="text-gray-500 text-sm">{formatToK(parseNumber(salesMetrics.previous['Total Sales']))}</p>
          <ChangeText value={salesMetrics.change['Total Sales']} />
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
          <h3 className="text-xl font-bold">{formatToK(parseNumber(adsPerformance.current['Ads Sales']))}</h3>
          <p className="text-gray-500 text-sm">{formatToK(parseNumber(adsPerformance.previous['Ads Sales']))}</p>
          <ChangeText value={adsPerformance.change['Ads Sales']} />
        </div>

        <div className="border-l mx-4" />

        <div className="text-left">
          <p className="text-sm text-gray-600">Organic Revenue</p>
          <h3 className="text-xl font-bold">{formatToK(parseNumber(salesMetrics.current['Organic_Sales']))}</h3>
          <p className="text-gray-500 text-sm">{formatToK(parseNumber(salesMetrics.previous['Organic_Sales']))}</p>
          <ChangeText value={salesMetrics.change['Organic_Sales']} />
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;
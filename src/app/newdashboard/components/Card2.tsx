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
const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

const ChangeText = ({ value }: { value: string }) => {
  if (!value) return null;
  const isPositive = value.startsWith('+');
  return <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{value}</p>;
};

const QuantityCard = () => {
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
        console.error("Failed to fetch quantity data:", error);
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

  const totalQuantity = parseNumber(salesMetrics.current['Total Quantity']);
  const adQuantity = parseNumber(adsPerformance.current['Ads Quantity']);
  const organicQuantity = parseNumber(salesMetrics.current['Organic_Quantity']);

  const adQuantityPercent = totalQuantity > 0 ? (adQuantity / totalQuantity) * 100 : 0;
  const organicQuantityPercent = totalQuantity > 0 ? (organicQuantity / totalQuantity) * 100 : 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-6 bg-blue-600 rounded" />
            <p className="text-sm text-gray-500">Total Quantity</p>
          </div>
          <h2 className="text-2xl font-bold">{formatNumber(totalQuantity)}</h2>
          <p className="text-gray-500 text-sm">{formatNumber(parseNumber(salesMetrics.previous['Total Quantity']))}</p>
          <ChangeText value={salesMetrics.change['Total Quantity']} />
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
          <h3 className="text-xl font-bold">{formatNumber(adQuantity)}</h3>
          <p className="text-gray-500 text-sm">{formatNumber(parseNumber(adsPerformance.previous['Ads Quantity']))}</p>
          <ChangeText value={adsPerformance.change['Ads Quantity']} />
        </div>

        <div className="border-l mx-4" />

        <div className="text-left">
          <p className="text-sm text-gray-600">Organic Quantity</p>
          <h3 className="text-xl font-bold">{formatNumber(organicQuantity)}</h3>
          <p className="text-gray-500 text-sm">{formatNumber(parseNumber(salesMetrics.previous['Organic_Quantity']))}</p>
          <ChangeText value={salesMetrics.change['Organic_Quantity']} />
        </div>
      </div>
    </div>
  );
};

export default QuantityCard;

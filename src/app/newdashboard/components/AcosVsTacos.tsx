"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import React from "react";
import { useWeeklyData } from "@/lib/hooks/queries/use-dashboard";

interface ChartData {
  name: string;
  ACOS: number;
  TACOS: number;
}

interface AcosVsTacosChartProps {
  acosColor?: string;
  tacosColor?: string;
  height?: number;
}

export default function AcosVsTacosChart({
  acosColor = "#0047AB",
  tacosColor = "#FFB800",
  height = 320,
}: AcosVsTacosChartProps) {
  // Fetch weekly data for ACOS and TACOS
  const { data: weeklyData, isLoading, error } = useWeeklyData({
    focus_level: 'all',
    aggregation: 'monthly'
  });

  // Transform API data to chart format
  const data: ChartData[] = React.useMemo(() => {
    if (!weeklyData) return [];

    // Handle both possible response structures
    const dataArray = Array.isArray(weeklyData) ? weeklyData : weeklyData.weekly_data;
    
    if (!dataArray || !Array.isArray(dataArray)) {
      console.log('No valid data array found in AcosVsTacos:', weeklyData);
      return [];
    }

    const formatMonth = (dateString: string) => {
      // Handle the format "Aug - 25" or "Jul - 25"
      if (dateString.includes(' - ')) {
        const [month, year] = dateString.split(' - ');
        return `${month} '${year}`;
      }
      
      // Fallback for other date formats
      try {
        const [year, month] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        if (isNaN(date.getTime())) {
          // If date parsing fails, return the original string
          return dateString;
        }
        return date.toLocaleString('default', { month: 'short' }) + " '" + year.substring(2);
      } catch (error) {
        // If any error occurs, return the original string
        return dateString;
      }
    };

    return dataArray
      .map((d: any) => {
        const acosValue = parseFloat(d["ACOS%"] || "0");
        const tacosValue = parseFloat(d["TACOS%"] || "0");
        
        if (isNaN(acosValue) || isNaN(tacosValue)) return null;
        
        return {
          name: formatMonth(d.time_group),
          ACOS: acosValue,
          TACOS: tacosValue,
        };
      })
      .filter(Boolean) as ChartData[];
  }, [weeklyData]);

  if (isLoading) {
    return (
      <div className={`w-full flex items-center justify-center`} style={{ height }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full flex items-center justify-center`} style={{ height }}>
        <p className="text-red-500">Failed to load chart data</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`w-full flex items-center justify-center`} style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  return (
    <div className={`w-full`} style={{ height }}>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="ACOS" fill={acosColor} />
          <Bar dataKey="TACOS" fill={tacosColor} />
        </BarChart>
      </ResponsiveContainer>
      {/* Custom Legend */}
      <div className="flex items-center gap-6 mt-2 px-8">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: acosColor }} />
          <span className="text-xs text-gray-600 font-medium">ACOS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: tacosColor }} />
          <span className="text-xs text-gray-600 font-medium">TACOS</span>
        </div>
      </div>
    </div>
  );
}

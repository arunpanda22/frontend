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
import React, { useEffect, useState } from "react";

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
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [acosResponse, tacosResponse] = await Promise.all([
          fetch("/acos.json"),
          fetch("/tacos.json"),
        ]);

        if (!acosResponse.ok || !tacosResponse.ok) {
          throw new Error("Failed to fetch ACOS or TACOS data");
        }

        const acosData = await acosResponse.json();
        const tacosData = await tacosResponse.json();

        const tacosMap = new Map(
          tacosData.map((d: any) => [d.time_group, d["TACOS%"]])
        );

        const formatMonth = (dateString: string) => {
          const [year, month] = dateString.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleString('default', { month: 'short' }) + " '" + year.substring(2);
        };
        
        const chartData = acosData
          .map((d: any) => {
            const tacosValue = tacosMap.get(d.time_group);
            if (typeof tacosValue === 'number') {
              return {
                name: formatMonth(d.time_group),
                ACOS: parseFloat(d["ACOS%"]) * 100,
                TACOS: tacosValue * 100,
              };
            }
            return null;
          })
          .filter(Boolean) as ChartData[];

        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        setError("Failed to load chart data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`w-full flex items-center justify-center`} style={{ height }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full flex items-center justify-center`} style={{ height }}>
        <p className="text-red-500">{error}</p>
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

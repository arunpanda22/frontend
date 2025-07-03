"use client";

import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper to format large numbers
const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(num);
const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num);
const formatPercent = (num: number) => `${(num * 100).toFixed(2)}%`;

interface PerformanceData {
  date: string;
  impressions: number;
  spend: number;
  clicks: number;
  sales: number;
}

interface StatCardProps {
  title: string;
  value: string;
  color: string;
  options: { key: string; label: string }[];
  onSelect: (key: string) => void;
  currentValue: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, options, onSelect, currentValue }) => (
  <DropdownMenu>
    <div className="flex flex-col">
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer">
          <span>{title}</span>
          <ChevronDown className="w-4 h-4" />
          <Info className="w-4 h-4" />
        </div>
      </DropdownMenuTrigger>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }}></span>
        <span className="text-2xl font-bold text-gray-800">{value}</span>
      </div>
    </div>
    <DropdownMenuContent>
      {options.map((option) => (
        <DropdownMenuCheckboxItem
          key={option.key}
          checked={currentValue === option.key}
          onSelect={(event) => {
            event.preventDefault();
            onSelect(option.key);
          }}
        >
          {option.label}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const ALL_METRICS: { [key: string]: { title: string; format: (val: number) => string; color: string } } = {
  clicks: { title: 'Clicks', format: formatNumber, color: '#6d28d9' },
  spend: { title: 'Spend', format: formatCurrency, color: '#0d9488' },
  impressions: { title: 'Impressions', format: formatNumber, color: '#db2777' },
  sales: { title: 'Sales', format: formatCurrency, color: '#2563eb' },
  ctr: { title: 'CTR', format: formatPercent, color: '#6d28d9' },
  cpc: { title: 'CPC', format: formatCurrency, color: '#0d9488' },
  acos: { title: 'ACOS', format: formatPercent, color: '#2563eb' },
};

const CARD_OPTIONS = [
  [{ key: 'clicks', label: 'Clicks' }, { key: 'ctr', label: 'CTR' }],
  [{ key: 'spend', label: 'Spend' }, { key: 'cpc', label: 'CPC' }],
  [{ key: 'impressions', label: 'Impressions' }],
  [{ key: 'sales', label: 'Sales' }, { key: 'acos', label: 'ACOS' }],
];

export default function PerformanceChart() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [totals, setTotals] = useState({ clicks: 0, spend: 0, impressions: 0, sales: 0, ctr: 0, cpc: 0, acos: 0 });
  const [loading, setLoading] = useState(true);
  const [cardMetricKeys, setCardMetricKeys] = useState(['clicks', 'spend', 'impressions', 'sales']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/performance_data.json');
        const chartData: PerformanceData[] = await response.json();
        setData(chartData);

        const newTotals = chartData.reduce((acc, item) => ({
          clicks: acc.clicks + item.clicks,
          spend: acc.spend + item.spend,
          impressions: acc.impressions + item.impressions,
          sales: acc.sales + item.sales,
        }), { clicks: 0, spend: 0, impressions: 0, sales: 0 });

        const derivedTotals = {
          ...newTotals,
          ctr: newTotals.impressions ? newTotals.clicks / newTotals.impressions : 0,
          cpc: newTotals.clicks ? newTotals.spend / newTotals.clicks : 0,
          acos: newTotals.sales ? newTotals.spend / newTotals.sales : 0,
        };
        setTotals(derivedTotals);

      } catch (error) {
        console.error("Failed to fetch performance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMetricChange = (cardIndex: number, metricKey: string) => {
    const newKeys = [...cardMetricKeys];
    newKeys[cardIndex] = metricKey;
    setCardMetricKeys(newKeys);
  };

  const tickFormatter = (value: number) => {
    if (value >= 1000) return `${value / 1000}K`;
    return value.toString();
  };

  const currencyTickFormatter = (value: number) => `₹${tickFormatter(value)}`;

  if (loading) return <div className="w-full h-96 flex items-center justify-center"><p>Loading Chart...</p></div>;

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {cardMetricKeys.map((key, index) => {
          const metric = ALL_METRICS[key];
          const value = totals[key as keyof typeof totals];
          return (
            <StatCard
              key={index}
              title={metric.title}
              value={metric.format(value)}
              color={metric.color}
              options={CARD_OPTIONS[index]}
              onSelect={(newKey) => handleMetricChange(index, newKey)}
              currentValue={key}
            />
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="spend" orientation="left" stroke="#0d9488" tick={{ fontSize: 12 }} tickFormatter={currencyTickFormatter} />
            <YAxis yAxisId="impressions" orientation="left" stroke="#db2777" tick={{ fontSize: 12 }} tickFormatter={tickFormatter} className="ml-10" />
            <YAxis yAxisId="sales" orientation="right" stroke="#2563eb" tick={{ fontSize: 12 }} tickFormatter={currencyTickFormatter} />
            <YAxis yAxisId="clicks" orientation="right" stroke="#6d28d9" tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            
            <Tooltip
              formatter={(value, name) => {
                const names = {
                  'spend': formatCurrency(value as number),
                  'impressions': formatNumber(value as number),
                  'sales': formatCurrency(value as number),
                  'clicks': formatNumber(value as number),
                };
                const stringName = String(name);
                return [names[stringName as keyof typeof names], stringName.charAt(0).toUpperCase() + stringName.slice(1)];
              }}
            />

            <Bar dataKey="impressions" yAxisId="impressions" fill="#f9a8d4" barSize={20} />
            <Line type="monotone" dataKey="spend" yAxisId="spend" stroke="#0d9488" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sales" yAxisId="sales" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="clicks" yAxisId="clicks" stroke="#6d28d9" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
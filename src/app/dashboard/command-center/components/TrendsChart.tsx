"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/chartcard';
import { useTrendsData } from '@/lib/hooks/queries/use-dashboard';

// State components
const LoadingState = () => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

const ErrorState = ({ error }: { error?: Error | null }) => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-red-600 text-xl">!</span>
      </div>
      <p className="font-semibold text-gray-900">Error loading data</p>
      {error && <p className="text-sm text-gray-500">{error.message}</p>}
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="w-full h-96 flex items-center justify-center">
    <p className="text-gray-600">{message}</p>
  </div>
);

// KPI Options
const KPI_OPTIONS = [
  // Advertising
  { id: 'impressions', title: 'Impressions', keys: ['impressions'], format: 'number', color: '#ADC8F3', category: 'Advertising' },
  { id: 'clicks', title: 'Clicks', keys: ['clicks'], format: 'number', color: '#1E40AF', category: 'Advertising' },
  { id: 'ctr', title: 'CTR %', keys: ['CTR%'], format: 'percent', color: '#60A5FA', category: 'Advertising' },
  { id: 'cpc', title: 'CPC', keys: ['CPC'], format: 'currency', color: '#0EA5E9', category: 'Advertising' },
  { id: 'cost', title: 'Cost', keys: ['cost'], format: 'currency', color: '#06B6D4', category: 'Advertising' },
  { id: 'conversion', title: 'Conversion %', keys: ['CVR%'], format: 'percent', color: '#0D9488', category: 'Advertising' },
  { id: 'acos', title: 'ACOS %', keys: ['ACOS%'], format: 'percent', color: '#F95482', category: 'Advertising' },
  { id: 'tacos', title: 'TACOS%', keys: ['TACOS%'], format: 'percent', color: '#27FFCC', category: 'Advertising' },
  { id: 'cpa', title: 'CPA', keys: ['CPA'], format: 'currency', color: '#0891B2', category: 'Advertising' },
  
  // Sales
  { id: 'ad_sales', title: 'Ads Sales', keys: ['sales_30d'], format: 'currency', color: '#E41F66', category: 'Sales' },
  { id: 'purchases', title: 'Purchases', keys: ['purchases_30d'], format: 'number', color: '#059669', category: 'Sales' },
  { id: 'asp', title: 'ASP', keys: ['Sales ASP'], format: 'currency', color: '#047857', category: 'Sales' },
  { id: 'totalSales', title: 'Total Sales', keys: ['Total Sales'], format: 'currency', color: '#00E0B2', category: 'Sales' },
  
  // Inventory
  { id: 'totalQuantity', title: 'Total Quantity', keys: ['Total Quantity'], format: 'number', color: '#F59E0B', category: 'Inventory' },
] as const;

type KPIKey = typeof KPI_OPTIONS[number]['id'];

const TrendsChart = () => {
  // State management
  const [chartMetrics, setChartMetrics] = useState<KPIKey[]>(['impressions','ad_sales', 'totalSales']);
  const [period, setPeriod] = useState<'30' | '90'>('30');
  const [focusLevel, setFocusLevel] = useState<'high' | 'medium' | 'low' | 'all'>('all');
  const [metricsFilterOpen, setMetricsFilterOpen] = useState(false);
  const metricsFilterRef = useRef<HTMLDivElement>(null);

  // Fetch data from API
  const { data, isLoading, isError, error } = useTrendsData({
    period: period,
    focus_level: focusLevel
  });

  const dataset = data?.trends_data || [];

  // Close dropdown when clicking outside 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricsFilterRef.current && !metricsFilterRef.current.contains(event.target as Node)) {
        setMetricsFilterOpen(false);
      }
    };

    if (metricsFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [metricsFilterOpen]);

  // Parse and prepare chart data
  const chartData = useMemo(() => {
    const safeParse = (val: any, format: 'number' | 'currency' | 'percent') => {
      if (val === undefined || val === null) return 0;
      const str = val.toString().replace(/,/g, '').replace('%', '');
      if (str.toLowerCase() === 'nan' || str === '') return 0;
      return format === 'percent' ? parseFloat(str) : Number(str);
    };

    const initialData = KPI_OPTIONS.reduce((acc, kpi) => ({ ...acc, [kpi.id]: [] }), {} as Record<KPIKey, number[]>);
    
    if (!dataset.length) {
      return { labels: [], data: initialData, processedData: [] };
    }

    const data: Record<KPIKey, number[]> = { ...initialData };
    const labels = dataset.map((d) => d.time_group);

    // Process data for each KPI
    for (const kpi of KPI_OPTIONS) {
      const keyToUse = kpi.keys.find(key => dataset[0]?.[key] !== undefined);
      if (keyToUse) {
        const dataArray = dataset.map(item => safeParse(item[keyToUse], kpi.format));
        data[kpi.id] = dataArray;
      }
    }

    // Create processed data for recharts
    const processedData = dataset.map((item, idx) => {
      const row: any = { date: item.time_group };
      for (const kpi of KPI_OPTIONS) {
        row[kpi.id] = data[kpi.id][idx];
      }
      return row;
    });

    return { labels, data, processedData };
  }, [dataset]);

  // Group KPIs by category
  const groupedKPIs = useMemo(() => {
    type GroupedKPI = { category: string; items: Array<typeof KPI_OPTIONS[number]> };
    return KPI_OPTIONS.reduce((acc: GroupedKPI[], kpi) => {
      const group = acc.find(g => g.category === kpi.category);
      if (group) {
        group.items.push(kpi);
      } else {
        acc.push({ category: kpi.category, items: [kpi] });
      }
      return acc;
    }, [] as GroupedKPI[]);
  }, []);

  const handleChartMetricToggle = (id: KPIKey) => {
    setChartMetrics(prev => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter(m => m !== id) : prev;
      } else {
        return prev.length < 4 ? [...prev, id] : prev;
      }
    });
  };

  const getYAxisConfig = (metricCount: number) => {
    const positions: Record<number, Array<{ index: number; yAxisId: string; orientation: 'left' | 'right' }>> = {
      1: [{ index: 0, yAxisId: 'right', orientation: 'right' }],
      2: [
        { index: 0, yAxisId: 'left', orientation: 'left' },
        { index: 1, yAxisId: 'right', orientation: 'right' },
      ],
      3: [
        { index: 0, yAxisId: 'left', orientation: 'left' },
        { index: 1, yAxisId: 'right', orientation: 'right' },
        { index: 2, yAxisId: 'right2', orientation: 'right' },
      ],
      4: [
        { index: 0, yAxisId: 'left', orientation: 'left' },
        { index: 1, yAxisId: 'left2', orientation: 'left' },
        { index: 2, yAxisId: 'right', orientation: 'right' },
        { index: 3, yAxisId: 'right2', orientation: 'right' },
      ],
    };
    return positions[metricCount] || positions[1];
  };

  const yAxisConfig = getYAxisConfig(chartMetrics.length);

  // Loading and error states
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;
  if (!dataset?.length) return <EmptyState message="No data available" />;

  return (
    <div className="w-full p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Trends Analysis</h1>
        <p className="text-gray-600 mt-2">
          {period === '30' ? 'Daily trends over the last 30 days' : 'Weekly trends over the last 90 days'}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-t-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Metrics Filter */}
          <div className="relative" ref={metricsFilterRef}>
            <button
              onClick={() => setMetricsFilterOpen(!metricsFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Filter Metrics ({chartMetrics.length}/4)</span>
              <ChevronDown size={16} className={`transition-transform ${metricsFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {metricsFilterOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-10 p-4">
                <div className="grid grid-cols-2 gap-6 min-w-96">
                  {groupedKPIs.map(group => (
                    <div key={group.category}>
                      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 pb-2 border-b border-gray-200">
                        {group.category}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map(kpi => (
                          <label
                            key={kpi.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={chartMetrics.includes(kpi.id as KPIKey)}
                              onChange={() => handleChartMetricToggle(kpi.id as KPIKey)}
                              disabled={chartMetrics.length === 1 && chartMetrics.includes(kpi.id as KPIKey)}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: kpi.color }} />
                              <span className="text-sm text-gray-700">{kpi.title}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  Selected: {chartMetrics.length} / 4 metrics (min 1, max 4)
                </div>
              </div>
            )}
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod('30')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === '30'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('90')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === '90'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="shadow-md rounded-b-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            {chartMetrics.map((m, idx) => {
              const kpi = KPI_OPTIONS.find(k => k.id === m);
              return (
                <span key={m} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: kpi?.color }} />
                  <span>{kpi?.title}</span>
                  {idx < chartMetrics.length - 1 && <span className="text-gray-400">•</span>}
                </span>
              );
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={chartData.processedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                angle={period === '30' ? -45 : 0}
                textAnchor={period === '30' ? 'end' : 'middle'}
                height={period === '30' ? 80 : 30}
                tick={{ fontSize: 12 }}
              />

              {yAxisConfig.map(config => {
                const metric = chartMetrics[config.index];
                const kpi = KPI_OPTIONS.find(k => k.id === metric);

                return (
                  <YAxis
                    key={config.yAxisId}
                    yAxisId={config.yAxisId}
                    orientation={config.orientation}
                    stroke={kpi?.color}
                    width={80}
                  />
                );
              })}

              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />

              {chartMetrics.map((metricId, index) => {
                const kpi = KPI_OPTIONS.find(k => k.id === metricId);
                const config = yAxisConfig[index];
                const isImpressionsBar = metricId === 'impressions';

                if (isImpressionsBar) {
                  return (
                    <Bar
                      key={metricId}
                      yAxisId={config.yAxisId}
                      dataKey={metricId}
                      fill={kpi?.color}
                      name={kpi?.title}
                      opacity={0.8}
                      radius={[8, 8, 0, 0]}
                    />
                  );
                }

                return (
                  <Line
                    key={metricId}
                    yAxisId={config.yAxisId}
                    type="monotone"
                    dataKey={metricId}
                    stroke={kpi?.color}
                    strokeWidth={2.5}
                    dot={{ fill: kpi?.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={kpi?.title}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendsChart;
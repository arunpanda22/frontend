"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';
import type { Range } from 'react-date-range';
import { useWeeklyData } from '@/lib/hooks/queries/use-dashboard';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/chartcard';

// State components (using your existing ones)
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

// KPI Options with categories
const KPI_OPTIONS = [
  // Advertising
  { id: 'impressions', title: 'Impressions', keys: ['impressions'], format: 'number', color: '#3B82F6', category: 'Advertising' },
  { id: 'clicks', title: 'Clicks', keys: ['clicks'], format: 'number', color: '#1E40AF', category: 'Advertising' },
  { id: 'ctr', title: 'CTR %', keys: ['CTR%'], format: 'percent', color: '#60A5FA', category: 'Advertising' },
  { id: 'cpc', title: 'CPC', keys: ['CPC'], format: 'currency', color: '#0EA5E9', category: 'Advertising' },
  { id: 'cost', title: 'Cost', keys: ['cost'], format: 'currency', color: '#06B6D4', category: 'Advertising' },
  { id: 'conversion', title: 'Conversion %', keys: ['CVR%'], format: 'percent', color: '#0D9488', category: 'Advertising' },
  { id: 'acos', title: 'ACOS %', keys: ['ACOS%'], format: 'percent', color: '#EC4899', category: 'Advertising' },
  { id: 'cpa', title: 'CPA', keys: ['CPA'], format: 'currency', color: '#0891B2', category: 'Advertising' },
  { id: 'sales', title: 'Sales', keys: ['sales_30d'], format: 'currency', color: '#10B981', category: 'Advertising' },
] as const;

type KPIKey = typeof KPI_OPTIONS[number]['id'];

const DEFAULT_METRICS: KPIKey[] = ['impressions', 'clicks', 'ctr', 'acos'];

const getMetricIcon = (metricId: KPIKey) => {
  const iconProps = { size: 24, className: "text-gray-400" };
  const kpi = KPI_OPTIONS.find(k => k.id === metricId);
  
  if (kpi?.category === 'Advertising') return <TrendingUp {...iconProps} />;
  return <DollarSign {...iconProps} />;
};

interface AdsTimeLineChartProps {
  dateRange?: Range;
}

const AdsTimeLineChart: React.FC<AdsTimeLineChartProps> = ({ dateRange }) => {
  // Currency context
  const { formatCurrency, formatNumber, isLoading: isCurrencyLoading, error: currencyError } = useCurrency();

  // State management
  const [cardMetrics, setCardMetrics] = useState<KPIKey[]>(DEFAULT_METRICS);
  const [chartMetrics, setChartMetrics] = useState<KPIKey[]>(['impressions', 'clicks']);
  const [granularity, setGranularity] = useState<'weeklysails' | 'monthlysails'>('monthlysails');
  const [metricsFilterOpen, setMetricsFilterOpen] = useState(false);
  const metricsFilterRef = useRef<HTMLDivElement>(null);

  // API data fetching
  const { data: weeklyApiData, isLoading, isError, error } = useWeeklyData({
    focus_level: 'all',
    aggregation: granularity === 'monthlysails' ? 'monthly' : 'weekly',
  });

  // Date range filtering
  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  // Currency formatting functions with fallback
  const formatCurrencyValue = (value: number) => {
    if (isCurrencyLoading) return "Loading...";
    if (currencyError) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return formatCurrency(value);
  };

  const formatNumberValue = (value: number) => {
    if (isCurrencyLoading) return "Loading...";
    return formatNumber(value);
  };

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

  // Transform API data to match the expected format
  const dataset = useMemo(() => {
    if (!weeklyApiData) return [];
    const dataArray = Array.isArray(weeklyApiData) ? weeklyApiData : weeklyApiData.weekly_data;
    if (!dataArray || !Array.isArray(dataArray)) return [];
    return dataArray;
  }, [weeklyApiData]);

  // Parse and prepare chart data
  const chartData = useMemo(() => {
    const safeParse = (val: any, format: 'number' | 'currency' | 'percent') => {
      if (val === undefined || val === null) return 0;
      const str = val.toString().replace(/,/g, '').replace('%', '');
      if (str.toLowerCase() === 'nan' || str === '') return 0;
      return format === 'percent' ? parseFloat(str) : Number(str);
    };

    const initialData = KPI_OPTIONS.reduce((acc, kpi) => ({ ...acc, [kpi.id]: [] }), {} as Record<KPIKey, number[]>);
    const initialTotals = KPI_OPTIONS.reduce((acc, kpi) => ({ ...acc, [kpi.id]: 0 }), {} as Record<KPIKey, number>);
    
    if (!dataset.length) {
      return { labels: [], data: initialData, totals: initialTotals, processedData: [] };
    }

    // Filter dataset by date range if selected
    let filtered = dataset;
    if (startDate && endDate) {
      const start = new Date(startDate.setHours(0, 0, 0, 0));
      const end = new Date(endDate.setHours(23, 59, 59, 999));
      filtered = dataset.filter((d) => {
        const date = new Date(d.time_group);
        if (isNaN(date.getTime())) return true;
        return date >= start && date <= end;
      });
    }

    const data: Record<KPIKey, number[]> = { ...initialData };
    const totals: Record<KPIKey, number> = { ...initialTotals };
    const labels = filtered.map((d) => d.time_group);

    // Process data for each KPI
    for (const kpi of KPI_OPTIONS) {
      const keyToUse = kpi.keys.find(key => filtered[0]?.[key] !== undefined);
      if (keyToUse) {
        const dataArray = filtered.map(item => safeParse(item[keyToUse], kpi.format));
        data[kpi.id] = dataArray;
        
        if (kpi.format === 'percent') {
          totals[kpi.id] = dataArray[dataArray.length - 1] ?? 0;
        } else {
          totals[kpi.id] = dataArray.reduce((sum, val) => sum + val, 0);
        }
      }
    }

    // Create processed data for recharts
    const processedData = filtered.map((item, idx) => {
      const row: any = { date: item.time_group };
      for (const kpi of KPI_OPTIONS) {
        row[kpi.id] = data[kpi.id][idx];
      }
      return row;
    });

    return { labels, data, totals, processedData };
  }, [dataset, granularity, startDate, endDate]);

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

  const handleCardMetricChange = (index: number, newMetric: KPIKey) => {
    const newMetrics = [...cardMetrics];
    newMetrics[index] = newMetric;
    setCardMetrics(newMetrics);
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
  if (!dataset?.length) return <EmptyState message="No data available for the selected period" />;

  return (
    <div className="w-full space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ads Timeline</h2>
        <p className="text-gray-600 mt-1">Performance trends over time</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
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
                <div className="grid grid-cols-1 gap-6 min-w-80">
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

          {/* Granularity Selector */}
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'weeklysails' | 'monthlysails')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <option value="weeklysails">Weekly</option>
            <option value="monthlysails">Monthly</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardMetrics.slice(0, 4).map((metricId, index) => {
          const kpi = KPI_OPTIONS.find(k => k.id === metricId);
          if (!kpi) return null;

          const value = chartData.totals[metricId];
          
          const formatValue = () => {
            if (kpi.format === 'currency') {
              return formatCurrencyValue(value);
            } else if (kpi.format === 'number') {
              return formatNumberValue(value);
            } else if (kpi.format === 'percent') {
              return `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
            }
            return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
          };

          return (
            <Card 
              key={index}
              className="hover:shadow-lg transition-shadow border-l-4"
              style={{ 
                backgroundColor: `${kpi.color}20`,
                borderLeftColor: kpi.color
              }}
            >
              <CardHeader className="pb-0 pt-1 px-3">
                <div className="flex items-start justify-between gap-0">
                  <select
                    value={metricId}
                    onChange={(e) => handleCardMetricChange(index, e.target.value as KPIKey)}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-none p-0 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                  >
                    {KPI_OPTIONS.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex-shrink-0">
                    {getMetricIcon(metricId)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-0 px-3 pt-0">
                <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.category}</p>
              </CardContent>
            </Card>
          );
        })}
      </div> */}

      {/* Chart */}
      <Card className="shadow-md">
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
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData.processedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />

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

export default AdsTimeLineChart;
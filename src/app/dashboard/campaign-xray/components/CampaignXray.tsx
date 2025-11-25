"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, TrendingUp, DollarSign, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/chartcard';
import { FilterDropdown } from '@/components/dashboard/ui/FilterDropdown';
import { useCampaignXrayData } from '@/lib/hooks/queries/use-dashboard';
import { useCurrency } from '@/lib/context/CurrencyContext';

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

// KPI Options with categories
const KPI_OPTIONS = [
  // Sales Metrics
  { id: 'total_sales', title: 'Total Sales', keys: ['Total Sales'], format: 'currency', color: '#b7094c', category: 'Sales' },
  { id: 'total_quantity', title: 'Total Quantity', keys: ['Total Quantity'], format: 'number', color: '#bdb2ff', category: 'Sales' },
  { id: 'sales_asp', title: 'Sales ASP', keys: ['Sales ASP'], format: 'currency', color: '#95d5b2', category: 'Sales' },
  
  // Advertising Metrics
  { id: 'impressions', title: 'Impressions', keys: ['impressions'], format: 'number', color: '#00d5be', category: 'Advertising' },
  { id: 'clicks', title: 'Clicks', keys: ['clicks'], format: 'number', color: '#1E40AF', category: 'Advertising' },
  { id: 'ctr', title: 'CTR %', keys: ['CTR%'], format: 'percent', color: '#60A5FA', category: 'Advertising' },
  { id: 'cpc', title: 'CPC', keys: ['CPC'], format: 'currency', color: '#0EA5E9', category: 'Advertising' },
  { id: 'cost', title: 'Cost', keys: ['cost'], format: 'currency', color: '#06B6D4', category: 'Advertising' },
  { id: 'cvr', title: 'CVR %', keys: ['CVR%'], format: 'percent', color: '#0D9488', category: 'Advertising' },
  { id: 'acos', title: 'ACOS %', keys: ['ACOS%'], format: 'percent', color: '#EC4899', category: 'Advertising' },
  { id: 'cpa', title: 'CPA', keys: ['CPA'], format: 'currency', color: '#0891B2', category: 'Advertising' },
  { id: 'sales_30d', title: 'Ad Sales (30d)', keys: ['sales_30d'], format: 'currency', color: '#8B5CF6', category: 'Advertising' },
  { id: 'purchases_30d', title: 'Purchases (30d)', keys: ['purchases_30d'], format: 'number', color: '#7C3AED', category: 'Advertising' },
  
  // Traffic Metrics
//   { id: 'sessions', title: 'Sessions', keys: ['traffic_by_asin_sessions'], format: 'number', color: '#F59E0B', category: 'Traffic' },
//   { id: 'mobile_sessions', title: 'Mobile Sessions', keys: ['traffic_by_asin_mobile_app_sessions'], format: 'number', color: '#D97706', category: 'Traffic' },
//   { id: 'conversion_pct', title: 'Conversion %', keys: ['Conversion%'], format: 'percent', color: '#F97316', category: 'Traffic' },
//   { id: 'orders', title: 'Orders', keys: ['sales_by_asin_total_order_items'], format: 'number', color: '#EA580C', category: 'Traffic' },
] as const;

type KPIKey = typeof KPI_OPTIONS[number]['id'];

const DEFAULT_METRICS: KPIKey[] = ['total_sales', 'impressions', 'clicks', 'acos'];

const getMetricIcon = (metricId: KPIKey) => {
  const iconProps = { size: 24, className: "text-gray-400" };
  const kpi = KPI_OPTIONS.find(k => k.id === metricId);
  
  if (kpi?.category === 'Sales') return <DollarSign {...iconProps} />;
  if (kpi?.category === 'Advertising') return <TrendingUp {...iconProps} />;
  return <Search {...iconProps} />;
};

interface CampaignXrayChartProps {
  focusLevel?: 'high' | 'medium' | 'low' | 'all';
}

const CampaignXrayChart: React.FC<CampaignXrayChartProps> = ({ focusLevel = 'all' }) => {
  // Currency context
  const { formatCurrency, formatNumber, isLoading: isCurrencyLoading, error: currencyError } = useCurrency();

  // State management
  const [cardMetrics, setCardMetrics] = useState<KPIKey[]>(DEFAULT_METRICS);
  const [chartMetrics, setChartMetrics] = useState<KPIKey[]>(['total_sales', 'impressions']);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [metricsFilterOpen, setMetricsFilterOpen] = useState(false);
  const metricsFilterRef = useRef<HTMLDivElement>(null);

  // API data fetching
  const { data: xrayApiData, isLoading, isError, error } = useCampaignXrayData({
    campaign_names: selectedCampaigns,
    focus_level: focusLevel,
  });

  // Extract data from API response
  const xrayData = useMemo(() => {
    if (!xrayApiData) return [];
    return xrayApiData.xray_data || [];
  }, [xrayApiData]);

  const availableCampaigns = useMemo(() => {
    if (!xrayApiData) return [];
    return (xrayApiData.available_campaigns || []).map((name: string) => ({
      id: name,
      label: name
    }));
  }, [xrayApiData]);

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
    
    if (!xrayData.length) {
      return { labels: [], data: initialData, totals: initialTotals, processedData: [] };
    }

    const data: Record<KPIKey, number[]> = { ...initialData };
    const totals: Record<KPIKey, number> = { ...initialTotals };
    const labels = xrayData.map((d) => d.time_group);

    // Process data for each KPI
    for (const kpi of KPI_OPTIONS) {
      const keyToUse = kpi.keys.find(key => xrayData[0]?.[key] !== undefined);
      if (keyToUse) {
        const dataArray = xrayData.map(item => safeParse(item[keyToUse], kpi.format));
        data[kpi.id] = dataArray;
        
        if (kpi.format === 'percent') {
          totals[kpi.id] = dataArray[dataArray.length - 1] ?? 0;
        } else {
          totals[kpi.id] = dataArray.reduce((sum, val) => sum + val, 0);
        }
      }
    }

    // Create processed data for recharts
    const processedData = xrayData.map((item, idx) => {
      const row: any = { date: item.time_group };
      for (const kpi of KPI_OPTIONS) {
        row[kpi.id] = data[kpi.id][idx];
      }
      return row;
    });

    return { labels, data, totals, processedData };
  }, [xrayData]);

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

  const handleCampaignFilterApply = (selectedIds: (string | number)[]) => {
    setSelectedCampaigns(selectedIds as string[]);
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
  if (!xrayData?.length) return <EmptyState message="No data available for the selected period" />;

  return (
    <div className="w-full space-y-6 bg-white shadow rounded-xl p-6">

      {/* Controls */}
      <div className="bg-white rounded-lg border border-g p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Campaign Filter */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Campaign ({selectedCampaigns.length} selected)
            </label>
            <FilterDropdown
              items={availableCampaigns}
              selectedItems={selectedCampaigns}
              onApply={handleCampaignFilterApply}
              placeholder="Search campaigns..."
              maxHeight="max-h-80"
              width="w-full"
            />
          </div>

          {/* Metrics Filter */}
          <div className="relative" ref={metricsFilterRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Metrics
            </label>
            <button
              onClick={() => setMetricsFilterOpen(!metricsFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border bg-white border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Filter Metrics ({chartMetrics.length}/4)</span>
              <ChevronDown size={16} className={`transition-transform ${metricsFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {metricsFilterOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-10 p-4">
                <div className="grid grid-cols-1 gap-6 min-w-80 max-h-96 overflow-y-auto">
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
        </div>
      </div>

      {/* Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            {/* {chartMetrics.map((m, idx) => {
              const kpi = KPI_OPTIONS.find(k => k.id === m);
              return (
                <span key={m} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: kpi?.color }} />
                  <span>{kpi?.title}</span>
                  {idx < chartMetrics.length - 1 && <span className="text-gray-400">•</span>}
                </span>
              );
            })} */}
            {selectedCampaigns.length > 0 && (
              <span className="text-sm text-gray-500">
                ({selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''} selected)
              </span>
            )}
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
                const isBar = metricId === 'impressions';

                if (isBar) {
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
                    strokeWidth={2}
                    dot={{ fill: kpi?.color, r: 2 }}
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

export default CampaignXrayChart;
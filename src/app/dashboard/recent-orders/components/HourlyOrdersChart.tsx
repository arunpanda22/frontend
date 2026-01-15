'use client'

import React, { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[450px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  ),
})

interface HourlyDataPoint {
  date: string;
  hour: string;
  period: string;
  seller_quantity: number;
  vendor_quantity: number;
  total_quantity: number;
  seller_revenue: number;
  vendor_revenue: number;
  total_revenue: number;
  timestamp: string;
}

interface HourlyTotals {
  today: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
  yesterday: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
  day_before_yesterday: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
}

interface HourlyOrdersChartProps {
  hourlyData: HourlyDataPoint[] | null;
  hourlyTotals?: HourlyTotals | null;
  isLoading?: boolean;
}

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[month - 1]} ${day}`;
  } catch {
    return dateStr;
  }
};

const formatRevenue = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const HourlyOrdersChart = ({ hourlyData, hourlyTotals, isLoading = false }: HourlyOrdersChartProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  const lineColors = ['#3B82F6', '#8B5CF6', '#EC4899'];
  const barColors = ['#60A5FA', '#A78BFA'];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return {
        series: [],
        categories: Array.from({ length: 24 }, (_, i) => i.toString()),
        dates: { today: '', yesterday: '', dayBefore: '' },
        totals: { today: 0, yesterday: 0, dayBefore: 0 },
        timeLabels: [],
        lastAvailableHour: null
      };
    }

    const dataByDate = hourlyData.reduce((acc, point) => {
      if (!acc[point.date]) {
        acc[point.date] = [];
      }
      acc[point.date].push(point);
      return acc;
    }, {} as Record<string, HourlyDataPoint[]>);

    const dates = Object.keys(dataByDate).sort((a, b) => b.localeCompare(a));
    
    const todayDate = dates[0] || '';
    const yesterdayDate = dates[1] || '';
    const dayBeforeDate = dates[2] || '';

    const getHourIndex = (hour: string, period: string): number => {
      let h = parseInt(hour);
      if (period === 'AM') {
        return h === 12 ? 0 : h;
      } else {
        return h === 12 ? 12 : h + 12;
      }
    };

    let lastAvailableHour = -1;
    if (todayDate && dataByDate[todayDate]) {
      dataByDate[todayDate].forEach(point => {
        const hourIndex = getHourIndex(point.hour, point.period);
        if (hourIndex > lastAvailableHour) {
          lastAvailableHour = hourIndex;
        }
      });
    }

    const createDayTotalData = (date: string, limitToLastAvailable: boolean = false) => {
      const dayData = new Array(24).fill(0);
      const datePoints = dataByDate[date] || [];
      
      datePoints.forEach(point => {
        const hourIndex = getHourIndex(point.hour, point.period);
        dayData[hourIndex] = point.total_quantity;
      });

      if (limitToLastAvailable && lastAvailableHour >= 0) {
        for (let i = lastAvailableHour + 1; i < 24; i++) {
          dayData[i] = null;
        }
      }

      return dayData;
    };

    const createTodaySplitData = () => {
      const sellerData = new Array(24).fill(0);
      const vendorData = new Array(24).fill(0);
      const datePoints = dataByDate[todayDate] || [];
      
      datePoints.forEach(point => {
        const hourIndex = getHourIndex(point.hour, point.period);
        sellerData[hourIndex] = point.seller_quantity;
        vendorData[hourIndex] = point.vendor_quantity;
      });

      if (lastAvailableHour >= 0) {
        for (let i = lastAvailableHour + 1; i < 24; i++) {
          sellerData[i] = null;
          vendorData[i] = null;
        }
      }

      return { sellerData, vendorData };
    };

    const todayTotalData = createDayTotalData(todayDate, true);
    const yesterdayTotalData = createDayTotalData(yesterdayDate, false);
    const dayBeforeTotalData = createDayTotalData(dayBeforeDate, false);
    
    const { sellerData: todaySellerData, vendorData: todayVendorData } = createTodaySplitData();

    const total_today = todayTotalData.filter(v => v !== null).reduce((sum, v) => sum + (v || 0), 0);
    const total_yesterday = yesterdayTotalData.reduce((sum, v) => sum + v, 0);
    const total_day_before = dayBeforeTotalData.reduce((sum, v) => sum + v, 0);

    const categories = Array.from({ length: 24 }, (_, i) => i.toString());

    const timeLabels = Array(24).fill('');
    const availableDate = todayDate || yesterdayDate || dayBeforeDate;
    if (availableDate && dataByDate[availableDate]) {
      dataByDate[availableDate].forEach(point => {
        const hourIndex = getHourIndex(point.hour, point.period);
        timeLabels[hourIndex] = point.timestamp;
      });
    }

    const series = [
      {
        name: `Today Total (${formatDateShort(todayDate)})`,
        data: todayTotalData,
        type: 'line' as const,
      },
      {
        name: `Yesterday (${formatDateShort(yesterdayDate)})`,
        data: yesterdayTotalData,
        type: 'line' as const,
      },
      {
        name: `2 Days Ago (${formatDateShort(dayBeforeDate)})`,
        data: dayBeforeTotalData,
        type: 'line' as const,
      },
      {
        name: 'Today - Seller',
        data: todaySellerData,
        type: 'column' as const,
      },
      {
        name: 'Today - Vendor',
        data: todayVendorData,
        type: 'column' as const,
      },
    ];

    return {
      series,
      categories,
      dates: {
        today: todayDate,
        yesterday: yesterdayDate,
        dayBefore: dayBeforeDate,
      },
      totals: {
        today: total_today,
        yesterday: total_yesterday,
        dayBefore: total_day_before,
      },
      timeLabels,
      lastAvailableHour: lastAvailableHour >= 0 ? lastAvailableHour : null
    };
  }, [hourlyData]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      height: 400,
      type: 'line',
      stacked: false,
      zoom: { enabled: false },
      toolbar: {
        show: true,
        tools: { 
          download: true, 
          zoom: false, 
          zoomin: false, 
          zoomout: false, 
          pan: false, 
          reset: false 
        }
      },
      animations: { 
        enabled: true, 
        easing: 'easeinout', 
        speed: 800 
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [3, 3, 3, 0, 0],
      curve: 'smooth',
      dashArray: [0, 8, 4, 0, 0],
    },
    plotOptions: {
      bar: {
        columnWidth: '40%',
        dataLabels: {
          position: 'top',
        }
      },
    },
    title: {
      text: 'Orders by Hour - Last 3 Days',
      align: 'left',
      style: { 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: '#1a2b3c' 
      }
    },
    legend: {
      show: false,
    },
    markers: { 
      size: [0, 0, 0, 0, 0],
      hover: { sizeOffset: 6 } 
    },
    xaxis: {
      categories: chartData.categories,
      title: { 
        text: 'Hour of Day', 
        style: { 
          fontSize: '13px', 
          fontWeight: 600, 
          color: '#374151' 
        } 
      },
      labels: {
        rotate: -45,
        style: { 
          fontSize: '11px', 
          colors: '#6b7280' 
        }
      },
    },
    yaxis: {
      title: { 
        text: 'Number of Orders', 
        style: { 
          fontSize: '13px', 
          fontWeight: 600, 
          color: '#374151' 
        } 
      },
      labels: {
        formatter: (val) => val?.toFixed(0) || '0',
      },
      min: 0,
    },
    grid: { 
      show: true,
      borderColor: '#f3f4f6',
      strokeDashArray: 3,
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (val, opts) => {
          const hourIndex = opts?.dataPointIndex ?? (typeof val === 'number' ? val : parseInt(String(val)));
          return chartData.timeLabels[hourIndex] || `${hourIndex}:00`;
        },
      },
      y: {
        formatter: (val) => {
          if (val === null || val === undefined) {
            return 'No data';
          }
          return val.toFixed(0) + ' orders';
        },
      },
    },
    colors: [...lineColors, ...barColors],
    annotations: chartData.lastAvailableHour !== null ? {
      xaxis: [
        {
          x: chartData.lastAvailableHour,
          borderColor: '#3b82f6',
          borderWidth: 2,
          strokeDashArray: 4,
          label: {
            text: 'Current Hour',
            style: {
              color: '#fff',
              background: '#3b82f6',
              fontSize: '10px',
            },
          },
        },
      ],
    } : undefined,
  }), [chartData, lineColors, barColors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading hourly data...</p>
        </div>
      </div>
    );
  }

  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-2xl shadow-lg">
        <p className="text-sm text-gray-500">No hourly data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Today's Revenue</p>
          {hourlyTotals?.today && (
            <p className="text-2xl font-bold text-blue-600">
              {formatRevenue(hourlyTotals.today.revenue)}
            </p>
          )}
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Yesterday's Revenue</p>
          {hourlyTotals?.yesterday && (
            <p className="text-2xl font-bold text-purple-500">
              {formatRevenue(hourlyTotals.yesterday.revenue)}
            </p>
          )}
        </div>
        <div className="text-center p-3 bg-pink-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">2 Days Ago Revenue</p>
          {hourlyTotals?.day_before_yesterday && (
            <p className="text-2xl font-bold text-pink-500">
              {formatRevenue(hourlyTotals.day_before_yesterday.revenue)}
            </p>
          )}
        </div>
      </div>

      {isMounted && (
        <div id="hybrid-orders-chart">
          <ReactApexChart
            options={options}
            series={chartData.series}
            type="line"
            height={400}
            width="100%"
          />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Today Total (Line)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500"></div>
            <span className="text-gray-600">Yesterday (Line)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dotted border-pink-500"></div>
            <span className="text-gray-600">2 Days Ago (Line)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-gray-600">Today Seller (Bar)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-400 rounded"></div>
            <span className="text-gray-600">Today Vendor (Bar)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyOrdersChart;
'use client'

import React, { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import useChartColors from '@/lib/hooks/useChartColors'
import { ApexOptions } from 'apexcharts'
import type { HourlyDataPoint } from '@/lib/hooks/useRealtimeOrders'

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  ),
})

interface HourlyOrdersChartProps {
  hourlyData: HourlyDataPoint[] | null;
  isLoading?: boolean;
}

const HourlyOrdersChart = ({ hourlyData, isLoading = false }: HourlyOrdersChartProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Chart colors: solid (today), dashed (yesterday), dotted (day before)
  const chartsColor = useChartColors({ 
    chartColors: '[bg-blue-500, bg-purple-500, bg-pink-500]',
    chartDarkColors: '[bg-blue-400, bg-purple-400, bg-pink-400]'
  });

  // Wait for component to mount before rendering chart
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get current hour to limit today's data
  const currentHour = useMemo(() => new Date().getHours(), []);

  // Prepare chart data
  const { series, categories, metadata, timeLabels } = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return {
        series: [],
        categories: Array.from({ length: 24 }, (_, i) => i.toString()),
        metadata: { today_date: '', yesterday_date: '', day_before_date: '', total_today: 0, total_yesterday: 0, total_day_before: 0 },
        timeLabels: []
      };
    }

    // Group data by date
    const dataByDate = hourlyData.reduce((acc, point) => {
      if (!acc[point.date]) {
        acc[point.date] = [];
      }
      acc[point.date].push(point);
      return acc;
    }, {} as Record<string, HourlyDataPoint[]>);

    // Get unique dates sorted (most recent first)
    const dates = Object.keys(dataByDate).sort((a, b) => b.localeCompare(a));
    
    // Get today, yesterday, and day before yesterday
    const todayDate = dates[0] || '';
    const yesterdayDate = dates[1] || '';
    const dayBeforeDate = dates[2] || '';

    // Helper function to convert 12-hour format to 24-hour index
    const getHourIndex = (hour: string, period: string): number => {
      let h = parseInt(hour);
      if (period === 'AM') {
        return h === 12 ? 0 : h;
      } else {
        return h === 12 ? 12 : h + 12;
      }
    };

    // Create 24-hour array for each day
    const createDayData = (date: string, limitToCurrentHour: boolean = false) => {
      const dayData = new Array(24).fill(0);
      const datePoints = dataByDate[date] || [];
      
      datePoints.forEach(point => {
        const hourIndex = getHourIndex(point.hour, point.period);
        dayData[hourIndex] = point.quantity;
      });

      // If limiting to current hour, replace future hours with null
      if (limitToCurrentHour) {
        for (let i = currentHour + 1; i < 24; i++) {
          dayData[i] = null;
        }
      }

      return dayData;
    };

    const todayData = createDayData(todayDate, true);
    const yesterdayData = createDayData(yesterdayDate, false);
    const dayBeforeData = createDayData(dayBeforeDate, false);

    // Calculate totals
    const total_today = todayData.filter(v => v !== null).reduce((sum, v) => sum + (v || 0), 0);
    const total_yesterday = yesterdayData.reduce((sum, v) => sum + v, 0);
    const total_day_before = dayBeforeData.reduce((sum, v) => sum + v, 0);

    // Categories: 0 to 23 (just hours)
    const categories = Array.from({ length: 24 }, (_, i) => i.toString());

    // Create time labels for tooltips (from the actual data)
    // Use any available date's timestamps since they're the same for all days
    const timeLabels = Array(24).fill('');
    const availableDate = todayDate || yesterdayDate || dayBeforeDate;
    if (availableDate && dataByDate[availableDate]) {
      dataByDate[availableDate].forEach(point => {
        const hourIndex = getHourIndex(point.hour, point.period);
        timeLabels[hourIndex] = point.timestamp;
      });
    }

    return {
      series: [
        {
          name: `Today (${todayDate})`,
          data: todayData,
        },
        {
          name: `Yesterday (${yesterdayDate})`,
          data: yesterdayData,
        },
        {
          name: `2 Days Ago (${dayBeforeDate})`,
          data: dayBeforeData,
        },
      ],
      categories,
      metadata: {
        today_date: todayDate,
        yesterday_date: yesterdayDate,
        day_before_date: dayBeforeDate,
        total_today,
        total_yesterday,
        total_day_before,
      },
      timeLabels
    };
  }, [hourlyData, currentHour]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: [3, 3, 3],
      curve: 'smooth',
      dashArray: [0, 8, 4], // solid, dashed, dotted
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
      show: false, // Hide default legend
    },
    markers: {
      size: 0,
      hover: {
        sizeOffset: 6,
      },
    },
    xaxis: {
      categories: categories,
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
        rotateAlways: false,
        style: {
          fontSize: '11px',
          colors: '#6b7280'
        }
      },
      axisBorder: {
        show: true,
        color: '#e5e7eb'
      },
      axisTicks: {
        show: true,
        color: '#e5e7eb'
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
        formatter: function (val) {
          return val?.toFixed(0) || '0';
        },
        style: {
          fontSize: '11px',
          colors: '#6b7280'
        }
      },
      min: 0,
    },
    grid: {
      show: false,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: function (val, opts) {
          const hourIndex = opts?.dataPointIndex ?? (typeof val === 'number' ? val : parseInt(String(val)));
          return timeLabels[hourIndex] || `${hourIndex}:00`;
        },
      },
      y: {
        formatter: function (val) {
          if (val === null || val === undefined) {
            return 'No data';
          }
          return val.toFixed(0) + ' orders';
        },
      },
      style: {
        fontSize: '12px',
      }
    },
    colors: chartsColor,
    annotations: {
      xaxis: [
        {
          x: currentHour,
          borderColor: '#3b82f6',
          label: {
            text: 'Current Time',
            style: {
              color: '#fff',
              background: '#3b82f6',
              fontSize: '10px',
            },
          },
        },
      ],
    },
  }), [categories, chartsColor, currentHour]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading hourly data...</p>
        </div>
      </div>
    );
  }

  if (!hourlyData || hourlyData.length === 0 || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">No hourly data available</p>
          <p className="text-gray-400 text-sm mt-2">Data will appear as orders come in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Today's Total</p>
          <p className="text-2xl font-bold text-blue-600">
            {metadata.total_today}
          </p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Yesterday's Total</p>
          <p className="text-2xl font-bold text-purple-600">
            {metadata.total_yesterday}
          </p>
        </div>
        <div className="text-center p-3 bg-pink-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">2 Days Ago</p>
          <p className="text-2xl font-bold text-pink-600">
            {metadata.total_day_before}
          </p>
        </div>
      </div>

      {/* Chart - Only render after mount */}
      {isMounted && (
        <div id="hourly-orders-chart">
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height={350}
            width="100%"
          />
        </div>
      )}

      {/* Color-Day Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500"></div>
          <span className="text-gray-600">Today ({metadata.today_date})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed #a855f7' }}></div>
          <span className="text-gray-600">Yesterday ({metadata.yesterday_date})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-pink-500" style={{ borderTop: '2px dotted #ec4899' }}></div>
          <span className="text-gray-600">2 Days Ago ({metadata.day_before_date})</span>
        </div>
      </div>
    </div>
  );
};

export default HourlyOrdersChart;
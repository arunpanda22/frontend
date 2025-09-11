'use client'

import React, { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard'
import { ApexOptions } from 'apexcharts'

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

interface MixedChartsProps {
  chartColors: string
  chartDarkColors: string
  chartId: React.MutableRefObject<null>
}

const LineColumnAreaChart = ({
  chartColors,
  chartDarkColors,
  chartId,
}: MixedChartsProps) => {
  const { data: inventoryHealthData, isLoading, error } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  });

  const { series, labels } = useMemo(() => {
    if (!inventoryHealthData?.inventory_health) {
      return {
        series: [],
        labels: []
      };
    }

    const sorted = [...inventoryHealthData.inventory_health]
      .sort((a: any, b: any) => (b.fulfillable_quantity || 0) - (a.fulfillable_quantity || 0))
      .slice(0, 10);

    const chartLabels = sorted.map((item: any) => item.asin);
    const chartSeries = [
      {
        name: 'Fulfillable Quantity',
        type: 'column',
        data: sorted.map((item: any) => item.fulfillable_quantity || 0),
      },
      {
        name: 'Inventory Cover',
        type: 'line',
        data: sorted.map((item: any) => item['Inventory Cover'] || 0),
      },
    ];

    return {
      series: chartSeries,
      labels: chartLabels
    };
  }, [inventoryHealthData]);

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Overview
          </h6>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium">Failed to load inventory data</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!series.length || !labels.length) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Overview
          </h6>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 font-medium">No inventory data available</p>
            <p className="text-sm text-gray-500 mt-1">Check back later for updates</p>
          </div>
        </div>
      </div>
    );
  }

  const options: ApexOptions = {
    chart: {
      height: '100%',
      type: 'line',
      stacked: false,
      toolbar: {
        show: false
      },
      background: 'transparent',
      parentHeightOffset: 0,
    },
    stroke: {
      width: [0, 4],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: '50%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
      },
    },
    labels: labels,
    xaxis: {
      categories: labels,
      type: 'category',
      title: { 
        text: 'ASIN',
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#6B7280'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6B7280'
        }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Fulfillable Quantity',
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280'
          }
        },
        min: 0,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#6B7280'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Inventory Cover',
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280'
          }
        },
        min: 0,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#6B7280'
          }
        }
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (y: number, opts: any) {
          if (typeof y !== 'undefined') {
            return y.toFixed(0)
          }
          return y
        },
      },
    },
    grid: {
      show: false,
      padding: {
        top: 10,
        right: 15,
        bottom: 10,
        left: 10
      },
    },
    colors: ['#3B82F6', '#10B981'],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 500,
      labels: {
        colors: '#6B7280'
      }
    }
  }

  return (
       <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
      {/* Header with consistent padding */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Inventory Overview
        </h6>
      </div>
      
      {/* Chart container - takes remaining space */}
      <div className="flex-1 p-6 min-h-0">
        <div className="w-full h-full">
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </div>
  )
}

export default LineColumnAreaChart
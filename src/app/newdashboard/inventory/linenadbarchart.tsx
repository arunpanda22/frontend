'use client'

import React, { useEffect, useState, useMemo } from 'react'

import dynamic from 'next/dynamic'
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard'

import { ApexOptions } from 'apexcharts'

// Dynamically import the ReactApexChart component
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
  // Fetch real inventory health data
  const { data: inventoryHealthData, isLoading, error } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  });

  // Process real API data for chart
  const { series, labels } = useMemo(() => {
    if (!inventoryHealthData?.inventory_health) {
      return {
        series: [],
        labels: []
      };
    }

    // Sort by fulfillable_quantity descending and take top 10
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

  // Handle loading state
  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-red-500">Failed to load inventory data: {error.message}</div>
      </div>
    );
  }

  // Handle no data
  if (!series.length || !labels.length) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-gray-500">No inventory data available</div>
      </div>
    );
  }

  const options: ApexOptions = {
    chart: {
      height: 300,
      type: 'line',
      stacked: false,
    },
    stroke: {
      width: [2, 4],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: '50%',
      },
    },
    labels: labels,
    xaxis: {
      categories: labels,
      type: 'category',
      title: { text: 'ASIN' },
    },
    yaxis: [
      {
        title: {
          text: 'Fulfillable Quantity',
        },
        min: 0,
      },
      {
        opposite: true,
        title: {
          text: 'Inventory Cover',
        },
        min: 0,
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
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
      },
    },
  }

  return (
    <React.Fragment>
      <ReactApexChart
        className="w-full h-full"
        options={options}
        series={series}
        type="line"
        data-chart-colors="[bg-primary-500, bg-green-500, bg-yellow-500]"
        id={chartId}
        height="100%"
        width="100%"
      />
    </React.Fragment>
  )
}

export default LineColumnAreaChart

'use client'

import React, { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'


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
  // State to hold chart data
  const [series, setSeries] = useState<any[]>([])
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    // Fetch and process the JSON data
    fetch('/dataset/%20inventory_health_30d_avg.json')
      .then((res) => res.json())
      .then((data) => {
        // Sort by reserved_quantity descending and take top 10
        const sorted = [...data]
          .sort((a, b) => b.reserved_quantity - a.reserved_quantity)
          .slice(0, 10)

        setLabels(sorted.map((item) => item.asin))
        setSeries([
          {
            name: 'Reserved Quantity',
            type: 'column',
            data: sorted.map((item) => item.reserved_quantity),
          },
          {
            name: 'Inventory Cover',
            type: 'line',
            data: sorted.map((item) => item["Inventory Cover"]),
          },
        ])
      })
  }, [])

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
          text: 'Reserved Quantity',
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
        chartId={chartId}
        height="100%"
        width="100%"
      />
    </React.Fragment>
  )
}

export default LineColumnAreaChart

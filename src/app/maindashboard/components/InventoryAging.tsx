"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { useAsinLiquidation } from "@/lib/hooks/queries/use-dashboard";

import { ApexOptions } from 'apexcharts';

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface ChartData {
  labels: string[];
  series: number[];
}

const InventoryAging = () => {
  const { data, isLoading, error } = useAsinLiquidation();
  const chartId = useRef(null);
  
  // Custom colors for inventory aging chart
  const customColors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  // Transform API data to chart format
  const getChartData = (): ChartData => {
    if (!data?.inventory_aging_summary) {
      return {
        labels: [],
        series: []
      };
    }

    const summary = data.inventory_aging_summary;
    
    const labels = [
      '0-90 days',
      '90-180 days',  
      '181-330 days',
      '331-365 days',
      '365+ days'
    ];

    const series = [
      summary._0_90_days || 0,
      summary._91_180_days || 0,
      summary._181_330_days || 0,
      summary._331_365_days || 0,
      summary.above_365_days || 0
    ];

    // Filter out zero values with proper typing
    const filteredData: ChartData = labels.reduce((acc: ChartData, label, index) => {
      if (series[index] > 0) {
        acc.labels.push(label);
        acc.series.push(series[index]);
      }
      return acc;
    }, { labels: [], series: [] });

    return filteredData.labels.length > 0 ? filteredData : { labels, series };
  };

  const chartData = getChartData();

  const options: ApexOptions = {
    chart: {
      height: 300,
      type: 'pie',
    },
    stroke: {
      show: false,
      width: 0
    },
    labels: chartData.labels,
    colors: customColors,
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        const value = chartData.series[opts.seriesIndex];
        return value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toString();
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold'
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      markers: {
        size: 8,
        // radius: 2
      },
      itemMargin: {
        // horizontal: 5,
        vertical: 2
      }
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} units`
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Failed to load inventory aging data</p>
        </div>
      );
    }

    if (!data?.inventory_aging_summary || chartData.series.every(val => val === 0)) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No inventory aging data available</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <ReactApexChart
          className="!min-h-full"
          options={options}
          series={chartData.series}
          type="pie"
          data-chart-colors="custom"
          // chartId={chartId}
          height={300}
          width="100%"
        />
      </div>
    );
  };

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Inventory Aging
        </h6>
      </div>
      
      <div className="p-4 md:p-6 flex-1 min-h-0">
        <div className="w-full h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default InventoryAging;
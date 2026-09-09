"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { useAsinLiquidation } from "@/lib/hooks/queries/use-dashboard";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ChartData {
  labels: string[];
  series: number[];
}

const InventoryAging = () => {
  const { data, isLoading, error } = useAsinLiquidation();
  const chartId = useRef(null);

  // Light ocean blue and gold theme
  const customColors = ["#7EAEED", "#FFBF00"];

  const getChartData = (): ChartData => {
    if (!data?.inventory_aging_summary) {
      return {
        labels: [],
        series: [],
      };
    }

    const summary = data.inventory_aging_summary;

    const labels = ["0-90 days", "90-180 days"];

    const series = [summary._0_90_days || 0, summary._91_180_days || 0];

    const filteredData: ChartData = labels.reduce(
      (acc: ChartData, label, index) => {
        if (series[index] > 0) {
          acc.labels.push(label);
          acc.series.push(series[index]);
        }
        return acc;
      },
      { labels: [], series: [] }
    );

    return filteredData.labels.length > 0 ? filteredData : { labels, series };
  };

  const chartData = getChartData();
  const totalUnits = chartData.series.reduce((sum, val) => sum + val, 0);

  const options: ApexOptions = {
    chart: {
      height: 240,
      type: "donut",
      fontFamily: "inherit",
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: "#374151",
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              offsetY: 8,
              formatter: function (val: string) {
                return parseInt(val).toLocaleString();
              },
            },
            total: {
              show: true,
              showAlways: false,
              label: "Total",
              fontSize: "12px",
              fontWeight: 400,
              color: "#6B7280",
              formatter: function () {
                return totalUnits.toLocaleString();
              },
            },
          },
        },
      },
    },
    stroke: {
      width: 0,
    },
    labels: chartData.labels,
    colors: customColors,
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val.toLocaleString()} units`,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 200,
          },
        },
      },
    ],
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
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

    if (
      !data?.inventory_aging_summary ||
      chartData.series.every((val) => val === 0)
    ) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No inventory aging data available</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <ReactApexChart
            options={options}
            series={chartData.series}
            type="donut"
            height={240}
            width="100%"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#7EAEED" }}
              ></div>
              <div className="text-xs font-semibold text-gray-900">
                {chartData.series[0]
                  ? Math.round((chartData.series[0] / totalUnits) * 100)
                  : 0}
                %
              </div>
            </div>
            <div className="text-xs text-gray-500">0-90 days</div>
            <div className="text-xs text-gray-400 font-mono">
              {chartData.series[0]?.toLocaleString() || 0}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#FFBF00" }}
              ></div>
              <div className="text-xs font-semibold text-gray-900">
                {chartData.series[1]
                  ? Math.round((chartData.series[1] / totalUnits) * 100)
                  : 0}
                %
              </div>
            </div>
            <div className="text-xs text-gray-500">90-180 days</div>
            <div className="text-xs text-gray-400 font-mono">
              {chartData.series[1]?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          Inventory Aging
        </h6>
      </div>

      <div className="p-4 md:p-6 flex-1 min-h-0">{renderContent()}</div>
    </div>
  );
};

export default InventoryAging;

// src/app/maindashboard/searchqueryperformance/components/PriceWeightageChart.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ReactEcharts component
const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
});

interface PriceWeightageChartProps {
  totalWeightedSalesData: number[];
  asinWeightedSalesData: number[];
  months: string[];
}

const PriceWeightageChart: React.FC<PriceWeightageChartProps> = ({
  totalWeightedSalesData,
  asinWeightedSalesData,
  months,
}) => {
  // Ensure data safety and proper formatting
  const safeTotalWeightedSalesData = totalWeightedSalesData && totalWeightedSalesData.length > 0 
    ? totalWeightedSalesData
    : Array(months.length || 12).fill(0);
  
  const safeAsinWeightedSalesData = asinWeightedSalesData && asinWeightedSalesData.length > 0 
    ? asinWeightedSalesData
    : Array(months.length || 12).fill(0);
  
  const safeMonths = months && months.length > 0 
    ? months
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate min and max for better scaling
  const allSales = [...safeTotalWeightedSalesData, ...safeAsinWeightedSalesData];
  const minSales = Math.min(...allSales.filter(s => s > 0));
  const maxSales = Math.max(...allSales);
  const padding = (maxSales - minSales) * 0.1;

  const option = {
    title: {
      text: 'Weighted Click Sales Comparison',
      left: 'center',
      top: 5,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
        fontFamily: 'Inter, sans-serif',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      formatter: function (params: any) {
        let tooltipText = `<div style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          const value = param.value;
          let formattedValue = value;
          if (value >= 1000000) {
            formattedValue = `₹${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            formattedValue = `₹${(value / 1000).toFixed(1)}K`;
          } else {
            formattedValue = `₹${value.toFixed(2)}`;
          }
          tooltipText += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 50%; margin-right: 10px;"></span>
              <span style="margin-right: 10px; color: #4b5563;">${param.seriesName}:</span>
              <span style="font-weight: bold; color: #1f2937;">${formattedValue}</span>
            </div>
          `;
        });
        return tooltipText;
      },
    },
    legend: {
      data: ['Total Weighted Click Sales', 'ASIN Weighted Click Sales'],
      top: 25,
      textStyle: {
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        color: '#4b5563',
      },
      itemWidth: 12,
      itemHeight: 12,
    },
    xAxis: {
      type: 'category',
      data: safeMonths,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
          width: 1,
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
        margin: 6,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Sales (₹)',
      nameTextStyle: {
        color: '#6b7280',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        padding: [0, 0, 0, 15],
      },
      min: Math.max(0, minSales - padding),
      max: maxSales + padding,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
        formatter: function(value: number) {
          if (value >= 1000000) {
            return '₹' + (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return '₹' + (value / 1000).toFixed(1) + 'K';
          }
          return '₹' + value.toFixed(0);
        },
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
          width: 1,
        },
      },
    },
    series: [
      {
        name: 'Total Weighted Click Sales',
        data: safeTotalWeightedSalesData,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          width: 2.5,
          color: '#ef4444',
        },
        itemStyle: {
          color: '#ef4444',
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: 'rgba(239, 68, 68, 0.3)',
          shadowBlur: 3,
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 5,
          },
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(239, 68, 68, 0.15)',
              },
              {
                offset: 1,
                color: 'rgba(239, 68, 68, 0.02)',
              },
            ],
          },
        },
      },
      {
        name: 'ASIN Weighted Click Sales',
        data: safeAsinWeightedSalesData,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          width: 2.5,
          color: '#3b82f6',
        },
        itemStyle: {
          color: '#3b82f6',
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: 'rgba(59, 130, 246, 0.3)',
          shadowBlur: 3,
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 5,
          },
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(59, 130, 246, 0.15)',
              },
              {
                offset: 1,
                color: 'rgba(59, 130, 246, 0.02)',
              },
            ],
          },
        },
      },
    ],
    grid: {
      top: '18%',
      left: '8%',
      right: '5%',
      bottom: '12%',
      containLabel: true,
    },
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
  };

  // Show loading or no data state
  if (!safeTotalWeightedSalesData.some(val => val > 0) && !safeAsinWeightedSalesData.some(val => val > 0)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">📊</div>
          <p className="text-sm">No weighted sales data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactEcharts 
        style={{ height: '280px', width: '100%' }} 
        option={option}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default PriceWeightageChart;
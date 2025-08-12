'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ReactEcharts component
const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
});

interface ConversionChartProps {
  totalConversionData: number[];
  asinConversionData: number[];
  months: string[];
}

const ConversionChart: React.FC<ConversionChartProps> = ({
  totalConversionData,
  asinConversionData,
  months,
}) => {
  const option = {
    title: {
      text: 'Conversion Rate Comparison',
      left: 'center',
      top: 5,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
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
      formatter: function (params: any) {
        let tooltipText = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          tooltipText += `
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
              <span style="margin-right: 8px;">${param.seriesName}:</span>
              <span style="font-weight: bold;">${param.value}%</span>
            </div>
          `;
        });
        return tooltipText;
      },
    },
    legend: {
      data: ['Total Conversion Rate', 'ASIN Conversion Rate'],
      top: 25,
      textStyle: {
        fontSize: 11,
      },
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Conversion Rate (%)',
      nameTextStyle: {
        color: '#6b7280',
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 10,
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Total Conversion Rate',
        data: totalConversionData,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2.5,
          color: '#10b981',
        },
        itemStyle: {
          color: '#10b981',
          borderWidth: 2,
          borderColor: '#fff',
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
                color: 'rgba(16, 185, 129, 0.1)',
              },
              {
                offset: 1,
                color: 'rgba(16, 185, 129, 0.01)',
              },
            ],
          },
        },
      },
      {
        name: 'ASIN Conversion Rate',
        data: asinConversionData,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2.5,
          color: '#8b5cf6',
        },
        itemStyle: {
          color: '#8b5cf6',
          borderWidth: 2,
          borderColor: '#fff',
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
                color: 'rgba(139, 92, 246, 0.1)',
              },
              {
                offset: 1,
                color: 'rgba(139, 92, 246, 0.01)',
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
      bottom: '10%',
    },
    backgroundColor: 'transparent',
  };

  return (
    <div className="w-full h-full">
      <ReactEcharts style={{ height: '280px', width: '100%' }} option={option} />
    </div>
  );
};

export default ConversionChart;
// src/app/maindashboard/searchqueryperformance/components/MetricChartCard.tsx
'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { FaEllipsisH } from "react-icons/fa"

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

interface TrendBadgeProps {
  value: string
  positive: boolean
}

function TrendBadge({ value, positive }: TrendBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
      {positive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {value}
    </span>
  )
}

interface MetricChartCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendPositive?: boolean
  valueSuffix?: string
  chartData: number[]
  chartColors?: string[]
  chartType?: 'horizontal' | 'vertical'
  months?: string[] // Dynamic months from backend data
}

const MetricChartCard = ({
  icon,
  label,
  value,
  trend,
  trendPositive,
  valueSuffix = "",
  chartData,
  chartColors = ['#3b82f6'],
  chartType = 'horizontal',
  months = []
}: MetricChartCardProps) => {
  
  // Handle dynamic data length and ensure safety
  const safeChartData = chartData && chartData.length > 0 ? chartData : [];
  const dataLength = safeChartData.length;
  
  // Use provided months or generate fallback - FIXED LOGIC
  let safeMonths: string[] = [];
  
  if (months.length > 0) {
    if (months.length === dataLength) {
      // Perfect match - use as is
      safeMonths = months;
    } else if (months.length > dataLength) {
      // More months than data points - take the last N months
      safeMonths = months.slice(-dataLength);
    } else {
      // Fewer months than data points - this shouldn't happen with proper data
      // but handle it by padding with generic labels
      safeMonths = [...months];
      while (safeMonths.length < dataLength) {
        safeMonths.push(`M${safeMonths.length + 1}`);
      }
    }
  } else if (dataLength > 0) {
    // No months provided - generate default months based on current date
    const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (dataLength <= 12) {
      // For 12 or fewer data points, use the last N months from the year
      safeMonths = defaultMonths.slice(-dataLength);
    } else {
      // For more than 12 data points, create month-year combinations
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      safeMonths = [];
      for (let i = dataLength - 1; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = currentYear - Math.floor((currentMonth - i) < 0 ? 1 : 0);
        const shortYear = year.toString().slice(-2);
        safeMonths.unshift(`${defaultMonths[monthIndex]} '${shortYear}`);
      }
    }
  }

  // Debug logging to help identify the issue
  console.log('MetricChartCard Debug:', {
    label,
    dataLength,
    chartDataLength: chartData?.length,
    monthsProvided: months,
    monthsLength: months.length,
    safeMonths,
    safeMonthsLength: safeMonths.length
  });

  const series = [
    {
      name: label,
      data: safeChartData,
    },
  ]

  const options: ApexOptions = {
    chart: {
      height: 200,
      type: 'bar',
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: false,
      },
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: chartType === 'horizontal',
        columnWidth: dataLength > 6 ? '80%' : '60%',
        barHeight: '60%',
        distributed: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: safeMonths,
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6b7280',
          fontFamily: 'Inter, sans-serif',
        },
        rotate: dataLength > 6 ? -45 : 0,
        rotateAlways: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6b7280',
          fontFamily: 'Inter, sans-serif',
        },
        formatter: function (val: number) {
          // Handle different value ranges and add proper formatting
          if (label.includes('SHARE') || label.includes('%')) {
            return val.toFixed(1) + '%'
          } else if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + 'M'
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + 'K'
          }
          return Math.round(val).toString()
        }
      },
      min: function(min: number) {
        // Set appropriate minimum for percentage values
        if (label.includes('SHARE') || label.includes('%')) {
          return Math.max(0, min - 1);
        }
        return Math.max(0, min);
      }
    },
    colors: chartColors,
    grid: {
      show: true,
      borderColor: '#f3f4f6',
      strokeDashArray: 3,
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      },
      y: {
        formatter: function (val: number) {
          if (label.includes('SHARE') || label.includes('%')) {
            return val.toFixed(2) + '%'
          } else if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + 'M'
          } else if (val >= 1000) {
            return (val / 1000).toFixed(1) + 'K'
          }
          return val.toLocaleString()
        }
      },
      x: {
        formatter: function (val: number, opts?: any) {
          return safeMonths[opts?.dataPointIndex] || safeMonths[val - 1] || '';
        }
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
        },
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
        },
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 160,
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '70%',
            },
          },
          xaxis: {
            labels: {
              rotate: -45,
              style: {
                fontSize: '10px',
              },
            },
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 140,
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '80%',
            },
          },
          xaxis: {
            labels: {
              show: true,
              rotate: -45,
              style: {
                fontSize: '9px',
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                fontSize: '9px',
              },
            },
          },
        },
      },
    ],
  }

  // Format the display value
  const formatDisplayValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    if (label.includes('SHARE') || label.includes('%')) {
      return val.toFixed(2);
    } else if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col w-full shadow-sm h-full hover:shadow-md transition-shadow duration-200"
      style={{
        backgroundImage: "radial-gradient(circle at 80% 20%, #f8fafc 1%, transparent 60%)"
      }}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-600 font-medium text-xs sm:text-sm">
          {icon}
          <span className="truncate leading-tight">{label}</span>
        </div>
        <FaEllipsisH className="text-gray-300 text-sm flex-shrink-0 cursor-pointer hover:text-gray-400 transition-colors" />
      </div>

      {/* Metric Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
          {formatDisplayValue(value)}{valueSuffix}
        </span>
        {trend && typeof trendPositive === "boolean" && (
          <TrendBadge value={trend} positive={trendPositive} />
        )}
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-[140px] sm:min-h-[180px]">
        {safeChartData.length > 0 && safeChartData.some(val => val > 0) ? (
          <ReactApexChart 
            options={options} 
            series={series} 
            type="bar" 
            height="100%" 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricChartCard
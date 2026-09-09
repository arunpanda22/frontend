import React from 'react';
import dynamic from 'next/dynamic';
import { useAdsSalesData } from '@/lib/hooks/queries/use-dashboard';
import { useDateRange } from '@/lib/context/DateRangeContext';
import type { ApexOptions } from 'apexcharts';

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

// Type for category analysis items
type CategoryAnalysis = {
  product_type: string;
  percentage: number;
};

const CategoryRevenueDonut = () => {
  const { dateRange } = useDateRange();
  
  // Fetch ads-sales data using the hook
  const {
    data: adsSalesData,
    isLoading,
    error,
  } = useAdsSalesData({
    start_date: dateRange.startDate || "",
    end_date: dateRange.endDate || "",
    focus_level: "all",
  }, !!(dateRange.startDate && dateRange.endDate));

  // Process the category analysis data
  const getCategoryData = () => {
    if (!adsSalesData?.category_analysis) {
      return {
        series: [35, 25, 20, 15, 5],
        labels: ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports'],
      };
    }

    const categoryData = adsSalesData.category_analysis;
    const series = categoryData.map((item: CategoryAnalysis) =>
      parseFloat(item.percentage.toFixed(1))
    );

    const labels = categoryData.map((item: CategoryAnalysis) =>
      item.product_type
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    );

    return { series, labels };
  };

  const { series, labels } = getCategoryData();

  // Generate colors for each category
  const generateColors = (count: number): string[] => {
    const baseColors = [
      '#7EAEED', // ocean-300
      '#4F94DE', // ocean-400
      '#407AB8', // ocean-500
      '#316095', // ocean-600
      '#234871', // ocean-700
      '#163250', // ocean-800

    ];
    
    // If we need more colors than our base set, generate variations
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 360 / count) % 360;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    
    return colors;
  };

  const chartColors = generateColors(series.length);

  const options: ApexOptions = {
    labels: labels,
    chart: {
      height: 240,
      type: 'donut' as const,
      fontFamily: 'inherit',
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              show: false,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '11px',
              fontWeight: 500,
              color: '#64748B',
              formatter: () => '100%',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.15,
        opacityFrom: 0.95,
        opacityTo: 0.95,
        stops: [0, 100],
      },
    },
    legend: {
      show: false,
    },
    colors: chartColors,
    stroke: {
      width: 0,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number) {
          return parseFloat(val.toString()).toFixed(1) + '%';
        },
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

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-sm transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-base font-semibold text-gray-900">
            Category Revenue Share
          </h6>
        </div>
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading category data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-sm transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-base font-semibold text-gray-900">
            Category Revenue Share
          </h6>
        </div>
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">Failed to load data</div>
            <div className="text-xs text-gray-400">Please try again later</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-sm transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          Category Revenue Share
        </h6>
      </div>
     
      <div className="p-4 flex-1 flex items-center gap-6">
        {/* Donut Chart on the Left */}
        <div className="flex-shrink-0 px-6" style={{ width: '208px' }}>
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={160}
            width="100%"
          />
        </div>
       
        {/* Legend on the Right */}
        <div className="flex-1 flex flex-col gap-3 px-6 overflow-y-auto max-h-40 ">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chartColors[index] }}
                ></div>
                <span className="text-xs text-slate-600 truncate">{label}</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                {series[index]}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryRevenueDonut;
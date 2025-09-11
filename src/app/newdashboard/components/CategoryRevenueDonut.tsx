import React from 'react';
import dynamic from 'next/dynamic';
import { useAdsSalesData } from '@/lib/hooks/queries/use-dashboard';
import { useDateRange } from '@/lib/context/DateRangeContext';

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

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
    const series = categoryData.map(item => parseFloat(item.percentage.toFixed(1)));
    const labels = categoryData.map(item => {
      // Format product type names to be more readable
      return item.product_type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });

    return { series, labels };
  };

  const { series, labels } = getCategoryData();

  // Generate colors for each category
  const generateColors = (count) => {
    const baseColors = [
      '#3B82F6', // Blue
      '#10B981', // Green  
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6366F1', // Indigo
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

  const options = {
    labels: labels,
    chart: {
      height: 240,
      type: 'donut',
      fontFamily: 'inherit',
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
              offsetY: 8,
              formatter: function (val) {
                return parseFloat(val).toFixed(1) + '%';
              },
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 400,
              color: '#6B7280',
              formatter: function (w) {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return total.toFixed(1) + '%';
              },
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
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        opacityFrom: 0.85,
        opacityTo: 0.85,
        stops: [50, 0, 100],
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
        formatter: function (val) {
          return parseFloat(val).toFixed(1) + '%';
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
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Category Revenue Share
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
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
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Category Revenue Share
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">Failed to load data</div>
            <div className="text-xs text-gray-400">Please try again later</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Category Revenue Share
        </h6>
      </div>
     
      <div className="p-4 md:p-6 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-center flex-1">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={160}
            width="100%"
          />
        </div>
       
        <div className="grid grid-cols-1 gap-2 mt-4 max-h-32 overflow-y-auto">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chartColors[index] }}
                ></div>
                <span className="text-xs text-gray-500 truncate">{label}</span>
              </div>
              <span className="text-xs font-semibold text-gray-900 ml-2">
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
import React from 'react';
import dynamic from 'next/dynamic';
import { useAdsSalesData } from '@/lib/hooks/queries/use-dashboard';
import { useDateRange } from '@/lib/context/DateRangeContext';
import { AdsTypeContribution } from '@/lib/api/services/dashboard.service';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const AdsSplitBubbleChart = () => {
  const { dateRange } = useDateRange();
  
  const {
    data: adsSalesData,
    isLoading,
    error,
  } = useAdsSalesData({
    start_date: dateRange.startDate || "",
    end_date: dateRange.endDate || "",
    focus_level: "all",
  }, !!(dateRange.startDate && dateRange.endDate));

  const getAdsTypeData = () => {
    if (!adsSalesData?.ads_type_contribution) {
      return {
        sponsoredProducts: 65.0,
        sponsoredBrands: 25.0,
        sponsoredDisplay: 10.0,
      };
    }

    const adsData = adsSalesData.ads_type_contribution;
    
    let sponsoredProducts = 0;
    let sponsoredBrands = 0;
    let sponsoredDisplay = 0;

    adsData.forEach((item: AdsTypeContribution) => {
      const percentage = parseFloat(item.sales_contribution_pct.toFixed(1));
      
      switch (item.source) {
        case 'SP':
          sponsoredProducts = percentage;
          break;
        case 'SB':
          sponsoredBrands = percentage;
          break;
        case 'SD':
          sponsoredDisplay = percentage;
          break;
        default:
          sponsoredProducts += percentage;
          break;
      }
    });

    if (adsData.length === 1 && sponsoredProducts === 100) {
      sponsoredBrands = 0;
      sponsoredDisplay = 0;
    }

    return {
      sponsoredProducts,
      sponsoredBrands,
      sponsoredDisplay,
    };
  };

  const { sponsoredProducts, sponsoredBrands, sponsoredDisplay } = getAdsTypeData();
  
  const series = [sponsoredProducts, sponsoredBrands, sponsoredDisplay];
  const labels = ['Sponsored Products', 'Sponsored Brands', 'Sponsored Display'];
  const chartColors = ['#7EAEED', '#4F94DE', '#FFBF00'];

  const options = {
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
              formatter: function (val: string) {
                return val + '%'
              },
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 400,
              color: '#6B7280',
              formatter: function () {
                return '100%'
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
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
          return val + '%'
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
      <div className="order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 p-6 border-b-2 border-gray-300">
          <h6 className="text-lg font-semibold text-gray-900 flex-grow">Ads Split</h6>
        </div>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading ads data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 p-6 border-b-2 border-gray-300">
          <h6 className="text-lg font-semibold text-gray-900 flex-grow">Ads Split</h6>
        </div>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">Failed to load data</div>
            <div className="text-xs text-gray-400">Please try again later</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm h-full">
      <div className="p-5 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">Ads Split</h6>
      </div>
      
      <div className="p-4 md:p-6 flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-center flex-1">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={240}
            width="100%"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-8">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7EAEED' }}></div>
              <div className="text-xs font-semibold text-gray-900">{sponsoredProducts}%</div>
            </div>
            <div className="text-xs text-gray-500">Sponsored Products</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4F94DE' }}></div>
              <div className="text-xs font-semibold text-gray-900">{sponsoredBrands}%</div>
            </div>
            <div className="text-xs text-gray-500">Sponsored Brands</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFBF00' }}></div>
              <div className="text-xs font-semibold text-gray-900">{sponsoredDisplay}%</div>
            </div>
            <div className="text-xs text-gray-500">Sponsored Display</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsSplitBubbleChart;
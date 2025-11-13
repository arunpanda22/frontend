import React from 'react';
import { useAdsSalesData } from '@/lib/hooks/queries/use-dashboard';
import { useDateRange } from '@/lib/context/DateRangeContext';
import { AdsTypeContribution } from '@/lib/api/services/dashboard.service';

const AdsSplitBubbleChart = () => {
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

  // Process the ads type contribution data
  const getAdsTypeData = () => {
    if (!adsSalesData?.ads_type_contribution) {
      // Return default/fallback data
      return {
        sponsoredProducts: 65.0,
        sponsoredBrands: 25.0,
        sponsoredDisplay: 10.0,
      };
    }

    const adsData = adsSalesData.ads_type_contribution;
    
    // Initialize with 0 values
    let sponsoredProducts = 0;
    let sponsoredBrands = 0;
    let sponsoredDisplay = 0;

    // Map the source codes to percentages
    adsData.forEach((item: AdsTypeContribution) => {
      const percentage = parseFloat(item.sales_contribution_pct.toFixed(1));
      
      switch (item.source) {
        case 'SP': // Sponsored Products
          sponsoredProducts = percentage;
          break;
        case 'SB': // Sponsored Brands
          sponsoredBrands = percentage;
          break;
        case 'SD': // Sponsored Display
          sponsoredDisplay = percentage;
          break;
        default:
          // If we encounter an unknown source, add it to Sponsored Products
          sponsoredProducts += percentage;
          break;
      }
    });

    // If we only have one source (like in your data), distribute logically
    if (adsData.length === 1 && sponsoredProducts === 100) {
      // This means all sales are from Sponsored Products
      // Keep 100% for SP, set others to 0
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

  // Calculate bubble sizes based on percentages
  const getTransformStyle = (percentage: number) => {
    if (percentage === 0) return { display: 'none' };
    
    // Scale the bubbles based on percentage
    // Min size: 0.3, Max size: 1.0
    const scale = Math.max(0.3, percentage / 100);
    return {
      transform: `scale(${scale})`,
      opacity: percentage === 0 ? 0.3 : 1,
    };
  };

  if (isLoading) {
    return (
      <div className="order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <h6 className="text-lg font-semibold text-gray-900 dark:text-white flex-grow">Ads Split</h6>
        </div>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Loading ads data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <h6 className="text-lg font-semibold text-gray-900 dark:text-white flex-grow">Ads Split</h6>
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
    <div className="order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
        <h6 className="text-lg font-semibold text-gray-900 dark:text-white flex-grow">Ads Split</h6>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-center h-64 w-full">
          <div className="relative w-64 h-64">
            {/* Sponsored Products - Largest bubble */}
            {sponsoredProducts > 0 && (
              <div 
                className="absolute top-8 left-1/2 transform -translate-x-1/2" 
                style={{ zIndex: 1, ...getTransformStyle(sponsoredProducts) }}
              >
                <svg className="w-32 h-32 drop-shadow-md" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50" className="fill-blue-500/80" />
                  <text
                    x="50%"
                    y="42%"
                    textAnchor="middle"
                    className="font-semibold fill-blue-50"
                    fontSize="15px"
                    dy=".3em">
                    {sponsoredProducts}%
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    className="fill-blue-50"
                    fontSize="9px"
                    dy=".3em">
                    Sponsored
                  </text>
                  <text
                    x="50%"
                    y="68%"
                    textAnchor="middle"
                    className="fill-blue-50"
                    fontSize="9px"
                    dy=".3em">
                    Products
                  </text>
                </svg>
              </div>
            )}

            {/* Sponsored Brands - Medium bubble */}
            {sponsoredBrands > 0 && (
              <div 
                className="absolute bottom-8 left-8" 
                style={{ zIndex: 1, ...getTransformStyle(sponsoredBrands) }}
              >
                <svg className="w-24 h-24 drop-shadow-md" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50" className="fill-green-500/80" />
                  <text
                    x="50%"
                    y="42%"
                    textAnchor="middle"
                    className="font-semibold fill-green-50"
                    fontSize="15px"
                    dy=".3em">
                    {sponsoredBrands}%
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    className="fill-green-50"
                    fontSize="9px"
                    dy=".3em">
                    Sponsored
                  </text>
                  <text
                    x="50%"
                    y="68%"
                    textAnchor="middle"
                    className="fill-green-50"
                    fontSize="9px"
                    dy=".3em">
                    Brands
                  </text>
                </svg>
              </div>
            )}

            {/* Sponsored Display - Smallest bubble */}
            {sponsoredDisplay > 0 && (
              <div 
                className="absolute bottom-8 right-8" 
                style={{ zIndex: 1, ...getTransformStyle(sponsoredDisplay) }}
              >
                <svg className="w-20 h-20 drop-shadow-md" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50" className="fill-yellow-500/80" />
                  <text
                    x="50%"
                    y="42%"
                    textAnchor="middle"
                    className="font-semibold fill-yellow-50"
                    fontSize="15px"
                    dy=".3em">
                    {sponsoredDisplay}%
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    className="fill-yellow-50"
                    fontSize="9px"
                    dy=".3em">
                    Sponsored
                  </text>
                  <text
                    x="50%"
                    y="68%"
                    textAnchor="middle"
                    className="fill-yellow-50"
                    fontSize="9px"
                    dy=".3em">
                    Display
                  </text>
                </svg>
              </div>
            )}

            {/* Show message when all values are 0 */}
            {sponsoredProducts === 0 && sponsoredBrands === 0 && sponsoredDisplay === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-sm">No ads data available</div>
                  <div className="text-xs mt-1">for selected period</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-12 mt-4 divide-y divide-gray-200 md:divide-y-0 md:divide-x rtl:divide-x-reverse dark:divide-gray-700 divide-dashed">
          <div className="col-span-12 p-3 text-center md:col-span-4">
            <h6 className="mb-1 font-semibold text-gray-900 dark:text-white">
              {sponsoredProducts}%
            </h6>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sponsored Products</p>
          </div>
          <div className="col-span-12 p-3 text-center md:col-span-4">
            <h6 className="mb-1 font-semibold text-gray-900 dark:text-white">
              {sponsoredBrands}%
            </h6>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sponsored Brands</p>
          </div>
          <div className="col-span-12 p-3 text-center md:col-span-4">
            <h6 className="mb-1 font-semibold text-gray-900 dark:text-white">
              {sponsoredDisplay}%
            </h6>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sponsored Display</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsSplitBubbleChart;
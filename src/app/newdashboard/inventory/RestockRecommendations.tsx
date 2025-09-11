import React, { useMemo } from 'react';
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard';

const TopRestockRecommendations = () => {
  const { data: inventoryHealthData, isLoading, error } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  });

  // Process data to get top 5 restock recommendations
  const topRestockAsins = useMemo(() => {
    if (!inventoryHealthData?.inventory_health) return [];

    const restockCandidates = inventoryHealthData.inventory_health
      .filter((item: any) => {
        // Filter items that need restocking based on your business logic
        const totalInventory = (item.fulfillable_quantity || 0) + (item.reserved_quantity || 0);
        const salesPerDay = item['Sales/Day'] || 0;
        const inventoryCover = salesPerDay > 0 ? totalInventory / salesPerDay : 0;
        
        // Consider items with low inventory cover (< 30 days) and positive sales
        return inventoryCover < 30 && salesPerDay > 0;
      })
      .map((item: any) => {
        const totalInventory = (item.fulfillable_quantity || 0) + (item.reserved_quantity || 0);
        const salesPerDay = item['Sales/Day'] || 0;
        const inventoryCover = salesPerDay > 0 ? totalInventory / salesPerDay : 0;
        const urgencyScore = salesPerDay / Math.max(inventoryCover, 1); // Higher score = more urgent

        return {
          asin: item.asin,
          productName: item.product_name || `Product ${item.asin}`,
          inventoryCover: Math.round(inventoryCover),
          salesPerDay: Math.round(salesPerDay * 10) / 10,
          currentStock: totalInventory,
          urgencyScore,
          image: getProductIcon(item.asin) // Helper function to get relevant icon
        };
      })
      .sort((a: any, b: any) => b.urgencyScore - a.urgencyScore) // Sort by urgency
      .slice(0, 5);

    return restockCandidates;
  }, [inventoryHealthData]);

  

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-pulse flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-4 md:p-6 flex-1">
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Top 5 Restock Recommendations
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium">Failed to load restock data</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!topRestockAsins.length) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 flex flex-col">
        <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Top 5 Restock Recommendations
          </h6>
        </div>
        <div className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 font-medium">No urgent restock needed</p>
            <p className="text-sm text-gray-500 mt-1">All items have sufficient inventory cover</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Top 5 Restock Recommendations
        </h6>
      </div>
      
      <div className="p-4 md:p-6 flex-1">
        <div className="space-y-3">
          {topRestockAsins.map((asin, index) => (
            <div key={asin.asin} className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 border border-red-200">
                <span className="text-2xl">{asin.image}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {asin.asin}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    {asin.inventoryCover} days left
                  </span>
                  <span className="text-xs text-gray-500">
                    {asin.salesPerDay}/day
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">
                  {asin.currentStock} units
                </p>
                <p className="text-xs text-gray-500">
                  Current
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopRestockRecommendations;
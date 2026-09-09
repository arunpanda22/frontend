"use client";

import React from "react";
import { useInventoryHealth } from "@/lib/hooks/queries/use-dashboard";
import TopItemsList from "@/components/dashboard/ui/TopItemsCard";
import { useCurrency } from "@/lib/context/CurrencyContext";


const InventoryReplenishment = () => {
  const { data, isLoading, isError } = useInventoryHealth();
  const { formatNumber, getCurrencySymbol } = useCurrency();

  // Transform inventory data to match TopItemsList interface
  const transformedData = React.useMemo(() => {
    if (!data?.inventory_replenishment) return [];
    
    return data.inventory_replenishment
      .slice()
      .sort((a, b) => b.reorder_quantity - a.reorder_quantity)
      .map(item => ({
        id: item.asin,
        name: item.product_name || 'Unknown Product',
        imageUrl: item.image_url,
        value: formatNumber(item.reorder_quantity), 
        // currency: getCurrencySymbol(),
        subtitle: `ASIN: ${item.asin}`,
      }));
  }, [data]);

  // Calculate total items requiring action for additional context
  const totalItemsCount = data?.inventory_replenishment?.length || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Top items list */}
      <div className="flex-1">
        <TopItemsList
          title="Top ASINs by Reorder Quantity"
          data={transformedData}
          isLoading={isLoading}
          isError={isError}
          maxItems={5}
          emptyStateIcon="📦"
          emptyStateMessage="No replenishment data available"
          errorMessage="Failed to load replenishment data"
        />
      </div>
    </div>
  );
};

export default InventoryReplenishment;
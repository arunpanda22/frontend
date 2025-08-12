import React, { useEffect, useState, useMemo } from 'react'
import { Boxes, TrendingUp, Droplet } from 'lucide-react'
import { useAsinLiquidation, useInventoryHealth } from '@/lib/hooks/queries/use-dashboard'

const statCardsConfig = [
  {
    label: 'Total Inventory',
    icon: <Boxes className="text-blue-400 w-7 h-7" />,
    color: 'text-blue-400',
    borderColor: 'border-blue-200',
    leftLabel: 'Total ASIN',
    rightLabel: 'Total Quantity',
    key: 'total',
  },
  {
    label: 'Excess Inventory',
    icon: <TrendingUp className="text-purple-400 w-7 h-7" />,
    color: 'text-purple-400',
    borderColor: 'border-purple-200',
    leftLabel: 'Total ASIN',
    rightLabel: 'Total Quantity',
    key: 'excess',
  },
  {
    label: 'Liquidation',
    icon: <Droplet className="text-red-400 w-7 h-7" />,
    color: 'text-red-400',
    borderColor: 'border-red-200',
    leftLabel: 'Total ASIN',
    rightLabel: 'Total Quantity',
    key: 'liquidation',
  },
]

const InventoryStats = () => {
  // Fetch real inventory data from APIs
  const { data: liquidationData, isLoading: liquidationLoading, error: liquidationError } = useAsinLiquidation(30);
  const { data: inventoryHealthData, isLoading: healthLoading, error: healthError } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  });

  // Calculate stats from real API data
  const stats = useMemo(() => {
    // Default stats
    let totalStats = { totalASIN: 0, totalQuantity: 0 };
    let excessStats = { totalASIN: 0, totalQuantity: 0 };
    let liquidationStats = { totalASIN: 0, totalQuantity: 0 };

    // Calculate from liquidation API data
    if (liquidationData) {
      // Excess inventory stats
      if (liquidationData.excess_inventory) {
        const excessASINSet = new Set<string>();
        let excessQuantity = 0;
        liquidationData.excess_inventory.forEach((item: any) => {
          if (item.asin) excessASINSet.add(item.asin);
          excessQuantity += item.FBA_Inv || 0;
        });
        excessStats = { totalASIN: excessASINSet.size, totalQuantity: excessQuantity };
      }

      // Liquidation inventory stats
      if (liquidationData.liquidation) {
        const liquidationASINSet = new Set<string>();
        let liquidationQuantity = 0;
        liquidationData.liquidation.forEach((item: any) => {
          if (item.asin) liquidationASINSet.add(item.asin);
          liquidationQuantity += item.FBA_Inv || 0;
        });
        liquidationStats = { totalASIN: liquidationASINSet.size, totalQuantity: liquidationQuantity };
      }

      // Total inventory (excess + liquidation)
      const allItems = [...(liquidationData.excess_inventory || []), ...(liquidationData.liquidation || [])];
      const totalASINSet = new Set<string>();
      let totalQuantity = 0;
      allItems.forEach((item: any) => {
        if (item.asin) totalASINSet.add(item.asin);
        totalQuantity += item.FBA_Inv || 0;
      });
      totalStats = { totalASIN: totalASINSet.size, totalQuantity };
    }

    // If we have inventory health data, we could enhance total stats
    if (inventoryHealthData?.inventory_health) {
      const healthASINSet = new Set<string>();
      let healthQuantity = 0;
      inventoryHealthData.inventory_health.forEach((item: any) => {
        if (item.asin) healthASINSet.add(item.asin);
        healthQuantity += (item.fulfillable_quantity || 0) + (item.reserved_quantity || 0);
      });
      
      // Use health data for total if it's more comprehensive
      if (healthASINSet.size > totalStats.totalASIN) {
        totalStats = { totalASIN: healthASINSet.size, totalQuantity: healthQuantity };
      }
    }

    return {
      total: totalStats,
      excess: excessStats,
      liquidation: liquidationStats,
    };
  }, [liquidationData, inventoryHealthData]);

  // Handle loading state
  if (liquidationLoading || healthLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {statCardsConfig.map((card, idx) => (
          <div key={idx} className={`bg-gray-50 border ${card.borderColor} rounded-lg p-4 flex flex-col shadow-sm animate-pulse`}>
            <div className="flex flex-col items-center bg-gray-100 rounded-md py-2 mb-4">
              <div className="flex items-center gap-2">
                {card.icon}
                <span className="font-semibold text-gray-700 text-lg">{card.label}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col items-center flex-1">
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <span className="text-gray-500 text-sm mt-1">{card.leftLabel}</span>
              </div>
              <div className="border-l h-8 mx-4" />
              <div className="flex flex-col items-center flex-1">
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <span className="text-gray-500 text-sm mt-1">{card.rightLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state
  if (liquidationError || healthError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="col-span-3 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-semibold">Failed to load inventory data</p>
          <p className="text-red-600 text-sm">{liquidationError?.message || healthError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {statCardsConfig.map((card, idx) => (
        <div
          key={idx}
          className={`bg-gray-50 border ${card.borderColor} rounded-lg p-4 flex flex-col shadow-sm`}
        >
          <div className="flex flex-col items-center bg-gray-100 rounded-md py-2 mb-4">
            <div className="flex items-center gap-2">
              {card.icon}
              <span className="font-semibold text-gray-700 text-lg">{card.label}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl font-bold text-gray-900">{stats[card.key as keyof typeof stats].totalASIN.toLocaleString()}</span>
              <span className="text-gray-500 text-sm mt-1">{card.leftLabel}</span>
            </div>
            <div className="border-l h-8 mx-4" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl font-bold text-gray-900">{stats[card.key as keyof typeof stats].totalQuantity.toLocaleString()}</span>
              <span className="text-gray-500 text-sm mt-1">{card.rightLabel}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default InventoryStats
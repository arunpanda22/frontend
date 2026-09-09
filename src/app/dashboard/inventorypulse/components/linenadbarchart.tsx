'use client'

import React, { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard'
import { ApexOptions } from 'apexcharts'

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

interface MixedChartsProps {
  chartColors: string
  chartDarkColors: string
  chartId: React.MutableRefObject<null>
}

const LineColumnAreaChart = ({
  chartColors,
  chartDarkColors,
  chartId,
}: MixedChartsProps) => {
  const { data: inventoryHealthData, isLoading, error } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  });

  const { series, labels, hasVendorData } = useMemo(() => {
    if (!inventoryHealthData?.inventory_health) {
      return {
        series: [],
        labels: [],
        hasVendorData: false
      };
    }

    const hasVendor = inventoryHealthData?.metadata?.has_vendor_data || false;

    // Filter out vendor-only items for this chart (focus on FBA inventory)
    const fbaItems = inventoryHealthData.inventory_health.filter(
      (item: any) => item.status !== 'Vendor Only'
    );

    // Sort by FBA total inventory and take top 10
    const sorted = [...fbaItems]
      .sort((a: any, b: any) => 
        (b.fba_total_inventory || 0) - (a.fba_total_inventory || 0)
      )
      .slice(0, 10);

    const chartLabels = sorted.map((item: any) => item.asin);
    
    const chartSeries: any[] = [
      {
        name: 'Seller Fulfillable Qty',
        type: 'column',
        data: sorted.map((item: any) => item.fba_fulfillable_quantity || 0),
      },
      {
        name: 'Seller Inventory Cover',
        type: 'line',
        data: sorted.map((item: any) => item.fba_inventory_cover || 0),
      },
    ];

    // Add vendor series if vendor data is available
    if (hasVendor) {
      chartSeries.push(
        {
          name: 'Vendor Inventory',
          type: 'column',
          data: sorted.map((item: any) => item.vendor_inventory || 0),
        },
        {
          name: 'Vendor Inventory Cover',
          type: 'line',
          data: sorted.map((item: any) => item.vendor_inventory_cover || 0),
        }
      );
    }

    return {
      series: chartSeries,
      labels: chartLabels,
      hasVendorData: hasVendor
    };
  }, [inventoryHealthData]);

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Overview
          </h6>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium">Failed to load inventory data</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!series.length || !labels.length) {
    return (
      <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
            Inventory Overview
          </h6>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 font-medium">No inventory data available</p>
            <p className="text-sm text-gray-500 mt-1">Check back later for updates</p>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic colors based on whether vendor data is present
  const colors = hasVendorData 
    ? ['#4F94DE', '#FFBF00', '#10B981', '#002118'] // FBA Fulfillable, FBA Cover, Vendor Inv, Vendor Cover
    : ['#4F94DE', '#FFBF00']; // FBA Fulfillable, FBA Cover only

  const options: ApexOptions = {
    chart: {
      height: '100%',
      type: 'line',
      stacked: false,
      toolbar: {
        show: false
      },
      background: 'transparent',
      parentHeightOffset: 0,
    },
    stroke: {
      width: hasVendorData ? [0, 3, 0, 3] : [0, 4],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: hasVendorData ? '40%' : '50%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
      },
    },
    labels: labels,
    xaxis: {
      categories: labels,
      type: 'category',
      title: { 
        text: 'ASIN',
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#6B7280'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6B7280'
        }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Inventory Quantity',
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280'
          }
        },
        min: 0,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#6B7280'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Inventory Cover (Days)',
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280'
          }
        },
        min: 0,
        labels: {
          style: {
            fontSize: '11px',
            colors: '#6B7280'
          }
        }
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (y: number, opts: any) {
          if (typeof y !== 'undefined') {
            const seriesName = opts.seriesIndex !== undefined 
              ? series[opts.seriesIndex]?.name 
              : '';
            
            // Format based on series type
            if (seriesName.includes('Cover')) {
              return `${y.toFixed(0)} days`;
            }
            return `${y.toFixed(0)} units`;
          }
          return y;
        },
      },
    },
    grid: {
      show: false,
      padding: {
        top: 10,
        right: 15,
        bottom: 10,
        left: 10
      },
    },
    colors: colors,
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontWeight: 500,
      labels: {
        colors: '#6B7280'
      }
    }
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg flex flex-col">
      {/* Header with consistent padding */}
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-semibold text-gray-900">
            Inventory Overview
          </h6>
          {hasVendorData && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              Seller + Vendor
            </span>
          )}
        </div>
      </div>
      
      {/* Chart container - takes remaining space */}
      <div className="flex-1 p-6 min-h-0">
        <div className="w-full h-full">
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </div>
  )
}

export default LineColumnAreaChart
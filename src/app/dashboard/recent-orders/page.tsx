"use client";

import React, { useMemo } from "react";
import { DollarSign, Package, ShoppingCart, TrendingUp, XCircle } from "lucide-react";
import { MetricsCard } from "@/components/dashboard/ui";
import { useCombinedOrdersData } from "@/lib/hooks/useCombinedOrdersData";
import HourlyOrdersChart from "./components/HourlyOrdersChart";
import TopProductsCard from "./components/TopProductsCard";
import { useCurrency } from "@/lib/context/CurrencyContext";

export default function CombinedDashboardPage() {
  const { 
    formatCurrency, 
    formatCurrencyNoDecimal, 
    formatNumber, 
    getCurrencySymbol 
  } = useCurrency();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCombinedOrdersData();

  const metricsData = useMemo(() => {
    if (!data?.daily_metrics?.combined) {
      return [
        {
          title: "Revenue",
          value: "Loading...",
          icon: DollarSign,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "Orders",
          value: "Loading...",
          icon: ShoppingCart,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
        {
          title: "Units",
          value: "Loading...",
          icon: Package,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "ASP",
          value: "Loading...",
          icon: TrendingUp,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
        {
          title: "Cancelled",
          value: "Loading...",
          icon: XCircle,
          bgColor: "bg-white",
          color: "bg-red-400",
        },
      ];
    }

    const { revenue, orders, units, asp, cancelled } = data.daily_metrics.combined;

    return [
      {
        title: "Revenue",
        value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(revenue)}`,
        icon: DollarSign,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "Orders",
        value: orders.toString(),
        icon: ShoppingCart,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "Units",
        value: units.toString(),
        icon: Package,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "ASP",
        value: `${getCurrencySymbol()}${formatCurrency(asp)}`,
        icon: TrendingUp,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "Cancelled",
        value: cancelled.toString(),
        icon: XCircle,
        bgColor: "bg-white",
        color: "bg-red-400",
      },
    ];
  }, [data, formatCurrency, formatCurrencyNoDecimal, getCurrencySymbol]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen px-4 bg-[#f7fafc] sm:px-6 lg:px-12 py-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl md:text-4xl text-[#1a2b3c] tracking-tight font-montserrat font-semibold">
              Combined Dashboard
            </h1>
            
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200
                ${isRefetching 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }
              `}
            >
              <svg 
                className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {data?.metadata?.last_updated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(data.metadata.last_updated).toLocaleString()}
            </p>
          )}
          
          {data?.metadata && (
            <p className="text-xs text-gray-400 mt-1">
              Timezone: {data.metadata.timezone} • Marketplace: {data.metadata.marketplace_id}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              Error: {error instanceof Error ? error.message : 'Failed to load dashboard data'}
            </p>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl text-[#1a2b3c] mb-6 tracking-tight font-montserrat">
            Today's Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {metricsData.map((metric) => (
              <MetricsCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                bgColor={metric.bgColor}
                color={metric.color}
                className="animate-fadeIn"
              />
            ))}
          </div>
        </div>

        {/* Hourly Chart & Top Products Section */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight">
            Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HourlyOrdersChart 
                hourlyData={data?.hourly_orders || null}
                hourlyTotals={data?.hourly_totals || null}
                isLoading={isLoading}
              />
            </div>
            
            <div className="lg:col-span-1">
              <TopProductsCard 
                topProducts={data?.top_products || null}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Metrics Breakdown - Seller vs Vendor */}
        {data?.daily_metrics && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight">
              Breakdown: Seller vs Vendor
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seller Metrics */}
              <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Seller Channel
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      {getCurrencySymbol()}{formatCurrencyNoDecimal(data.daily_metrics.seller.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-semibold text-gray-900">{data.daily_metrics.seller.orders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Units:</span>
                    <span className="font-semibold text-gray-900">{data.daily_metrics.seller.units}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ASP:</span>
                    <span className="font-semibold text-gray-900">
                      {getCurrencySymbol()}{formatCurrency(data.daily_metrics.seller.asp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor Metrics */}
              <div className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  Vendor Channel
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      {getCurrencySymbol()}{formatCurrencyNoDecimal(data.daily_metrics.vendor.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-semibold text-gray-900">{data.daily_metrics.vendor.orders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Units:</span>
                    <span className="font-semibold text-gray-900">{data.daily_metrics.vendor.units}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ASP:</span>
                    <span className="font-semibold text-gray-900">
                      {getCurrencySymbol()}{formatCurrency(data.daily_metrics.vendor.asp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
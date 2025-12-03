"use client";

import React, { useMemo } from "react";
import { DollarSign, Package, ShoppingCart, Truck, XCircle } from "lucide-react";
import { MetricsCard } from "@/components/dashboard/ui";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import OrdersTable from "./components/OrdersTable";
import HourlyOrdersChart from "./components/HourlyOrdersChart";
import TopProductsCard from "./components/TopProductsCard";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";

export default function RealtimeOrdersPage() {
  const { formatCurrency, formatCurrencyNoDecimal, formatNumber, formatPercentage, formatChange, getCurrencySymbol } = useCurrency();
  const { data: userProfile } = useUserProfile();
  const sellerId = userProfile?.connected_seller_accounts?.[0]?.seller_id;

  // Connect to WebSocket and get real-time data
  const {
    orders,
    metrics,
    isConnected,
    isLoading,
    error,
    reconnect,
  } = useRealtimeOrders({
    sellerId: sellerId || '',
    enabled: !!sellerId,
  });

  // Format metrics data for MetricsCard components
  const metricsData = useMemo(() => {
    if (!metrics?.daily) {
      return [
        {
          title: "Today's Revenue",
          value: "Loading...",
          icon: DollarSign,
          bgColor: "bg-jungle-teal-200",
        },
        {
          title: "Orders Today",
          value: "Loading...",
          icon: ShoppingCart,
          bgColor: "bg-jungle-teal-100",
        },
        {
          title: "Units Sold",
          value: "Loading...",
          icon: Package,
          bgColor: "bg-jungle-teal-200",
        },
        {
          title: "Avg. Selling Price",
          value: "Loading...",
          icon: DollarSign,
          bgColor: "bg-jungle-teal-100",
        },
        {
          title: "Shipped",
          value: "Loading...",
          icon: Truck,
          bgColor: "bg-jungle-teal-200",
        },
      ];
    }

    const { revenue, total_orders: orderCount, quantity, asp, shipped } = metrics.daily;

    return [
      {
        title: "Today's Revenue",
        value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(revenue)}`,
        icon: DollarSign,
        bgColor: "bg-jungle-teal-100",
      },
      {
        title: "Orders Today",
        value: orderCount.toString(),
        icon: ShoppingCart,
        bgColor: "bg-jungle-teal-200",
      },
      {
        title: "Units Sold",
        value: quantity.toString(),
        icon: Package,
        bgColor: "bg-jungle-teal-100",
      },
      {
        title: "Avg. Selling Price",
        value: `${getCurrencySymbol()}${formatCurrency(asp)}`,
        icon: DollarSign,
        bgColor: "bg-jungle-teal-200",
      },
      {
        title: "Shipped %",
        value: formatPercentage(shipped),
        icon: Truck,
        bgColor: "bg-jungle-teal-100" ,
      },
    ];
  }, [metrics, formatCurrency]);

  return (
    <div className="min-h-screen bg-[#f7fafc] px-4 sm:px-6 lg:px-12 py-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1a2b3c] tracking-tight">
              📦 Live Orders & Revenue Tracker
            </h1>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-600">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
              {!isConnected && !isLoading && (
                <button
                  onClick={reconnect}
                  className="ml-2 text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
          
          {metrics?.daily?.last_updated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(metrics.daily.last_updated).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              Error: {error}
            </p>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight">
            Today's Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {metricsData.map((metric, index) => (
              <MetricsCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                // change={metric.change}
                // changeType={metric.changeType}
                bgColor={metric.bgColor}
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
            {/* Hourly Orders Chart - 2/3 width */}
            <div className="lg:col-span-2">
              <HourlyOrdersChart 
                hourlyData={metrics?.hourly_data || null}
                isLoading={isLoading}
              />
            </div>
            
            {/* Top Products - 1/3 width */}
            <div className="lg:col-span-1">
              <TopProductsCard 
                topProducts={metrics?.top_products || null}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] tracking-tight">
              Recent Orders
            </h2>
            <div className="text-sm text-gray-600">
              {orders.length} orders loaded
            </div>
          </div>
          
          <OrdersTable 
            orders={orders} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useMemo } from "react";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { MetricsCard } from "@/components/dashboard/ui";
import { useCombinedOrdersData } from "@/lib/hooks/useCombinedOrdersData";
import HourlyOrdersChart from "./components/HourlyOrdersChart";
import TopProductsCard from "./components/TopProductsCard";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";

export default function CombinedDashboardPage() {
  const {
    formatCurrency,
    formatCurrencyNoDecimal,
    formatNumber,
    getCurrencySymbol,
  } = useCurrency();

  const { data, isLoading, error, refetch, isRefetching } =
    useCombinedOrdersData();

  const { data: userProfile } = useUserProfile();
  const hasVendorAccounts =
    (userProfile?.connected_vendor_accounts?.length ?? 0) > 0;

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

    const { revenue, orders, units, asp, cancelled } =
      data.daily_metrics.combined;

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
    <div className="min-h-screen  bg-[#f7fafc] p-12 font-montserrat">
      <div className="w-full">
        {/* Header */}
        <div
          className={`bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-visible`}
        >
          {/* Left side - Title Section */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">Daily Orders</h1>
            {data?.metadata?.last_refreshed_at && (
            <p className="text-xs text-gray-500 ">
              Last updated:{" "}
              {new Date(data.metadata.last_refreshed_at).toLocaleString()}
            </p>
          )}
          </div>

          {/* Right side - Only show if date selector enabled */}

          <div className="flex items-center relative">
            <div className="relative">
              <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200
                ${
                  isRefetching
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                }
              `}
            >
              <svg
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
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
              {isRefetching ? "Refreshing..." : "Refresh"}
            </button>
            </div>
          </div>
        </div>

        {/* <div className="mb-6">
          {data?.metadata && (
            <p className="text-xs text-gray-400 mt-1">
              Timezone: {data.metadata.timezone} • Marketplace:{" "}
              {data.metadata.marketplace_id}
            </p>
          )}
        </div> */}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              Error:{" "}
              {error instanceof Error
                ? error.message
                : "Failed to load dashboard data"}
            </p>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="">
          <h2 className="text-xl  font-bold text-[#1a2b3c] tracking-tight px-2">
            Today's Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 py-6 gap-4 md:gap-6">
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
          <h2 className="text-xl font-bold text-[#1a2b3c] tracking-tight px-2">
            Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 py-6 gap-6">
            <div className="lg:col-span-2">
              <HourlyOrdersChart
                hourlyData={data?.hourly_orders || null}
                hourlyTotals={data?.hourly_totals || null}
                metadata={data?.metadata || null}
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
      </div>
    </div>
  );
}

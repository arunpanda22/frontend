"use client";
import React, { useState } from "react";
import AdvancedFunnel from "./components/AdvancedFunnel";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { DollarSign, Package, ShoppingCart, PercentIcon } from "lucide-react";
import {
  DateRangeProvider,
  useDateRange,
} from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { Range } from "react-date-range";
import { MetricsCard, type MetricsCardProps } from "@/components/dashboard/ui";
import InventoryAging from "./components/InventoryAging";
import InventoryReplenishment from "./components/InventoryReplenishment";
import AdsSplitBubbleChart from "./components/AdsTypeSplit";
import InventoryHealthDonut from "./components/InventoryHealth";
import TopAsinsRevenue from "./components/TopAsinsCard";
import CategoryRevenueDonut from "./components/CategoryRevenueDonut";
import ReturnReplacementCards from "./components/ReturnReplacementCard";
import { useAdsSalesData } from "@/lib/hooks/queries/use-dashboard";
import {
  useHasSellerAccount,
  useHasVendorAccount,
} from "@/lib/hooks/queries/use-user-profile";

// Separate component that uses the context
const DashboardContent = () => {
  // Access the date range context
  const { dateRange, updateCustomDates } = useDateRange();
  const {
    formatCurrency,
    formatNumber,
    formatCurrencyNoDecimal,
    formatPercentage,
    getCurrencySymbol,
    formatChange,
  } = useCurrency();

  // Account connectivity — this is what we gate rendering on, not RBAC.
  // Any user with at least one connected Amazon account (seller or vendor)
  // can see this page; what differs is which cards make sense to show,
  // since some data sources (returns/replacements, inventory aging) have
  // no vendor-side equivalent at all.
  const { hasSellerAccount, isLoading: isSellerAccountLoading } =
    useHasSellerAccount();
  const { hasVendorAccount, isLoading: isVendorAccountLoading } =
    useHasVendorAccount();

  const isAccountInfoLoading = isSellerAccountLoading || isVendorAccountLoading;

  // Convert context date range to FilterBar format
  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
      // Format dates as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      updateCustomDates(
        formatLocalDate(newRange.startDate),
        formatLocalDate(newRange.endDate)
      );
    }
  };

  // Fetch ads-sales data using the hook
  const {
    data: adsSalesData,
    isLoading: isAdsSalesLoading,
    error: adsSalesError,
    isError: isAdsSalesError,
  } = useAdsSalesData(
    {
      start_date: dateRange.startDate || "",
      end_date: dateRange.endDate || "",
      focus_level: "all",
    },
    !!(dateRange.startDate && dateRange.endDate)
  );

  // Create metrics data from API response
  const getMetricsData = (): MetricsCardProps[] => {
    if (!adsSalesData || isAdsSalesLoading) {
      // Return loading state
      return [
        {
          title: "Revenue",
          value: "Loading...",
          icon: DollarSign,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "Units",
          value: "Loading...",
          icon: Package,
          bgColor: "bg-white",
          color: "bg-gold-300",
        },
        {
          title: "ASP",
          value: "Loading...",
          icon: ShoppingCart,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "TACOS",
          value: "Loading...",
          icon: PercentIcon,
          bgColor: "bg-white",
          color: "bg-gold-300",
        },
        {
          title: "ACOS",
          value: "Loading...",
          icon: PercentIcon,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
      ];
    }

    const current = adsSalesData.current_period;
    const changes = adsSalesData.changes;

    return [
      {
        title: "Revenue",
        value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(
          current["Total Sales"]
        )}`,
        icon: DollarSign,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "Units",
        value: formatNumber(current["Total Order Items"]),
        icon: Package,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "ASP",
        value: `${getCurrencySymbol()}${formatCurrency(current["ASP"])}`,
        icon: ShoppingCart,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "TACOS",
        value: formatPercentage(current["TACOS"]),
        icon: PercentIcon,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "ACOS",
        value: formatPercentage(current["ACOS"]),
        icon: PercentIcon,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
    ];
  };

  const metricsData = getMetricsData();

  // Show error state if needed
  if (isAdsSalesError && adsSalesError) {
    console.error("Error fetching ads-sales data:", adsSalesError);
  }

  // Avoid a layout flash where seller-only cards briefly render before we
  // know which accounts are connected. Account info is cheap/cached
  // (useUserProfile has a 30min staleTime) so this should resolve fast.
  if (isAccountInfoLoading) {
    return (
      <div className="min-h-screen py-12 px-12 font-montserrat">
        <div className="w-full transition-all duration-300">
          <FilterBar
            title="Command Center"
            dateRange={filterBarDateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-12 font-montserrat">
      <div className="w-full transition-all duration-300">
        {/* Filter Bar with date range integration */}
        <FilterBar
          title="Command Center"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        <div className="flex flex-col ">
          <h2 className="text-xl  font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Performance Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
            {metricsData.map((metric, index) => (
              <MetricsCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                change={metric.change}
                changeType={metric.changeType}
                bgColor={metric.bgColor}
                color={metric.color}
                className="animate-fadeIn"
                showTrendButton={true}
                // style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col ">
          <h2 className="text-xl font-bold text-[#1a2b3c] tracking-tight px-2">
            Highlights
          </h2>

          {/* <section className="bg-[#EAF2FF] rounded-2xl p-4 md:p-6"> */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-6 py-6">
              {/* Left: Top ASINs */}
              <div className="lg:col-span-2">
                  <TopAsinsRevenue
                    data={adsSalesData?.top_5_asins_by_revenue}
                    isLoading={isAdsSalesLoading}
                    isError={isAdsSalesError}
                  />
              </div>

              {/* Right: Donut + Lowlights */}
              <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">

                  <CategoryRevenueDonut />

                  {/*
                    ReturnReplacementCards has no vendor-data equivalent —
                    FBA-only by definition (return/replacement reports only
                    exist for Seller Central). Don't mount it at all for
                    vendor-only accounts rather than letting it fetch and
                    fail, or render an empty/broken card.
                  */}
                  {hasSellerAccount && <ReturnReplacementCards />}
              </div>
            </div>
          {/* </section> */}
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c]  tracking-tight px-2">
            Advertising Snapshot
          </h2>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-6 py-6">
            <div className="rounded-2xl flex w-full bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-5 row-span-1 transition-all duration-300 animate-fadein delay-300 h-full">
              <AdvancedFunnel />
            </div>

            {/* Ads Type Split - takes up 2 columns on the right */}
            <div className="col-span-1 lg:col-span-2 row-span-1 h-full">
              <AdsSplitBubbleChart />
            </div>
          </div>
        </div>

        {hasSellerAccount && (
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Inventory
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
            {/*
              InventoryAging has no vendor-data equivalent — there's no
              vendor aging/days-in-inventory report at all, so this card
              only makes sense for seller accounts. Same treatment as
              ReturnReplacementCards above: don't mount it for vendor-only.
            */}
            
              <div className="col-span-2 lg:col-span-2 row-span-1 h-full">
                <InventoryAging />
              </div>
            

            {/*
              InventoryHealthDonut and InventoryReplenishment both call
              inventory-health, which now computes correctly from vendor
              data alone when there's no seller account (see InventoryService
              vendor-only fix). These can always render — no gating needed.
            */}
            <div className="col-span-2 lg:col-span-2 row-span-1 h-full">
              <InventoryHealthDonut />
            </div>
            <div className="col-span-2 lg:col-span-2 row-span-1 h-full">
              <InventoryReplenishment />
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};


export default function DashboardLayout() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <DashboardContent />
    </DateRangeProvider>
  );
}
"use client";
import React from "react";
import { MetricsCard, type MetricsCardProps } from "@/components/dashboard/ui";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext"; // Direct import
import { useCampaignMetrics } from "@/lib/hooks/queries/use-dashboard";
import { 
  Eye, 
  MousePointer, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Target,
  PercentIcon,
  ShoppingCart,
  TrendingDown,
  BarChart3
} from "lucide-react";

const CampaignMetricsCardGrid: React.FC = () => {
  // Access the date range context
  const { dateRange } = useDateRange();

  // Access the currency context
  const { formatCurrency, formatNumber, getCurrencySymbol, formatCurrencyNoDecimal, formatPercentage, error: currencyError } = useCurrency();

  // Fetch campaign metrics data using the hook
  const {
    data: campaignMetricsData,
    isLoading: isCampaignMetricsLoading,
    error: campaignMetricsError,
    isError: isCampaignMetricsError,
  } = useCampaignMetrics({
    start_date: dateRange.startDate || "",
    end_date: dateRange.endDate || "",
    focus_level: "all",
  }, !!(dateRange.startDate && dateRange.endDate));

  // Currency formatting function


  const formatDecimal = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const formatChange = (change: number, suffix: string = "%") => {
    const absChange = Math.abs(change);
    const sign = change >= 0 ? "+" : "-";
    return `${sign}${absChange.toFixed(1)}${suffix}`;
  };

  // Create metrics data from API response
  const getMetricsData = (): MetricsCardProps[] => {
    if (!campaignMetricsData || isCampaignMetricsLoading) {
      // Return loading state for all 10 metrics
      return [
        {
          title: "Impressions",
          value: "Loading...",
          icon: Eye,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "Clicks",
          value: "Loading...",
          icon: MousePointer,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
        {
          title: "CTR",
          value: "Loading...",
          icon: Target,
          bgColor: "bg-white",
          color: "bg-ocean-300",

        },
        {
          title: "CPC",
          value: "Loading...",
          icon: DollarSign,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
        {
          title: "Ad Costs",
          value: "Loading...",
          icon: TrendingDown,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "Orders",
          value: "Loading...",
          icon: Package,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
        {
          title: "CVR",
          value: "Loading...",
          icon: TrendingUp,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "Ad Sales",
          value: "Loading...",
          icon: ShoppingCart,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
        {
          title: "ACOS",
          value: "Loading...",
          icon: PercentIcon,
          bgColor: "bg-white",
          color: "bg-ocean-300",
        },
        {
          title: "Ad Sales %",
          value: "Loading...",
          icon: BarChart3,
          bgColor: "bg-white",
          color: "bg-gold-400",
        },
      ];
    }

    const current = campaignMetricsData.current_period;
    const changes = campaignMetricsData.changes;

    return [
      {
        title: "Impressions",
        value: formatNumber(current.Impressions),
        icon: Eye,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "Clicks",
        value: formatNumber(current.Clicks),
        icon: MousePointer,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "CTR",
        value: `${formatPercentage(current.CTR)}`,
        icon: Target,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "CPC",
        value: `${getCurrencySymbol()}${formatCurrency(current.CPC)}`,
        icon: DollarSign,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "Ad Costs",
        value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(current["Ad Costs"])}`,
        icon: TrendingDown,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "Orders",
        value: formatNumber(current.Orders),
        icon: Package,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "CVR",
        value: `${formatDecimal(current.CVR)}%`,
        icon: TrendingUp,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "Ad Sales",
        value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(current["Ads Sales"])}`,
        icon: ShoppingCart,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
      {
        title: "ACOS",
        value: `${formatDecimal(current.ACOS)}%`,
        icon: PercentIcon,
        bgColor: "bg-white",
        color: "bg-ocean-300",
      },
      {
        title: "Ad Sales %",
        value: `${formatDecimal(current["Ads Sales %"])}%`,
        icon: BarChart3,
        bgColor: "bg-white",
        color: "bg-gold-400",
      },
    ];
  };

  const metricsData = getMetricsData();

  // Show error state if needed
  if (isCampaignMetricsError && campaignMetricsError) {
    console.error("Error fetching campaign metrics data:", campaignMetricsError);
  }

  // Show currency error if needed (but don't block the UI)
  if (currencyError) {
    console.warn("Currency context error:", currencyError);
  }

  return (
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
        />
      ))}
    </div>
  );
};

export default CampaignMetricsCardGrid;
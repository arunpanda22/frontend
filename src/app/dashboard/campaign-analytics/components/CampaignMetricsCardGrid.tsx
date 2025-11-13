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
  const { formatCurrency, formatNumber, formatCurrencyNoDecimal, formatPercentage, isLoading: isCurrencyLoading, error: currencyError } = useCurrency();

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
          change: "Loading...",
          changeType: "increase",
          bgColor: "blue",
        },
        {
          title: "Clicks",
          value: "Loading...",
          icon: MousePointer,
          change: "Loading...",
          changeType: "increase",
          bgColor: "green",
        },
        {
          title: "CTR",
          value: "Loading...",
          icon: Target,
          change: "Loading...",
          changeType: "increase",
          bgColor: "purple",
        },
        {
          title: "CPC",
          value: "Loading...",
          icon: DollarSign,
          change: "Loading...",
          changeType: "decrease",
          bgColor: "orange",
        },
        {
          title: "Ad Costs",
          value: "Loading...",
          icon: TrendingDown,
          change: "Loading...",
          changeType: "decrease",
          bgColor: "red",
        },
        {
          title: "Orders",
          value: "Loading...",
          icon: Package,
          change: "Loading...",
          changeType: "increase",
          bgColor: "indigo",
        },
        {
          title: "CVR",
          value: "Loading...",
          icon: TrendingUp,
          change: "Loading...",
          changeType: "increase",
          bgColor: "pink",
        },
        {
          title: "Ad Sales",
          value: "Loading...",
          icon: ShoppingCart,
          change: "Loading...",
          changeType: "increase",
          bgColor: "yellow",
        },
        {
          title: "ACOS",
          value: "Loading...",
          icon: PercentIcon,
          change: "Loading...",
          changeType: "decrease",
          bgColor: "red",
        },
        {
          title: "Ad Sales %",
          value: "Loading...",
          icon: BarChart3,
          change: "Loading...",
          changeType: "increase",
          bgColor: "blue",
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
        change: `${formatChange(changes.Impressions)}`,
        changeType: changes.Impressions >= 0 ? "increase" : "decrease",
        bgColor: "blue",
      },
      {
        title: "Clicks",
        value: formatNumber(current.Clicks),
        icon: MousePointer,
        change: `${formatChange(changes.Clicks)}`,
        changeType: changes.Clicks >= 0 ? "increase" : "decrease",
        bgColor: "green",
      },
      {
        title: "CTR",
        value: `${formatPercentage(current.CTR)}`,
        icon: Target,
        change: `${formatChange(changes.CTR)}`,
        changeType: changes.CTR >= 0 ? "increase" : "decrease",
        bgColor: "purple",
      },
      {
        title: "CPC",
        value: formatCurrency(current.CPC),
        icon: DollarSign,
        change: `${formatChange(changes.CPC)}`,
        changeType: changes.CPC >= 0 ? "decrease" : "increase", // Lower CPC is better
        bgColor: "orange",
      },
      {
        title: "Ad Costs",
        value: formatCurrencyNoDecimal(current["Ad Costs"]),
        icon: TrendingDown,
        change: `${formatChange(changes["Ad Costs"])}`,
        changeType: changes["Ad Costs"] >= 0 ? "decrease" : "increase", // Lower costs might be better
        bgColor: "red",
      },
      {
        title: "Orders",
        value: formatNumber(current.Orders),
        icon: Package,
        change: `${formatChange(changes.Orders)}`,
        changeType: changes.Orders >= 0 ? "increase" : "decrease",
        bgColor: "indigo",
      },
      {
        title: "CVR",
        value: `${formatDecimal(current.CVR)}%`,
        icon: TrendingUp,
        change: `${formatChange(changes.CVR)}`,
        changeType: changes.CVR >= 0 ? "increase" : "decrease",
        bgColor: "pink",
      },
      {
        title: "Ad Sales",
        value: formatCurrencyNoDecimal(current["Ads Sales"]),
        icon: ShoppingCart,
        change: `${formatChange(changes["Ads Sales"])}`,
        changeType: changes["Ads Sales"] >= 0 ? "increase" : "decrease",
        bgColor: "yellow",
      },
      {
        title: "ACOS",
        value: `${formatDecimal(current.ACOS)}%`,
        icon: PercentIcon,
        change: `${formatChange(changes.ACOS, "")}`,
        changeType: changes.ACOS >= 0 ? "decrease" : "increase", // Lower ACOS is better
        bgColor: "red",
      },
      {
        title: "Ad Sales %",
        value: `${formatDecimal(current["Ads Sales %"])}%`,
        icon: BarChart3,
        change: `${formatChange(changes["Ads Sales %"])}`,
        changeType: changes["Ads Sales %"] >= 0 ? "increase" : "decrease",
        bgColor: "blue",
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
          className="animate-fadeIn"
        />
      ))}
    </div>
  );
};

export default CampaignMetricsCardGrid;
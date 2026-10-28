"use client";

/**
 * FlipkartKpiCards: the KPI card grid at the top of the Flipkart Campaign Summary page.
 * Flipkart counterpart of Amazon's CampaignMetricsCardGrid.
 *
 * Place at: src/app/flipkart/dashboard/command-center/components/FlipkartKpiCards.tsx
 *
 * DATA
 *   Reads GET /api/v1/fk/dashboard/campaign-metrics/ through useFlipkartCampaignMetrics, using the
 *   date range from DateRangeContext (the page must be wrapped in <DateRangeProvider>).
 *   `adsTenant` is optional: when omitted the backend uses the user's oldest active ad account.
 *
 * CARDS (10, same 5 x 2 grid as Amazon)
 *   Impressions, Clicks, CTR, CPC, Spend, Units, CVR, Revenue, ACOS, ROAS.
 *   The backend also returns ASP and CPM; add a CARDS entry below to show them.
 *
 * FORMATTING RULES
 *   - Money is rupees: the symbol is the constant CURRENCY_SYMBOL, NOT useCurrency().getCurrencySymbol(),
 *     because that function is tied to the Amazon marketplace currencies. The number itself still comes
 *     from the shared useCurrency() formatters, so grouping/decimals match the Amazon pages.
 *   - CTR, CVR and ACOS arrive already on the 0-100 scale (do not multiply). ROAS is a multiplier ("3.25x").
 *
 * PERIOD-OVER-PERIOD CHANGE
 *   `changes` comes from the backend as a percent per metric (current vs previous period of the same length).
 *   - Metrics where LOWER is better (Spend, CPC, ACOS) are listed in LOWER_IS_BETTER: a rise is shown as
 *     "negative". Everything else treats a rise as "positive".
 *   - The backend sends 100 when the previous value was 0 and the current one is above 0 (it cannot divide by
 *     zero). That is not a real +100%, so this component shows the text "New" in that case.
 *
 * !! ONE ASSUMPTION TO CHECK: MetricsCard's `changeType` values. Amazon's pages never pass `change` /
 * `changeType`, so I could not see the accepted values. `toChangeType()` below is the ONLY place that
 * produces them ("positive" / "negative"). If MetricsCard expects different strings, change that one function.
 */
import React from "react";
import { MetricsCard, type MetricsCardProps } from "@/components/dashboard/ui";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useFlipkartCampaignMetrics } from "@/lib/hooks/queries/use-flipkart-dashboard";
import type { FlipkartMetricKey } from "@/lib/api/services/flipkart-dashboard.service";
import {
  Eye,
  MousePointer,
  Target,
  DollarSign,
  TrendingDown,
  Package,
  TrendingUp,
  ShoppingCart,
  PercentIcon,
  BarChart3,
} from "lucide-react";

/** Flipkart money is always rupees. See the FORMATTING RULES in the file header. */
const CURRENCY_SYMBOL = "₹";

/** Metrics where a LOWER value is better, so an increase is shown as a bad change. */
const LOWER_IS_BETTER: ReadonlySet<FlipkartMetricKey> = new Set(["Spend", "CPC", "ACOS", "CPM"]);

type CardFormat = "number" | "money" | "money2" | "percent" | "multiplier";

interface CardDefinition {
  key: FlipkartMetricKey;
  title: string;
  icon: MetricsCardProps["icon"];
  /** Alternates ocean / gold like the Amazon grid. */
  color: string;
  format: CardFormat;
}

/** Order here = order on screen. */
const CARDS: CardDefinition[] = [
  { key: "Impressions", title: "Impressions", icon: Eye, color: "bg-ocean-300", format: "number" },
  { key: "Clicks", title: "Clicks", icon: MousePointer, color: "bg-gold-400", format: "number" },
  { key: "CTR", title: "CTR", icon: Target, color: "bg-ocean-300", format: "percent" },
  { key: "CPC", title: "CPC", icon: DollarSign, color: "bg-gold-400", format: "money2" },
  { key: "Spend", title: "Ad Spend", icon: TrendingDown, color: "bg-ocean-300", format: "money" },
  { key: "Units", title: "Units", icon: Package, color: "bg-gold-400", format: "number" },
  { key: "CVR", title: "CVR", icon: TrendingUp, color: "bg-ocean-300", format: "percent" },
  { key: "Revenue", title: "Ad Revenue", icon: ShoppingCart, color: "bg-gold-400", format: "money" },
  { key: "ACOS", title: "ACOS", icon: PercentIcon, color: "bg-ocean-300", format: "percent" },
  { key: "ROAS", title: "ROAS", icon: BarChart3, color: "bg-gold-400", format: "multiplier" },
];

/**
 * The single place that turns "is this change good or bad" into MetricsCard's `changeType` value.
 * Double cast on purpose: the real union type is unknown to this file (see the header note).
 */
function toChangeType(isGood: boolean): MetricsCardProps["changeType"] {
  return (isGood ? "positive" : "negative") as unknown as MetricsCardProps["changeType"];
}

interface FlipkartKpiCardsProps {
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
}

const FlipkartKpiCards: React.FC<FlipkartKpiCardsProps> = ({ adsTenant }) => {
  const { dateRange } = useDateRange();
  const {
    formatNumber,
    formatCurrency,
    formatCurrencyNoDecimal,
    formatNumberWithDecimals,
    formatChange,
  } = useCurrency();

  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError, error } = useFlipkartCampaignMetrics(
    { start_date: startDate, end_date: endDate, ads_tenant: adsTenant },
    !!(startDate && endDate)
  );

  const formatValue = (format: CardFormat, value: number): string => {
    switch (format) {
      case "number":
        return formatNumber(value);
      case "money":
        return `${CURRENCY_SYMBOL}${formatCurrencyNoDecimal(value)}`;
      case "money2":
        return `${CURRENCY_SYMBOL}${formatCurrency(value)}`;
      case "percent":
        return `${formatNumberWithDecimals(value)}%`;
      case "multiplier":
        return `${formatNumberWithDecimals(value)}x`;
    }
  };

  const buildCards = (): MetricsCardProps[] => {
    // Loading (or not enabled yet) and error both render placeholder values, like the Amazon grid.
    if (!data) {
      const placeholder = isError ? "—" : "Loading...";
      return CARDS.map((card) => ({
        title: card.title,
        value: placeholder,
        icon: card.icon,
        bgColor: "bg-white",
        color: card.color,
      }));
    }

    return CARDS.map((card) => {
      const current = data.current_period[card.key];
      const previous = data.previous_period[card.key];
      const change = data.changes[card.key];

      // Backend sends 100 when previous was 0 and current > 0: show "New" instead of a fake +100%.
      const isNew = previous === 0 && current > 0;
      const isBetter = LOWER_IS_BETTER.has(card.key) ? change <= 0 : change >= 0;

      return {
        title: card.title,
        value: formatValue(card.format, current),
        icon: card.icon,
        change: isNew ? "New" : formatChange(change, "%"),
        changeType: toChangeType(isNew || isBetter),
        bgColor: "bg-white",
        color: card.color,
      };
    });
  };

  if (isError && error) {
    console.error("Error fetching Flipkart campaign metrics:", error);
  }

  return (
    <div>
      {isError && (
        <div className="text-sm text-red-500 px-2 mb-3">
          Failed to load campaign metrics. Please try again later.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
        {buildCards().map((metric) => (
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
    </div>
  );
};

export default FlipkartKpiCards;
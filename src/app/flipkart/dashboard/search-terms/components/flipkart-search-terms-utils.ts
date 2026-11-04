/**
 * flipkart-search-terms-utils.ts: constants, formatters and small helpers shared by every component of the
 * Flipkart Search Terms page.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/flipkart-search-terms-utils.ts
 *
 * CONTENTS
 *   CURRENCY_SYMBOL            Flipkart money is rupees. (The Campaign Summary page keeps its own copy in
 *                              command-center/components/flipkart-constants.ts; move both to one shared
 *                              place when convenient.)
 *   DEFAULT_MIN_CLICKS         must match the backend default (search_term_analysis.DEFAULT_MIN_CLICKS)
 *   CLASSIFICATION_META        label, hint, chart colour and badge classes per classification
 *   buildSearchTermsParams()   the ONE place that builds the query params shared by the summary-based
 *                              components, so their React Query keys are identical and the request is shared
 *   useFlipkartFormatters()    number / money / percent / ROAS / change formatters on top of useCurrency()
 *   toChangeType()             MetricsCard `changeType` value (see the note on it)
 */
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { MetricsCardProps } from "@/components/dashboard/ui";
import type {
  FlipkartSearchTermsParams,
  SearchTermClassification,
} from "@/lib/api/services/flipkart-search-terms.service";

export const CURRENCY_SYMBOL = "₹";

/** Backend default for min_clicks. Keep in sync with search_term_analysis.DEFAULT_MIN_CLICKS. */
export const DEFAULT_MIN_CLICKS = 10;

export interface ClassificationMeta {
  label: string;
  /** One-line explanation shown in tooltips and legends. */
  hint: string;
  /** Hex colour used by the donut and legend dots. */
  color: string;
  /** Tailwind classes for the badge (literal strings so Tailwind keeps them). */
  badgeClass: string;
}

export const CLASSIFICATION_META: Record<SearchTermClassification, ClassificationMeta> = {
  winner: {
    label: "Winner",
    hint: "Converts at or above the baseline ROAS",
    color: "#10B981",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  inefficient: {
    label: "Inefficient",
    hint: "Converts, but below the baseline ROAS",
    color: "#FFBF00",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  wasted: {
    label: "Wasted",
    hint: "Enough clicks but no units: negative-keyword candidates",
    color: "#E41F66",
    badgeClass: "bg-rose-50 text-rose-700",
  },
  low_data: {
    label: "Low data",
    hint: "Too few clicks to judge",
    color: "#9CA3AF",
    badgeClass: "bg-gray-100 text-gray-600",
  },
};

interface SearchTermsParamsInput {
  startDate: string;
  endDate: string;
  adsTenant?: string;
  campaignId: string | null;
  minClicks: number;
}

/**
 * Query params of the summary endpoint. Every component that reads the summary (cards, notice, classification
 * chart) MUST call this so the React Query key is identical and the three share one request.
 */
export function buildSearchTermsParams(input: SearchTermsParamsInput): FlipkartSearchTermsParams {
  return {
    start_date: input.startDate,
    end_date: input.endDate,
    ads_tenant: input.adsTenant,
    campaign_id: input.campaignId ?? undefined,
    min_clicks: input.minClicks,
  };
}

/**
 * Formatters for the Flipkart pages. Numbers go through the shared useCurrency() formatters so grouping and
 * decimals match the rest of the app; only the symbol is fixed to rupees (useCurrency().getCurrencySymbol() is
 * tied to the Amazon marketplace currencies).
 */
export function useFlipkartFormatters() {
  const { formatNumber, formatCurrency, formatCurrencyNoDecimal, formatNumberWithDecimals, formatChange } =
    useCurrency();

  return {
    /** 1,234 */
    count: (value: number) => formatNumber(value),
    /** ₹1,234 */
    money: (value: number) => `${CURRENCY_SYMBOL}${formatCurrencyNoDecimal(value)}`,
    /** ₹1,234.56 */
    money2: (value: number) => `${CURRENCY_SYMBOL}${formatCurrency(value)}`,
    /** 12.34% (the backend sends percent metrics on the 0-100 scale) */
    percent: (value: number) => `${formatNumberWithDecimals(value)}%`,
    /** 3.25x */
    roas: (value: number) => `${formatNumberWithDecimals(value)}x`,
    /** +5.3% / -2.1% */
    change: (value: number) => formatChange(value, "%"),
  };
}

/**
 * The single place that turns "is this change good or bad" into MetricsCard's `changeType` value.
 * Double cast on purpose: the real union type of `changeType` is not visible from here. If MetricsCard expects
 * strings other than "positive" / "negative", change them here (the Campaign Summary page has the same function
 * in FlipkartKpiCards.tsx).
 */
export function toChangeType(isGood: boolean): MetricsCardProps["changeType"] {
  return (isGood ? "positive" : "negative") as unknown as MetricsCardProps["changeType"];
}
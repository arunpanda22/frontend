/**
 * Formatting helpers and display metadata for the Flipkart Keywords page.
 *
 * Place at: src/app/flipkart/dashboard/keywords/utils/keywordFormat.ts
 *
 * Self-contained on purpose: Flipkart is rupee-only, so money is formatted with the Indian grouping (12,34,567)
 * and the rupee sign here, without depending on CurrencyContext (which formats with the Amazon marketplace
 * currency). If the app later wants one central formatter, replace the bodies of these functions; the components
 * only call these names.
 *
 * Units of the values from the API (see flipkart-keywords.service.ts): CTR / CVR / ACOS are percent numbers
 * (5.25 means 5.25%), ROAS is a multiplier (3.4 means 3.4x), money is rupees.
 */
import type { KeywordClassification } from "@/lib/api/services/flipkart-keywords.service";

export const RUPEE = "₹";

const countFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const money0Format = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const money2Format = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** 1,23,456 */
export function formatCount(value: number | null | undefined): string {
  return isNumber(value) ? countFormat.format(value) : "0";
}

/** ₹1,23,456 (decimals = 0) or ₹1,234.50 (decimals = 2). */
export function formatMoney(value: number | null | undefined, decimals: 0 | 2 = 0): string {
  const safe = isNumber(value) ? value : 0;
  return `${RUPEE}${(decimals === 2 ? money2Format : money0Format).format(safe)}`;
}

/** 5.25% (the API value is already on the 0-100 scale). */
export function formatPercent(value: number | null | undefined): string {
  return `${(isNumber(value) ? value : 0).toFixed(2)}%`;
}

/** 3.40x */
export function formatRoas(value: number | null | undefined): string {
  return `${(isNumber(value) ? value : 0).toFixed(2)}x`;
}

/** +12.3% / -4.0% (period-over-period change). */
export function formatChange(change: number | null | undefined): string {
  const safe = isNumber(change) ? change : 0;
  return `${safe >= 0 ? "+" : "-"}${Math.abs(safe).toFixed(1)}%`;
}

/** Signed difference with a suffix: +0.42% / -1.10x. */
export function formatSigned(value: number | null | undefined, suffix: string): string {
  const safe = isNumber(value) ? value : 0;
  return `${safe >= 0 ? "+" : "-"}${Math.abs(safe).toFixed(2)}${suffix}`;
}

/** Display metadata for the four keyword classifications (same labels as the Search Terms page). */
export const CLASSIFICATION_META: Record<
  KeywordClassification,
  { label: string; badge: string; dot: string; description: string }
> = {
  winner: {
    label: "Winner",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    description: "Sells, and its ROAS is at or above the baseline",
  },
  inefficient: {
    label: "Inefficient",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    description: "Sells, but its ROAS is below the baseline",
  },
  wasted: {
    label: "Wasted",
    badge: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
    description: "Enough clicks but no sales: a negative or bid-cut candidate",
  },
  low_data: {
    label: "Low data",
    badge: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
    description: "Too few clicks to judge",
  },
};

/** Badge colours for a Flipkart campaign status string. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "LIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PAUSED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "UNKNOWN":
      return "bg-gray-100 text-gray-500 border-gray-200";
    default:
      return "bg-red-50 text-red-600 border-red-200"; // ABORTED, TOTAL_BUDGET_MET, FUND_INSUFFICIENT, ...
  }
}
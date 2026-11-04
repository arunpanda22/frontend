"use client";

/**
 * Green / red badge for "this campaign vs the account baseline" on a campaign card header.
 * Flipkart counterpart of the DiffBadge on Amazon's ASINCard ("vs market").
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordDiffBadge.tsx
 *
 * `value` is campaign minus baseline from the API (ctr_vs_baseline, cvr_vs_baseline, roas_vs_baseline): percentage
 * points for CTR / CVR (suffix "%"), multiplier points for ROAS (suffix "x"). Green when at or above the baseline.
 * When the campaign has no data for the metric (`hasData` false) the badge is not drawn, because a difference
 * against a missing value would be noise.
 */
import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatSigned } from "../utils/keywordFormat";

interface FlipkartKeywordDiffBadgeProps {
  value: number;
  /** "%" for CTR / CVR, "x" for ROAS. */
  suffix: "%" | "x";
  /** False when the campaign has no impressions / clicks / spend for this metric. */
  hasData?: boolean;
}

export default function FlipkartKeywordDiffBadge({ value, suffix, hasData = true }: FlipkartKeywordDiffBadgeProps) {
  if (!hasData) return null;

  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
      title="Difference from the account baseline"
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {formatSigned(value, suffix)}
    </span>
  );
}
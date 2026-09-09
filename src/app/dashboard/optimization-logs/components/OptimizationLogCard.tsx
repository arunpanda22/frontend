"use client";

import React, { useState } from "react";
import {
  Download, ChevronDown, ChevronUp,
  CheckCircle2, Calendar, BarChart3, Layers,
} from "lucide-react";
import type { OptimizationLogGroup, OptimizationType } from "@/lib/hooks/use-optimization-logs";
import { downloadOptimizationLogs } from "@/lib/hooks/use-optimization-logs";

// ── Per-type config ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<OptimizationType, {
  label:       string;
  accent:      string;   // Tailwind bg class for badge
  border:      string;   // card border
  headerBg:    string;   // card header bg
  iconColor:   string;
}> = {
  weekly: {
    label:     "Weekly",
    accent:    "bg-powder-blue-600 text-white",
    border:    "border-powder-blue-200",
    headerBg:  "bg-powder-blue-50",
    iconColor: "text-powder-blue-600",
  },
  daily: {
    label:     "Daily",
    accent:    "bg-emerald-600 text-white",
    border:    "border-emerald-200",
    headerBg:  "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  dayparting: {
    label:     "Dayparting",
    accent:    "bg-violet-600 text-white",
    border:    "border-violet-200",
    headerBg:  "bg-violet-50",
    iconColor: "text-violet-600",
  },
};

// ── Ads type colour dots ──────────────────────────────────────────────────────

const ADS_TYPE_COLOURS: Record<string, string> = {
  sp_bid:       "bg-blue-500",
  sp_placement: "bg-blue-300",
  sp_budget:    "bg-blue-700",
  sp_harvest:   "bg-sky-500",
  sp_negatives: "bg-sky-300",
  sb_bid:       "bg-amber-500",
  sb_placement: "bg-amber-300",
  sb_budget:    "bg-amber-700",
  sb_harvest:   "bg-orange-500",
  sb_negatives: "bg-orange-300",
  sd_bid:       "bg-rose-500",
  sd_budget:    "bg-rose-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OptimizationLogCardProps {
  group:    OptimizationLogGroup;
  onError?: (msg: string) => void;
}

export function OptimizationLogCard({ group, onError }: OptimizationLogCardProps) {
  const [expanded,    setExpanded]    = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cfg = TYPE_CONFIG[group.optimization_type] ?? TYPE_CONFIG.weekly;

  const handleDownload = async () => {
    setDownloading(true);
    await downloadOptimizationLogs(group.date, group.optimization_type, onError);
    setDownloading(false);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${cfg.border} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}>

      {/* Header */}
      <div className={`${cfg.headerBg} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.accent}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-1.5 text-gray-600 text-sm">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(group.date)}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-gray-300
                     text-gray-700 text-sm font-medium rounded-lg shadow-sm
                     hover:bg-gray-50 hover:border-gray-400 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Downloading…
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Download Excel
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="px-6 py-4 grid grid-cols-3 divide-x divide-gray-100">
        <div className="pr-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
            <BarChart3 className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
            Total rows pushed
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {group.total_rows.toLocaleString()}
          </div>
        </div>
        <div className="px-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
            <Layers className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
            Categories
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {group.category_count}
          </div>
        </div>
        <div className="pl-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
            <CheckCircle2 className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
            Completed
          </div>
          <div className="text-sm font-medium text-gray-700">
            {formatTime(group.first_pushed_at)}
            {group.first_pushed_at !== group.last_pushed_at && (
              <span className="text-gray-400"> – {formatTime(group.last_pushed_at)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category list — collapsible */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-6 py-3
                     text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">
            {expanded ? "Hide" : "Show"} category breakdown
          </span>
          {expanded
            ? <ChevronUp  className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />
          }
        </button>

        {expanded && (
          <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.categories.map((cat) => (
              <div
                key={`${cat.ads_type}-${cat.pushed_at}`}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ADS_TYPE_COLOURS[cat.ads_type] ?? "bg-gray-400"}`} />
                  <span className="text-sm font-medium text-gray-700">{cat.ads_type_display}</span>
                </div>
                <span className="text-sm text-gray-500 tabular-nums">
                  {cat.row_count.toLocaleString()} rows
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
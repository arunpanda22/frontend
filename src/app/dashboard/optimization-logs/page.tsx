"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft, RefreshCw, Filter, Calendar,
  TrendingUp, Activity, Clock,
} from "lucide-react";
import {
  useOptimizationLogs,
  type OptimizationType,
  type LogsFilters,
} from "@/lib/hooks/use-optimization-logs";
import { OptimizationLogCard } from "./components/OptimizationLogCard";

// ── Tab config ────────────────────────────────────────────────────────────────

type TabKey = OptimizationType | "all";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all",        label: "All",        icon: <Activity  className="w-4 h-4" /> },
  { key: "weekly",     label: "Weekly",     icon: <TrendingUp className="w-4 h-4" /> },
  { key: "daily",      label: "Daily",      icon: <Calendar  className="w-4 h-4" /> },
  { key: "dayparting", label: "Dayparting", icon: <Clock     className="w-4 h-4" /> },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OptimizationLogsPage() {
  const router = useRouter();

  const [activeTab,  setActiveTab]  = useState<TabKey>("all");
  const [fromDate,   setFromDate]   = useState("");
  const [toDate,     setToDate]     = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Always fetch all logs — filtering and tab counts are done client-side
  // so switching tabs doesn't trigger extra API calls or zero out counts.
  const dateFilters: LogsFilters = {
    ...(fromDate && { from_date: fromDate }),
    ...(toDate   && { to_date:   toDate   }),
  };

  const { data, isLoading, isError, refetch, isFetching } = useOptimizationLogs(dateFilters);

  const allGroups = data?.results ?? [];

  // Client-side tab filtering
  const groups = activeTab === "all"
    ? allGroups
    : allGroups.filter((g) => g.optimization_type === activeTab);

  const handleError = (msg: string) =>
    toast.error(msg, { position: "top-right", duration: 4000 });

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setShowFilter(false);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-6 w-32 bg-gray-200 rounded-full" />
                <div className="h-8 w-36 bg-gray-100 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-7 w-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-3">Failed to load optimization logs</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-powder-blue-600 text-white rounded-lg text-sm hover:bg-powder-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="w-px h-5 bg-gray-200" /> */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">Optimization History</h1>
                {/* <p className="text-xs text-gray-500">All pushes applied to your Amazon Ads account</p> */}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilter((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition-colors
                  ${showFilter || fromDate || toDate
                    ? "border-powder-blue-400 bg-powder-blue-50 text-powder-blue-700"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {fromDate || toDate ? "Filtered" : "Filter"}
              </button>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300
                           text-gray-600 rounded-lg text-sm hover:border-gray-400 transition-colors
                           disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Date filter panel */}
          {showFilter && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700
                             focus:outline-none focus:ring-2 focus:ring-powder-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700
                             focus:outline-none focus:ring-2 focus:ring-powder-blue-400"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.key
                  ? "bg-powder-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key !== "all" && (
                <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {allGroups.filter((g) => g.optimization_type === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Cards ── */}
        {groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No optimization logs found</p>
            <p className="text-gray-400 text-sm mt-1">
              {fromDate || toDate || activeTab !== "all"
                ? "Try adjusting your filters"
                : "Push some optimizations to see them here"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <OptimizationLogCard
                key={`${group.date}-${group.optimization_type}`}
                group={group}
                onError={handleError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
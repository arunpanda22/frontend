"use client";
import React, { useState } from "react";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import {
  DateRangeProvider,
  useDateRange,
} from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range";
import { CompPtMomTab } from "./components/CompPtMomTab";
import { PlacementMoMTab } from "./components/PlacementMoMTab";
import { AdTypeMoMTab } from "./components/AdTypeMoMTab";
import { TargetingLevelMomTab } from "./components/TargetingLevelMomTab";
import { SummaryTab } from "./components/SummaryTab";
import { SearchTermMomTab } from "./components/SearchTermMomTab";
import { TargetBreakdownTab } from "./components/TargetBreakdownTab";

type TabKey =
  | "summary"
  | "comp-pt-mom"
  | "target-breakdown"
  | "targeting-level-mom"
  | "ad-type-mom"
  | "placement-mom"
  | "searchterm-mom";

const TABS: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "comp-pt-mom", label: "Comp PT" },
  { key: "target-breakdown", label: "Target Breakdown" },
  { key: "targeting-level-mom", label: "Targeting Level" },
  { key: "ad-type-mom", label: "Ad Type" },
  { key: "placement-mom", label: "Placement" },
  { key: "searchterm-mom", label: "Search Term" },
];

function PivotReportsPage() {
  const { dateRange, updateCustomDates } = useDateRange();
  const [activeTab, setActiveTab] = useState<TabKey>("comp-pt-mom");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(
    new Set(["comp-pt-mom"]),
  );

  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  function handleDateRangeChange(newRange: Range) {
    if (newRange.startDate && newRange.endDate) {
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      updateCustomDates(
        formatLocalDate(newRange.startDate),
        formatLocalDate(newRange.endDate),
      );
    }
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setVisitedTabs((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full">
        <FilterBar
          title="Pivot Reports"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        <div className="mb-6 inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-[#1a2b3c] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "summary" && (
          <SummaryTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("summary")}
          />
        )}
        {activeTab === "comp-pt-mom" && (
          <CompPtMomTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("comp-pt-mom")}
          />
        )}
        {activeTab === "targeting-level-mom" && (
          <TargetingLevelMomTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("targeting-level-mom")}
          />
        )}
        {activeTab === "placement-mom" && (
          <PlacementMoMTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("placement-mom")}
          />
        )}
        {activeTab === "ad-type-mom" && (
          <AdTypeMoMTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("ad-type-mom")}
          />
        )}
        {activeTab === "searchterm-mom" && (
          <SearchTermMomTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("searchterm-mom")}
          />
        )}
        {activeTab === "target-breakdown" && (
          <TargetBreakdownTab
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            enabled={visitedTabs.has("target-breakdown")}
          />
        )}
        {/* asin-ty-ly and searchterm-mom land here once built */}
      </div>
    </div>
  );
}

export default function PivotReportsPageWrapper() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <PivotReportsPage />
    </DateRangeProvider>
  );
}

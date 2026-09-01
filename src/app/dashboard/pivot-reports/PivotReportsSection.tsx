// app/dashboard/pivot-reports/PivotReportsSection.tsx
"use client";
import React, { useState } from "react";
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

// Summary listed first — it's tag-independent (pure SP+SB+SD ad data),
// so it's the one guaranteed to show something for every tenant, tagged
// or not. Made the default active tab for the same reason.
const TABS: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "comp-pt-mom", label: "Comp PT" },
  { key: "target-breakdown", label: "Target Breakdown" },
  { key: "targeting-level-mom", label: "Targeting Level" },
  { key: "ad-type-mom", label: "Ad Type" },
  { key: "placement-mom", label: "Placement" },
  { key: "searchterm-mom", label: "Search Term" },
];

export function PivotReportsSection({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(new Set(["summary"]));

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setVisitedTabs((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] tracking-tight px-2 mb-6">Pivot Reports</h2>

      <div className="mb-6 inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? "bg-[#1a2b3c] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <SummaryTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("summary")} />
      )}
      {activeTab === "comp-pt-mom" && (
        <CompPtMomTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("comp-pt-mom")} />
      )}
      {activeTab === "target-breakdown" && (
        <TargetBreakdownTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("target-breakdown")} />
      )}
      {activeTab === "targeting-level-mom" && (
        <TargetingLevelMomTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("targeting-level-mom")} />
      )}
      {activeTab === "ad-type-mom" && (
        <AdTypeMoMTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("ad-type-mom")} />
      )}
      {activeTab === "placement-mom" && (
        <PlacementMoMTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("placement-mom")} />
      )}
      {activeTab === "searchterm-mom" && (
        <SearchTermMomTab startDate={startDate} endDate={endDate} enabled={visitedTabs.has("searchterm-mom")} />
      )}
    </div>
  );
}
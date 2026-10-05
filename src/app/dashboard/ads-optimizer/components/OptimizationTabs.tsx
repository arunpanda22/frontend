"use client";

/**
 * OptimizationTabs
 * ---------------------------------------------------------------------------
 * Purely presentational tab bar used inside <OptimizationSection />.
 * It owns NO state – the parent passes `activeKey` and handles `onChange`.
 *
 * Each tab shows: icon · short label · count badge, plus optional status marks:
 *   - green check  → category already pushed
 *   - orange dot   → unsaved local edits in that tab's table
 *
 * Accessibility: role="tablist" / role="tab" / aria-selected, and each tab's
 * `aria-controls` points at `${idPrefix}-panel-${key}` (set by the section).
 *
 * AI-AGENT NOTES
 *   - Keep this component free of store access; it must stay reusable.
 *   - The tab list scrolls horizontally on narrow screens (overflow-x-auto).
 *     `overflow-y-hidden` is REQUIRED alongside it: CSS forces overflow-y to
 *     `auto` whenever overflow-x is non-visible, which otherwise renders a tiny
 *     vertical scrollbar. Don't add negative margins (e.g. -mb-px) to tabs for
 *     the same reason.
 */

import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";

export interface OptimizationTabItem {
  key: OptimizationKey;
  label: string;
  icon: LucideIcon;
  /** Number of pending optimizations (0 when pushed or empty). */
  count: number;
  isPushed: boolean;
  /** True when the tab's table has edits that were not saved yet. */
  hasUnsaved: boolean;
}

interface OptimizationTabsProps {
  tabs: OptimizationTabItem[];
  activeKey: OptimizationKey;
  onChange: (key: OptimizationKey) => void;
  /** Used to build stable DOM ids so tabs can reference their panels. */
  idPrefix: string;
}

export const OptimizationTabs: React.FC<OptimizationTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  idPrefix,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Optimization categories"
      className="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 px-4"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const isEmpty = tab.count === 0 && !tab.isPushed;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            id={`${idPrefix}-tab-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className={[
              "relative flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-powder-blue-600 text-powder-blue-800"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900",
              isEmpty && !isActive ? "opacity-60" : "",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>

            {tab.isPushed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Pushed" />
            ) : (
              <span
                className={[
                  "min-w-[1.5rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold",
                  isActive ? "bg-powder-blue-100 text-powder-blue-800" : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {tab.count}
              </span>
            )}

            {tab.hasUnsaved && (
              <span
                className="absolute right-1.5 top-2 h-2 w-2 rounded-full bg-orange-500"
                title="Unsaved changes"
                aria-label="Unsaved changes"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
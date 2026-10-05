"use client";

/**
 * OptimizationSection
 * ---------------------------------------------------------------------------
 * One vertically-stacked section of the results page (Sponsored Products,
 * Sponsored Brands or Sponsored Display). Layout:
 *
 *   ┌ [SP] Sponsored Products — 123 total optimizations ──────────────┐
 *   │ Budget (4) │ Bids (12) │ Placement (3) │ New Campaigns │ Negatives│  ← <OptimizationTabs />
 *   ├──────────────────────────────────────────────────────────────────┤
 *   │ <OptimizationTablePanel /> for the active tab                    │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * BEHAVIOUR
 *   - Default tab = first category that has data (falls back to the first tab).
 *   - Panels are mounted LAZILY (first time their tab is opened) and then kept
 *     mounted but hidden. This (a) avoids rendering 12 tables up front and
 *     (b) preserves unsaved edits when the user switches tabs.
 *   - Reads category data / pushed / dirty / result state straight from the
 *     Zustand store so the page doesn't have to drill it all down. Side-effects
 *     (save, push, modal opening) are delegated to props supplied by the page.
 *
 * AI-AGENT NOTES
 *   - Count shown on a tab = saved store count (0 once pushed). Unsaved local
 *     edits don't change it, but they do light the orange dot via `unsavedKeys`.
 *   - Section config (which tabs exist) lives in lib/optimization-table-config.ts.
 */

import React, { useCallback, useMemo, useState } from "react";
import { useAdsOptimizerStore } from "@/lib/hooks/use-ads-optimizer-store";
import type { OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";
import { OptimizationTabs } from "./OptimizationTabs";
import type { OptimizationTabItem } from "./OptimizationTabs";
import { OptimizationTablePanel } from "./OptimizationTablePanel";
import type { SectionConfig } from "../lib/optimization-table-config";

interface OptimizationSectionProps {
  section: SectionConfig;
  /** Key of the category currently being pushed, "ALL" for Push All, or null. */
  pushingCategory: string | null;
  /** Categories whose tables hold unsaved edits (owned by the page). */
  unsavedKeys: Set<OptimizationKey>;
  onUnsavedChange: (key: OptimizationKey, hasUnsaved: boolean) => void;
  onSave: (key: OptimizationKey, data: any[]) => void;
  onPush: (key: OptimizationKey, data: any[], dryrun?: boolean) => Promise<boolean>;
  onViewPushDetails: (key: OptimizationKey) => void;
}

export const OptimizationSection: React.FC<OptimizationSectionProps> = ({
  section,
  pushingCategory,
  unsavedKeys,
  onUnsavedChange,
  onSave,
  onPush,
  onViewPushDetails,
}) => {
  // ── Store slices (subscribe so tabs/panels update on save/push) ──────────
  const categoryData     = useAdsOptimizerStore((s) => s.categoryData);
  const pushedCategories = useAdsOptimizerStore((s) => s.pushedCategories);
  const dirtyCategories  = useAdsOptimizerStore((s) => s.dirtyCategories);
  const pushResults      = useAdsOptimizerStore((s) => s.pushResults);

  const getCount = useCallback(
    (key: OptimizationKey) => (pushedCategories.has(key) ? 0 : categoryData[key]?.length ?? 0),
    [categoryData, pushedCategories],
  );

  // ── Tab state ────────────────────────────────────────────────────────────
  const [activeKey, setActiveKey] = useState<OptimizationKey>(() => {
    const firstWithData = section.categories.find((c) => getCount(c.key) > 0);
    return (firstWithData ?? section.categories[0]).key;
  });

  // Tabs whose panel has been opened at least once (panels then stay mounted).
  const [mountedKeys, setMountedKeys] = useState<Set<OptimizationKey>>(
    () => new Set([activeKey]),
  );

  const handleTabChange = useCallback((key: OptimizationKey) => {
    setActiveKey(key);
    setMountedKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const tabs: OptimizationTabItem[] = section.categories.map((c) => ({
    key: c.key,
    label: c.shortLabel,
    icon: c.icon,
    count: getCount(c.key),
    isPushed: pushedCategories.has(c.key),
    hasUnsaved: unsavedKeys.has(c.key),
  }));

  const sectionTotal = useMemo(
    () => section.categories.reduce((sum, c) => sum + getCount(c.key), 0),
    [section.categories, getCount],
  );

  const idPrefix = `opt-${section.prefix}`;
  const isBusy = pushingCategory !== null;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-powder-blue-300 to-powder-blue-500 shadow-lg">
          <span className="text-lg font-bold text-white">{section.prefix.toUpperCase()}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{section.label}</h2>
          <p className="text-sm text-gray-600">{sectionTotal} total optimizations</p>
        </div>
      </div>

      {/* Tabs */}
      <OptimizationTabs
        tabs={tabs}
        activeKey={activeKey}
        onChange={handleTabChange}
        idPrefix={idPrefix}
      />

      {/* Panels – lazily mounted, kept mounted, hidden when inactive */}
      {section.categories
        .filter((c) => mountedKeys.has(c.key))
        .map((c) => (
          <div
            key={c.key}
            id={`${idPrefix}-panel-${c.key}`}
            role="tabpanel"
            aria-labelledby={`${idPrefix}-tab-${c.key}`}
            className={c.key === activeKey ? "" : "hidden"}
          >
            <OptimizationTablePanel
              categoryKey={c.key}
              categoryTitle={c.title}
              data={categoryData[c.key] ?? []}
              isPushed={pushedCategories.has(c.key)}
              pushResult={pushResults[c.key]}
              isDirty={dirtyCategories.has(c.key)}
              isBusy={isBusy}
              isPushingThis={pushingCategory === c.key}
              onSave={onSave}
              onPush={onPush}
              onViewPushDetails={onViewPushDetails}
              onUnsavedChange={onUnsavedChange}
            />
          </div>
        ))}
    </section>
  );
};
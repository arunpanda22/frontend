// app/dashboard/pivot-reports/hooks/use-pivot-report-controls.ts
'use client'

/**
 * usePivotReportControls — ALL user-controllable state for one pivot tab.
 *
 * DESIGN RULE (UI/UX rebuild): THE TAB DETERMINES THE REPORT'S PRIMARY DIMENSION.
 *   - Presets with a default tag type (comp-pt-mom, targeting-mom, search-term-mom) are LOCKED to it.
 *     Any persisted `group-by` override from the old UI is ignored for them.
 *   - `canChooseGroupBy` is true only when the preset REQUIRES a choice (target-breakdown) or this
 *     client has no default tag type. Only then does the bar render a "Group by" pill.
 *
 * FILTERS: one persisted map `selected` { filterKey: values[] }.
 *   filterKey = "tag:<TagType id>" (values = tag ids or "~" for untagged) or a field key
 *   ("ad_format", "target_kind", ...; values = literals). Semantics unchanged: OR within a
 *   key, AND across keys. Keys not advertised by the meta endpoint are dropped, so stale
 *   localStorage can never send an invalid filter. The group-by tag type is itself a filterable
 *   dimension — that is how a user narrows e.g. Targeting Level to "Generic" (no second dropdown).
 *   Storage key `pivot-reports:filters:<preset>` is the same shape as before, so saved filters survive.
 *
 * `includeUntagged` (slot presets only) is now part of the filter popover and persisted with filters.
 *
 * Dates/compare: current range follows the page range until a custom one is chosen. Compare is forced
 * off when meta says the preset does not support comparison (Summary). Dates/compare do not persist.
 *
 * `canRun` is false until meta has loaded and (for slot presets) a tag type resolves.
 * Call ONCE per tab; presetKey must not change over the component's life.
 */

import { useMemo, useState } from 'react'
import { usePersistedState } from '@/lib/hooks/use-persisted-state'
import { useTagsForTagTypes } from '@/lib/hooks/queries/use-tags'
import {
  PIVOT_BLANK_TOKEN,
  usePivotMetaQuery,
  type PivotDateRange,
  type PivotFilter,
  type PivotPresetKey,
  type PivotQuery,
} from '@/lib/hooks/queries/use-pivot-reports'

export const TAG_KEY_PREFIX = 'tag:'

export type FilterSelection = Record<string, string[]>

/** One thing the user can filter by, built from the meta endpoint (never hardcoded). */
export interface PivotFilterDimension {
  key: string
  label: string
  kind: 'field' | 'tag'
  /** kind === 'tag' only. Values are fetched lazily by the popover. */
  tagTypeId?: string
  /** kind === 'field' only. */
  options?: { value: string; label: string }[]
}

/** One active filter, shown as a removable chip. */
export interface PivotFilterChip {
  key: string
  label: string
  summary: string
}

export function usePivotReportControls(presetKey: PivotPresetKey, pageRange: PivotDateRange) {
  const metaQuery = usePivotMetaQuery(presetKey)
  const meta = metaQuery.data
  const supportsComparison = !!meta && meta.supports_comparison

  // ---- Date ranges -------------------------------------------------------
  const [customCurrent, setCustomCurrent] = useState<PivotDateRange | null>(null)
  const current: PivotDateRange = customCurrent ?? pageRange
  const [comparisonEnabled, setComparisonEnabled] = useState(true)
  const [comparisonRange, setComparisonRange] = useState<PivotDateRange | null>(null) // null = AUTO
  const compareOn = supportsComparison && comparisonEnabled

  // ---- Group-by (locked unless the preset needs a choice) ---------------
  const slot = meta?.group_by_slot ?? null
  const [groupByOverride, setGroupByOverride] = usePersistedState<string | null>(
    `pivot-reports:group-by:${presetKey}`,
    null,
  )
  const canChooseGroupBy = !!slot && (slot.required || !slot.default_tag_type_id)
  const overrideValid = canChooseGroupBy && !!groupByOverride && !!slot?.tag_types.some((t) => t.id === groupByOverride)
  const groupBy: string | null = !slot ? null : canChooseGroupBy ? (overrideValid ? groupByOverride : null) : slot.default_tag_type_id

  // ---- Filters -------------------------------------------------------------
  const [rawSelected, setSelected] = usePersistedState<FilterSelection>(`pivot-reports:filters:${presetKey}`, {})
  const [includeUntaggedRaw, setIncludeUntagged] = usePersistedState<boolean>(`pivot-reports:untagged:${presetKey}`, false)
  const includeUntagged = !!slot && !!includeUntaggedRaw

  const dimensions = useMemo<PivotFilterDimension[]>(
    () => [
      ...(meta?.field_filters ?? []).map((f) => ({
        key: f.key,
        label: f.label,
        kind: 'field' as const,
        options: f.options,
      })),
      ...(meta?.tag_filters ?? []).map((t) => ({
        key: `${TAG_KEY_PREFIX}${t.id}`,
        label: t.name,
        kind: 'tag' as const,
        tagTypeId: t.id,
      })),
    ],
    [meta],
  )

  // Drop anything meta does not advertise (stale persisted keys, removed tag types).
  const selected = useMemo<FilterSelection>(() => {
    if (!meta) return rawSelected
    const valid = new Set(dimensions.map((d) => d.key))
    const out: FilterSelection = {}
    for (const [key, values] of Object.entries(rawSelected)) {
      if (valid.has(key) && values.length > 0) out[key] = values
    }
    return out
  }, [rawSelected, dimensions, meta])

  // Tag names are needed only to label chips for ACTIVE tag filters.
  const activeTagTypeIds = dimensions
    .filter((d) => d.kind === 'tag' && (selected[d.key]?.length ?? 0) > 0)
    .map((d) => d.tagTypeId as string)
  const tagsByTagType = useTagsForTagTypes(activeTagTypeIds)

  const chips: PivotFilterChip[] = dimensions
    .filter((d) => (selected[d.key]?.length ?? 0) > 0)
    .map((d) => {
      const labelOf = (v: string) => {
        if (v === PIVOT_BLANK_TOKEN) return '(Not Tagged)'
        if (d.kind === 'field') return d.options?.find((o) => o.value === v)?.label ?? v
        return tagsByTagType[d.tagTypeId as string]?.tags.find((t) => t.id === v)?.name ?? '…'
      }
      const names = selected[d.key].map(labelOf)
      const summary = names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`
      return { key: d.key, label: d.label, summary }
    })

  const activeFilterCount = chips.length + (includeUntagged ? 1 : 0)

  function applyFilters(next: { selected: FilterSelection; includeUntagged: boolean }) {
    const cleaned: FilterSelection = {}
    for (const [key, values] of Object.entries(next.selected)) {
      if (values.length > 0) cleaned[key] = values
    }
    setSelected(cleaned)
    setIncludeUntagged(next.includeUntagged)
  }

  function removeFilter(key: string) {
    const next = { ...rawSelected }
    delete next[key]
    setSelected(next)
  }

  function clearFilters() {
    setSelected({})
    setIncludeUntagged(false)
  }

  // ---- Build the API query ----------------------------------------------
  const filters: PivotFilter[] = Object.entries(selected)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => ({
      key: key.startsWith(TAG_KEY_PREFIX) ? key.slice(TAG_KEY_PREFIX.length) : key,
      op: 'in' as const,
      values,
    }))

  const filtersSig = JSON.stringify(filters)
  const query: PivotQuery = useMemo(
    () => ({
      current,
      comparison: { enabled: compareOn, range: comparisonRange },
      groupBy,
      filters,
      includeUntagged,
    }),
    // filtersSig stands in for `filters` (new array identity every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current.startDate, current.endDate, compareOn, comparisonRange, groupBy, filtersSig, includeUntagged],
  )

  const canRun = !metaQuery.isLoading && !!meta && (!slot || !!groupBy)

  const isDirty =
    customCurrent !== null ||
    !comparisonEnabled ||
    comparisonRange !== null ||
    (canChooseGroupBy && !slot?.required && !!groupByOverride) ||
    activeFilterCount > 0

  function resetAll() {
    setCustomCurrent(null)
    setComparisonEnabled(true)
    setComparisonRange(null)
    // A required group-by (Target Breakdown) is report context, not a setting: keep it.
    if (!slot?.required) setGroupByOverride(null)
    clearFilters()
  }

  return {
    presetKey,
    meta,
    metaLoading: metaQuery.isLoading,
    metaError: metaQuery.error,
    query,
    canRun,
    isDirty,
    // dates / comparison
    current,
    isCustomCurrent: customCurrent !== null,
    setCustomCurrent,
    resetCurrentToPage: () => setCustomCurrent(null),
    supportsComparison,
    comparisonEnabled,
    compareOn,
    setComparisonEnabled,
    comparisonRange,
    setComparisonRange,
    // group-by
    slot,
    groupBy,
    canChooseGroupBy,
    setGroupBy: setGroupByOverride,
    // filters
    dimensions,
    selected,
    chips,
    includeUntagged,
    showUntaggedToggle: !!slot,
    activeFilterCount,
    applyFilters,
    removeFilter,
    clearFilters,
    setIncludeUntagged,
    resetAll,
  }
}

export type PivotReportControls = ReturnType<typeof usePivotReportControls>
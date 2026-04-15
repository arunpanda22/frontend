"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { AdvancedDataTable, type ColumnDefinition, type TableData } from "@/components/dashboard/table/advanced-data-table"
import type { KeywordData } from "@/app/dashboard/catalogue/lib/types"

// ─── Stop-word filter list ────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  // Articles & Determiners
  "the","a","an","this","that","those","these","some","any",
  // Prepositions
  "of","to","in","at","on","with","by","for","from","about","between",
  // Pronouns
  "i","you","he","she","it","we","they","me","him","her","us","them",
  // Conjunctions
  "and","but","or","nor","so","yet","although","because","since",
  // Auxiliary verbs
  "is","am","are","was","were","be","been","have","has","had","do","does","did",
  // Modal verbs
  "can","could","shall","should","will","would","may","might","must",
  // Particles
  "up","out","off","down","away",
])

// ─── Column definitions ───────────────────────────────────────────────────────
const KEYWORD_COLUMNS: ColumnDefinition[] = [
  { field: "keyword",      headerName: "Keyword",      type: "text",    editable: false, sortable: true, filterable: true, minWidth: 180, width: 240 },
  { field: "keyword_type", headerName: "Type",         type: "text",    editable: false, sortable: true, filterable: true, width: 120,  minWidth: 100 },
  { field: "word_count",   headerName: "Word Count",   type: "number",  editable: false, sortable: true, filterable: true, width: 110,  minWidth: 90  },
  { field: "frequency",    headerName: "Frequency",    type: "number",  editable: false, sortable: true, filterable: true, width: 110,  minWidth: 90  },
  { field: "is_primary",   headerName: "Primary",      type: "boolean", editable: false, sortable: true, filterable: true, width: 100,  minWidth: 80  },
  { field: "broad_rank",   headerName: "Broad Rank",   type: "number",  editable: false, sortable: true, filterable: true, width: 110,  minWidth: 90  },
  { field: "phrase_rank",  headerName: "Phrase Rank",  type: "number",  editable: false, sortable: true, filterable: true, width: 115,  minWidth: 90  },
  { field: "exact_rank",   headerName: "Exact Rank",   type: "number",  editable: false, sortable: true, filterable: true, width: 110,  minWidth: 90  },
]

// ─── Constants ────────────────────────────────────────────────────────────────
const BUBBLES_INITIAL_COUNT = 20

// ─── Types ────────────────────────────────────────────────────────────────────
interface WordBubble {
  word: string
  count: number
}

interface KeywordFilterTableProps {
  data: KeywordData[]
  onAddKeywords: (keywords: string[]) => void
  selectedKeywords: string[]
  onToggleKeyword: (keyword: string) => void
  /** Keywords already added to the main list — pre-checks rows and counts only new ones */
  addedKeywords: string[]
  // Scribbles integration
  scribbledKeywords?: string[]
  onSyncScribbles?: (toAdd: string[], toRemove: string[]) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build word-frequency bubbles from the keyword column, excluding stop-words */
function buildWordBubbles(data: KeywordData[]): WordBubble[] {
  const freq: Record<string, number> = {}
  for (const row of data) {
    const words = (row.keyword ?? "").toLowerCase().split(/[\s\-_/]+/)
    for (const raw of words) {
      const w = raw.replace(/[^a-z0-9]/g, "")
      if (w.length < 2) continue
      if (STOP_WORDS.has(w)) continue
      freq[w] = (freq[w] ?? 0) + 1
    }
  }
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
}

// ─── Component ────────────────────────────────────────────────────────────────
export function KeywordFilterTable({
  data,
  onAddKeywords,
  selectedKeywords,
  onToggleKeyword,
  addedKeywords,
  scribbledKeywords = [],
  onSyncScribbles,
}: KeywordFilterTableProps) {
  const [localSelected, setLocalSelected] = useState<string[]>([])
  const [activeBubbles, setActiveBubbles] = useState<Set<string>>(new Set())
  const [showAllBubbles, setShowAllBubbles] = useState(false)

  // ── Word bubbles ────────────────────────────────────────────────────────────
  const wordBubbles = useMemo(() => buildWordBubbles(data), [data])
  const visibleBubbles = useMemo(
    () => showAllBubbles ? wordBubbles : wordBubbles.slice(0, BUBBLES_INITIAL_COUNT),
    [wordBubbles, showAllBubbles],
  )
  const hiddenCount = wordBubbles.length - BUBBLES_INITIAL_COUNT

  // ── Table data (stable shape) ────────────────────────────────────────────
  const tableData: TableData[] = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        word_count:  row.word_count  ?? null,
        frequency:   row.frequency   ?? null,
        broad_rank:  row.broad_rank  ?? null,
        phrase_rank: row.phrase_rank ?? null,
        exact_rank:  row.exact_rank  ?? null,
        is_primary:  row.is_primary ? "Primary" : "",
      })),
    [data],
  )

  // ── Filtered table data based on active bubbles ──────────────────────────
  const filteredTableData = useMemo(() => {
    if (activeBubbles.size === 0) return tableData
    return tableData.filter((row) => {
      const kw = String(row.keyword ?? "").toLowerCase()
      for (const bubble of activeBubbles) {
        if (kw.split(/[\s\-_/]+/).some((w) => w.replace(/[^a-z0-9]/g, "") === bubble)) {
          return true
        }
      }
      return false
    })
  }, [tableData, activeBubbles])

  // ── Handle bubble click ──────────────────────────────────────────────────
  const handleBubbleClick = useCallback((word: string) => {
    setActiveBubbles((prev) => {
      const next = new Set(prev)
      next.has(word) ? next.delete(word) : next.add(word)
      return next
    })
    // Clear local selection when bubble filter changes
    setLocalSelected([])
  }, [])

  // ── Selection change from table ──────────────────────────────────────────
  const handleSelectionChange = useCallback((selectedData: TableData[]) => {
    setLocalSelected(selectedData.map((row) => String(row.keyword)))
  }, [])

  // ── Keywords in the current selection that haven't been added yet ────────
  const newKeywords = useMemo(
    () => localSelected.filter((kw) => !addedKeywords.includes(kw)),
    [localSelected, addedKeywords],
  )

  // ── Scribbles-aware derived counts ───────────────────────────────────────
  const alreadyScribbledCount = localSelected.filter((kw) =>
    scribbledKeywords.includes(kw),
  ).length

  const willRemoveCount = useMemo(() => {
    if (!onSyncScribbles) return 0
    const visibleKeywords = filteredTableData.map((r) => String(r.keyword))
    return visibleKeywords.filter(
      (kw) => scribbledKeywords.includes(kw) && !localSelected.includes(kw),
    ).length
  }, [filteredTableData, scribbledKeywords, localSelected, onSyncScribbles])

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (onSyncScribbles) {
      const visibleKeywords = filteredTableData.map((r) => String(r.keyword))
      const toAdd = newKeywords
      const toRemove = visibleKeywords.filter(
        (kw) => scribbledKeywords.includes(kw) && !localSelected.includes(kw),
      )

      if (toAdd.length === 0 && toRemove.length === 0) return

      toAdd.forEach((kw) => {
        if (!selectedKeywords.includes(kw)) onToggleKeyword(kw)
      })
      onAddKeywords(toAdd)
      onSyncScribbles(toAdd, toRemove)
      return
    }

    // Legacy path (no scribbles) — only add truly new keywords
    if (newKeywords.length === 0) return
    newKeywords.forEach((kw) => {
      if (!selectedKeywords.includes(kw)) onToggleKeyword(kw)
    })
    onAddKeywords(newKeywords)
  }, [
    newKeywords,
    filteredTableData,
    scribbledKeywords,
    localSelected,
    selectedKeywords,
    onToggleKeyword,
    onAddKeywords,
    onSyncScribbles,
  ])

  // No-op: prevent table-level row deletion from mutating catalogue store data
  const handleDataChange = useCallback((_updated: TableData[]) => {}, [])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Word frequency bubbles ── */}
      {wordBubbles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Top Keywords — click to filter rows
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleBubbles.map(({ word, count }) => {
              const active = activeBubbles.has(word)
              return (
                <button
                  key={word}
                  onClick={() => handleBubbleClick(word)}
                  className={[
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                    "border transition-all duration-150 select-none",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500/40",
                    active
                      ? "bg-violet-700 border-violet-500 text-white shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                      : "bg-violet-900/40 border-violet-600/50 text-violet-200 hover:border-violet-400 hover:text-violet-50 hover:bg-violet-800/50",
                  ].join(" ")}
                >
                  <span>{word}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                      active ? "bg-violet-500/50 text-white" : "bg-violet-700/60 text-violet-300",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              )
            })}

            {/* ── Show more / Show less bubble ── */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAllBubbles((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                  border border-dashed border-violet-600/50 bg-transparent text-violet-400
                  hover:text-violet-200 hover:border-violet-400 transition-all duration-150 select-none
                  focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                {showAllBubbles ? (
                  <>
                    <span>↑</span>
                    <span>Show less</span>
                  </>
                ) : (
                  <>
                    <span>+{hiddenCount}</span>
                    <span>more</span>
                  </>
                )}
              </button>
            )}

            {activeBubbles.size > 0 && (
              <button
                onClick={() => {
                  setActiveBubbles(new Set())
                  setLocalSelected([])
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                  border border-violet-700/40 bg-transparent text-violet-500
                  hover:text-violet-300 hover:border-violet-500 transition-all duration-150"
              >
                <span>✕</span>
                <span>Clear filter</span>
              </button>
            )}
          </div>
          {activeBubbles.size > 0 && (
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="text-cyan-400 font-medium">{filteredTableData.length}</span>
              {" "}of{" "}
              <span className="font-medium">{data.length}</span>
              {" "}keywords matching{" "}
              {[...activeBubbles].map((w, i) => (
                <span key={w}>
                  {i > 0 && " + "}
                  <span className="text-cyan-400 font-medium">{w}</span>
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={newKeywords.length === 0 && willRemoveCount === 0}
            className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-40"
            size="sm"
          >
            {newKeywords.length > 0
              ? `Add Selected (${newKeywords.length})`
              : willRemoveCount > 0
              ? `Remove ${willRemoveCount} from scribbles`
              : "Add Selected (0)"}
          </Button>

          {/* Contextual hints */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {alreadyScribbledCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 inline-block" />
                {alreadyScribbledCount} already scribbled
              </span>
            )}
            {willRemoveCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 inline-block" />
                {willRemoveCount} will be removed
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          {activeBubbles.size > 0
            ? `${filteredTableData.length} / ${data.length} keywords`
            : `${data.length} keywords`}
        </p>
      </div>

      {/* ── Data table ── */}
      <AdvancedDataTable
        data={filteredTableData}
        columns={KEYWORD_COLUMNS}
        onDataChange={handleDataChange}
        onSelectionChange={handleSelectionChange}
        showCheckboxColumn={true}
        showDeleteOption={false}
        rowsPerPage={15}
        autoFitHeaders={false}
        showExportCard={true}
        filename="keyword-filter"
        initialSort={[{ field: "frequency", direction: "desc" }]}
        rowKey="keyword"
        initialSelectedKeys={addedKeywords}
      />
    </div>
  )
}
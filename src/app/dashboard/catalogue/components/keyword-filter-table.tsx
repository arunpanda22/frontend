"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { AdvancedDataTable, type ColumnDefinition, type TableData } from "@/components/dashboard/table/advanced-data-table"
import type { KeywordData } from "@/app/dashboard/catalogue/lib/types"

interface KeywordFilterTableProps {
  data: KeywordData[]
  onAddKeywords: (keywords: string[]) => void
  selectedKeywords: string[]
  onToggleKeyword: (keyword: string) => void
}

const KEYWORD_COLUMNS: ColumnDefinition[] = [
  { field: "keyword",      headerName: "Keyword",      type: "text",   editable: false, sortable: true, filterable: true, minWidth: 180, width: 240 },
  { field: "keyword_type", headerName: "Type",         type: "text",   editable: false, sortable: true, filterable: true, width: 120, minWidth: 100 },
  { field: "word_count",   headerName: "Word Count",   type: "number", editable: false, sortable: true, filterable: true, width: 110, minWidth: 90  },
  { field: "frequency",    headerName: "Frequency",    type: "number", editable: false, sortable: true, filterable: true, width: 110, minWidth: 90  },
  { field: "is_primary",   headerName: "Primary",      type: "boolean",editable: false, sortable: true, filterable: true, width: 100, minWidth: 80  },
  { field: "broad_rank",   headerName: "Broad Rank",   type: "number", editable: false, sortable: true, filterable: true, width: 110, minWidth: 90  },
  { field: "phrase_rank",  headerName: "Phrase Rank",  type: "number", editable: false, sortable: true, filterable: true, width: 115, minWidth: 90  },
  { field: "exact_rank",   headerName: "Exact Rank",   type: "number", editable: false, sortable: true, filterable: true, width: 110, minWidth: 90  },
]

export function KeywordFilterTable({
  data,
  onAddKeywords,
  selectedKeywords,
  onToggleKeyword,
}: KeywordFilterTableProps) {
  // Own the selected keyword strings locally — populated by AdvancedDataTable's
  // onSelectionChange callback (fired via useEffect, never during render).
  const [localSelected, setLocalSelected] = useState<string[]>([])

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

  // Fired by AdvancedDataTable after its selectedRows state settles (useEffect).
  // Safe to call setState here — we are NOT inside another component's render.
  const handleSelectionChange = useCallback((selectedData: TableData[]) => {
    setLocalSelected(selectedData.map((row) => String(row.keyword)))
  }, [])

  // "Add Selected" clicked:
  // 1. Pass keyword strings up to the catalogue page handler (shows toast, etc.)
  // 2. Also sync each keyword into the store via onToggleKeyword so
  //    addSelectedKeywordsToList() in the store has something to work with.
  const handleAddKeywords = useCallback(() => {
    if (localSelected.length === 0) return

    // Sync into store selection state
    localSelected.forEach((kw) => {
      if (!selectedKeywords.includes(kw)) {
        onToggleKeyword(kw)
      }
    })

    // Call the page-level handler (addSelectedKeywordsToList + toast)
    onAddKeywords(localSelected)
  }, [localSelected, selectedKeywords, onToggleKeyword, onAddKeywords])

  // No-op: prevent table-level row deletion from mutating catalogue store data
  const handleDataChange = useCallback((_updated: TableData[]) => {}, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          onClick={handleAddKeywords}
          disabled={localSelected.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          size="sm"
        >
          Add Selected ({localSelected.length})
        </Button>
        <p className="text-xs text-slate-400">{data.length} keywords</p>
      </div>

      <AdvancedDataTable
        data={tableData}
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
      />
    </div>
  )
}
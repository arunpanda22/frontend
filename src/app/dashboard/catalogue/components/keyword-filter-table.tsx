"use client"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Button } from "@/components/ui/button"
import type { KeywordData } from "@/app/dashboard/catalogue/lib/types"

interface KeywordFilterTableProps {
  data: KeywordData[]
  onAddKeywords: (keywords: string[]) => void
  selectedKeywords: string[]
  onToggleKeyword: (keyword: string) => void
}

const safeNum = (val: any): string => {
  if (val === null || val === undefined) return "—"
  const n = Number(val)
  return isNaN(n) ? "—" : n.toLocaleString()
}

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return "—"
  return String(val)
}

export function KeywordFilterTable({
  data,
  onAddKeywords,
  selectedKeywords,
  onToggleKeyword,
}: KeywordFilterTableProps) {
  const allSelected =
    data.length > 0 && data.every((row) => selectedKeywords.includes(row.keyword))

  const toggleAll = (checked: boolean) => {
    if (checked) {
      data.forEach((row) => {
        if (!selectedKeywords.includes(row.keyword)) onToggleKeyword(row.keyword)
      })
    } else {
      selectedKeywords.forEach((kw) => {
        if (data.some((row) => row.keyword === kw)) onToggleKeyword(kw)
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => onAddKeywords(selectedKeywords)}
          disabled={selectedKeywords.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          size="sm"
        >
          Add Selected ({selectedKeywords.length})
        </Button>
        <p className="text-xs text-slate-400">{data.length} keywords</p>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Word Count</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead>Broad Rank</TableHead>
                <TableHead>Phrase Rank</TableHead>
                <TableHead>Exact Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    No keywords loaded. Click "Keyword Filter" to fetch recommendations.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index} className="text-black">
                    <TableCell>
                      <Checkbox
                        checked={selectedKeywords.includes(row.keyword)}
                        onCheckedChange={() => onToggleKeyword(row.keyword)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{safeStr(row.keyword)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        row.keyword_type === "long_tail"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {safeStr(row.keyword_type)}
                      </span>
                    </TableCell>
                    <TableCell>{safeNum(row.word_count)}</TableCell>
                    <TableCell>{safeNum(row.frequency)}</TableCell>
                    <TableCell>
                      {row.is_primary ? (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-cyan-50 text-cyan-600">
                          Primary
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>{safeNum(row.broad_rank)}</TableCell>
                    <TableCell>{safeNum(row.phrase_rank)}</TableCell>
                    <TableCell>{safeNum(row.exact_rank)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
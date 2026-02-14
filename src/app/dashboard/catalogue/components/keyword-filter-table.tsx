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

interface KeywordData {
  keywordPhrase: string
  searchVolume: number
  kwType: string
  position: number
  competitorCount: number
  relevance: string
  wordCount: number
  sponsoredRank: number
  manualScore: number
}

interface KeywordFilterTableProps {
  data: KeywordData[]
  onAddKeywords: (keywords: string[]) => void
  selectedKeywords: string[]
  onToggleKeyword: (keyword: string) => void
}

const safeNum = (val: any): string => {
  if (val === null || val === undefined || val === '') return '—'
  const n = Number(val)
  return isNaN(n) ? '—' : n.toLocaleString()
}

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return '—'
  return String(val)
}

export function KeywordFilterTable({ 
  data, 
  onAddKeywords, 
  selectedKeywords,
  onToggleKeyword 
}: KeywordFilterTableProps) {
  const handleAddSelected = () => {
    onAddKeywords(selectedKeywords)
  }

  const toggleAll = (checked: boolean) => {
    if (checked) {
      data.forEach(row => {
        if (!selectedKeywords.includes(row.keywordPhrase)) {
          onToggleKeyword(row.keywordPhrase)
        }
      })
    } else {
      selectedKeywords.forEach(keyword => {
        if (data.some(row => row.keywordPhrase === keyword)) {
          onToggleKeyword(keyword)
        }
      })
    }
  }

  const allSelected = data.length > 0 && data.every(row => selectedKeywords.includes(row.keywordPhrase))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={handleAddSelected}
          disabled={selectedKeywords.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          size="sm"
        >
          Add Selected ({selectedKeywords.length})
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Keyword Phrase</TableHead>
                <TableHead>Search Volume</TableHead>
                <TableHead>kw_type</TableHead>
                <TableHead>Position (Rank)</TableHead>
                <TableHead>Competitor Count</TableHead>
                <TableHead>Relevance</TableHead>
                <TableHead>Word Count</TableHead>
                <TableHead>Sponsored Rank (avg)</TableHead>
                <TableHead>manual_score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-black">
                    No data available. Click "Keyword Filter" to load data.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index} className="text-black">
                    <TableCell>
                      <Checkbox
                        checked={selectedKeywords.includes(row.keywordPhrase)}
                        onCheckedChange={() => onToggleKeyword(row.keywordPhrase)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-black">{safeStr(row.keywordPhrase)}</TableCell>
                    <TableCell>{safeNum(row.searchVolume)}</TableCell>
                    <TableCell>{safeStr(row.kwType)}</TableCell>
                    <TableCell>{safeNum(row.position)}</TableCell>
                    <TableCell>{safeNum(row.competitorCount)}</TableCell>
                    <TableCell>{safeStr(row.relevance)}</TableCell>
                    <TableCell>{safeNum(row.wordCount)}</TableCell>
                    <TableCell>{safeNum(row.sponsoredRank)}</TableCell>
                    <TableCell>{safeNum(row.manualScore)}</TableCell>
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
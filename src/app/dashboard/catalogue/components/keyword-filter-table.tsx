"use client"

import { useState } from "react"
import { Checkbox } from "./ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Button } from "./ui/button"

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
}

export function KeywordFilterTable({ data, onAddKeywords }: KeywordFilterTableProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords)
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword)
    } else {
      newSelected.add(keyword)
    }
    setSelectedKeywords(newSelected)
  }

  const handleAddSelected = () => {
    onAddKeywords(Array.from(selectedKeywords))
    setSelectedKeywords(new Set())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={handleAddSelected}
          disabled={selectedKeywords.size === 0}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          size="sm"
        >
          Add Selected ({selectedKeywords.size})
        </Button>
      </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedKeywords.size === data.length && data.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKeywords(new Set(data.map((row) => row.keywordPhrase)))
                        } else {
                          setSelectedKeywords(new Set())
                        }
                      }}
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
                    <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                      No data available. Click "Keyword Filter" to load data.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedKeywords.has(row.keywordPhrase)}
                          onCheckedChange={() => toggleKeyword(row.keywordPhrase)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.keywordPhrase}</TableCell>
                      <TableCell>{row.searchVolume.toLocaleString()}</TableCell>
                      <TableCell>{row.kwType}</TableCell>
                      <TableCell>{row.position}</TableCell>
                      <TableCell>{row.competitorCount}</TableCell>
                      <TableCell>{row.relevance}</TableCell>
                      <TableCell>{row.wordCount}</TableCell>
                      <TableCell>{row.sponsoredRank}</TableCell>
                      <TableCell>{row.manualScore}</TableCell>
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
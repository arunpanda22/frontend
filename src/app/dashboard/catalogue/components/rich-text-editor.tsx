"use client"

import type React from "react"

import { useRef, useMemo } from "react"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  usedKeywords: string[]
  usedWords: string[]
  keywordUsage: Map<string, number>
  wordUsage: Map<string, number>
  maxLength: number
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  usedKeywords,
  usedWords,
  keywordUsage,
  wordUsage,
  maxLength,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const highlightRanges = useMemo(() => {
    if (!value) return []

    const ranges: { start: number; end: number; type: "phrase" | "word" }[] = []

    // First, highlight phrases (longer matches first to avoid partial replacements)
    const sortedKeywords = [...usedKeywords].sort((a, b) => b.length - a.length)

    sortedKeywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      const matches = Array.from(value.matchAll(regex))
      matches.forEach((m) => {
        ranges.push({
          start: m.index!,
          end: m.index! + keyword.length,
          type: "phrase",
        })
      })
    })

    // Then highlight individual words (only if not already highlighted as phrase)
    usedWords.forEach((word) => {
      const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi")
      const matches = Array.from(value.matchAll(regex))
      matches.forEach((m) => {
        const isPartOfPhrase = ranges.some(
          (r) => r.type === "phrase" && m.index! >= r.start && m.index! + word.length <= r.end,
        )
        if (!isPartOfPhrase) {
          ranges.push({
            start: m.index!,
            end: m.index! + word.length,
            type: "word",
          })
        }
      })
    })

    return ranges
  }, [value, usedKeywords, usedWords])

  const wordCount = value.split(/\s+/).filter((w) => w).length
  const charCount = value.length

  const transformText = (transform: "uppercase" | "lowercase" | "camelcase") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const hasSelection = start !== end

    let transformed = value
    const selectedText = value.substring(start, end)

    if (!hasSelection) {
      // Apply to entire text if no selection
      if (transform === "uppercase") {
        transformed = value.toUpperCase()
      } else if (transform === "lowercase") {
        transformed = value.toLowerCase()
      } else if (transform === "camelcase") {
        transformed = value
          .toLowerCase()
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (match) => match.toUpperCase())
          .replace(/\s+/g, "")
      }
    } else {
      // Apply only to selection
      let transformedSelection = selectedText
      if (transform === "uppercase") {
        transformedSelection = selectedText.toUpperCase()
      } else if (transform === "lowercase") {
        transformedSelection = selectedText.toLowerCase()
      } else if (transform === "camelcase") {
        transformedSelection = selectedText
          .toLowerCase()
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (match) => match.toUpperCase())
          .replace(/\s+/g, "")
      }
      transformed = value.substring(0, start) + transformedSelection + value.substring(end)
    }

    onChange(transformed.substring(0, maxLength))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transformText("uppercase")}
            title="Convert to uppercase"
            className="h-8 px-2 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-medium"
          >
            AA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transformText("lowercase")}
            title="Convert to lowercase"
            className="h-8 px-2 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-medium"
          >
            aa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transformText("camelcase")}
            title="Convert to camelCase"
            className="h-8 px-2 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-medium"
          >
            aA
          </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.substring(0, maxLength))}
          placeholder={placeholder}
          className="min-h-32 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none relative z-10"
          style={{ backgroundColor: 'white' }} // Ensure solid white background
        />

        <div
          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden rounded-md"
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "1.5",
            padding: "8px 12px",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            zIndex: 0,
            color: "transparent", 
          }}
        >
          {renderHighlightedText(value, highlightRanges)}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <div className="flex gap-4">
          <span>
            {charCount} / {maxLength} characters
          </span>
          <span>{wordCount} words</span>
        </div>
        <span className="text-cyan-600 font-medium">{highlightRanges.length} keywords matched</span>
      </div>
    </div>
  )
}

function renderHighlightedText(text: string, ranges: { start: number; end: number; type: "phrase" | "word" }[]) {
  if (!text) return null

  // Sort ranges by start position
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start)

  const elements: React.ReactNode[] = []
  let lastIndex = 0

  sortedRanges.forEach((range) => {
    // Add text before this range
    if (range.start > lastIndex) {
      elements.push(text.substring(lastIndex, range.start))
    }

    // Add highlighted text
    const highlightedText = text.substring(range.start, range.end)
    elements.push(
      <span
        key={`${range.start}-${range.end}`}
        className={
          range.type === "phrase"
            ? "underline decoration-cyan-500 decoration-2"
            : "underline decoration-amber-500 decoration-2"
        }
      >
        {highlightedText}
      </span>,
    )

    lastIndex = range.end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex))
  }

  return elements
}

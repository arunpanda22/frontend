"use client"

import React, { useRef, useMemo, useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  usedKeywords: string[]
  usedWords: string[]
  keywordUsage: Map<string, number>
  wordUsage: Map<string, number>
  maxLength: number
  minHeight?: number
  maxHeight?: number
}

interface HighlightRange {
  start: number
  end: number
  type: "phrase" | "word"
  text: string
  usageCount: number
}

interface BoldRange {
  start: number
  end: number
  text: string
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
  minHeight = 100,
  maxHeight = 400,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})

  // Copy exact computed styles from textarea to highlight overlay
  useEffect(() => {
    if (textareaRef.current) {
      const computed = window.getComputedStyle(textareaRef.current)
      setHighlightStyle({
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        wordSpacing: computed.wordSpacing,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingLeft: computed.paddingLeft,
        border: `${computed.borderWidth} solid transparent`,
        boxSizing: 'border-box',
      })
    }
  }, [])

  // Auto-resize textarea and highlight overlay based on content
  useEffect(() => {
    const textarea = textareaRef.current
    const highlight = highlightRef.current
    
    if (textarea && highlight) {
      // Reset height to recalculate
      textarea.style.height = 'auto'
      
      // Calculate new height based on content
      const scrollHeight = textarea.scrollHeight
      const newHeight = Math.max(
        minHeight,
        Math.min(scrollHeight, maxHeight)
      )
      
      // Apply new height to both textarea and highlight overlay
      textarea.style.height = `${newHeight}px`
      highlight.style.height = `${newHeight}px`
      
      // Enable scrolling only if content exceeds maxHeight
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto'
        highlight.style.overflowY = 'auto'
      } else {
        textarea.style.overflowY = 'hidden'
        highlight.style.overflowY = 'hidden'
      }
    }
  }, [value, minHeight, maxHeight])

  // Sync scroll between textarea and highlight overlay
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Find bold ranges (text between **)
  const boldRanges = useMemo(() => {
    if (!value) return []

    const ranges: BoldRange[] = []
    const regex = /\*\*(.+?)\*\*/g
    let match

    while ((match = regex.exec(value)) !== null) {
      if (match.index !== undefined && match[1]) {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[1], // Text without the **
        })
      }
    }

    return ranges
  }, [value])

  const highlightRanges = useMemo(() => {
    if (!value) return []

    const ranges: { start: number; end: number; type: "phrase" | "word" }[] = []

    // First, highlight phrases (longer matches first to avoid partial replacements)
    const sortedKeywords = [...usedKeywords].sort((a, b) => b.length - a.length)

    sortedKeywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      const matches = Array.from(value.matchAll(regex))
      matches.forEach((m) => {
        if (m.index !== undefined && m[0]) {
          ranges.push({
            start: m.index,
            end: m.index + m[0].length,
            type: "phrase",
          })
        }
      })
    })

    // Then highlight individual words (only if not already highlighted as phrase)
    usedWords.forEach((word) => {
      const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi")
      const matches = Array.from(value.matchAll(regex))
      matches.forEach((m) => {
        if (m.index !== undefined && m[0]) {
          const isPartOfPhrase = ranges.some(
            (r) => r.type === "phrase" && m.index! >= r.start && m.index! + m[0].length <= r.end,
          )
          if (!isPartOfPhrase) {
            ranges.push({
              start: m.index,
              end: m.index + m[0].length,
              type: "word",
            })
          }
        }
      })
    })

    // Merge overlapping ranges to prevent broken highlights
    const merged: typeof ranges = []
    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    
    sorted.forEach(range => {
      const overlapping = merged.find(m => 
        (range.start >= m.start && range.start < m.end) ||
        (range.end > m.start && range.end <= m.end) ||
        (range.start <= m.start && range.end >= m.end)
      )
      
      if (overlapping) {
        // Extend existing range
        overlapping.start = Math.min(overlapping.start, range.start)
        overlapping.end = Math.max(overlapping.end, range.end)
        // Phrases take priority over words
        if (range.type === "phrase") overlapping.type = "phrase"
      } else {
        merged.push({ ...range })
      }
    })

    // Extract text and usageCount after merging
    const highlightRanges: HighlightRange[] = merged.map(range => {
      const text = value.substring(range.start, range.end)
      const usageCount = range.type === "phrase" 
        ? (keywordUsage.get(text.toLowerCase()) || 0)
        : (wordUsage.get(text.toLowerCase()) || 0)
      
      return {
        ...range,
        text,
        usageCount
      }
    })

    return highlightRanges
  }, [value, usedKeywords, usedWords, keywordUsage, wordUsage])

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
    <div className="space-y-1">
      {/* Editor Container with internal toolbar */}
      <div className="relative w-full border border-slate-200 rounded-md bg-white">
        {/* Highlight overlay - Shows styled text */}
        <div
          ref={highlightRef}
          className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden"
          style={{
            ...highlightStyle,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            paddingBottom: "38px",
            zIndex: 2, // Above textarea
            overflowX: "hidden",
          }}
        >
          {renderStyledText(value, highlightRanges, boldRanges)}
        </div>
        
        {/* Textarea - Shows text transparently where styled */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.substring(0, maxLength))}
          onScroll={handleScroll}
          placeholder={placeholder}
          className="border-0 placeholder:text-slate-400 focus:ring-0 focus:outline-none resize-none relative z-1 text-sm px-3 py-2"
          style={{
            caretColor: "#1e293b",
            paddingBottom: "38px",
            minHeight: `${minHeight}px`,
            color: "transparent",
            backgroundColor: "transparent",
            WebkitTextFillColor: "transparent", // For Safari
          }}
        />

        {/* Internal Toolbar - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-white border-t border-slate-200 z-20 pointer-events-auto rounded-b-md">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => transformText("uppercase")}
              title="Convert to uppercase"
              className="h-6 w-6 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold"
            >
              AB
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => transformText("lowercase")}
              title="Convert to lowercase"
              className="h-6 w-6 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold"
            >
              ab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => transformText("camelcase")}
              title="Convert to camelCase"
              className="h-6 w-6 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold"
            >
              Ab
            </Button>
          </div>

          {/* Stats on the right */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{charCount}/{maxLength} bytes</span>
            <span>{charCount} characters</span>
            <span>{wordCount} words</span>
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-500">
          {highlightRanges.length > 0 && (
            <span className="text-slate-600 font-medium">
              {highlightRanges.length} keyword{highlightRanges.length !== 1 ? 's' : ''} matched
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderStyledText(text: string, highlightRanges: HighlightRange[], boldRanges: BoldRange[]) {
  if (!text) return null

  // Build an array to track formatting at each character position
  const chars = text.split('')
  const formatting: Array<{
    isBold: boolean
    highlight?: HighlightRange
    isAsterisk: boolean
  }> = chars.map(() => ({ isBold: false, isAsterisk: false }))

  // Mark bold ranges and asterisks
  boldRanges.forEach(bold => {
    // Mark the opening **
    formatting[bold.start].isAsterisk = true
    formatting[bold.start + 1].isAsterisk = true
    
    // Mark the content as bold (skip the **)
    for (let i = bold.start + 2; i < bold.end - 2; i++) {
      formatting[i].isBold = true
    }
    
    // Mark the closing **
    formatting[bold.end - 2].isAsterisk = true
    formatting[bold.end - 1].isAsterisk = true
  })

  // Mark highlights
  highlightRanges.forEach(highlight => {
    for (let i = highlight.start; i < highlight.end; i++) {
      if (!formatting[i].isAsterisk) {
        formatting[i].highlight = highlight
      }
    }
  })

  // Build the JSX elements
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < chars.length) {
    const fmt = formatting[i]

    if (fmt.isAsterisk) {
      // Render asterisk as invisible but preserve space
      elements.push(
        <span key={`asterisk-${i}`} style={{ opacity: 0 }}>
          {chars[i]}
        </span>
      )
      i++
    } else if (fmt.isBold) {
      // Collect consecutive bold characters
      let boldText = ''
      let boldHighlight: HighlightRange | undefined
      const startIdx = i
      
      while (i < chars.length && formatting[i].isBold) {
        boldText += chars[i]
        if (formatting[i].highlight) {
          boldHighlight = formatting[i].highlight
        }
        i++
      }

      elements.push(
        <strong
          key={`bold-${startIdx}`}
          style={{
            fontWeight: 700,
            color: "#1e293b",
            backgroundColor: boldHighlight
              ? boldHighlight.type === "phrase"
                ? "rgba(6, 182, 212, 0.25)"
                : "rgba(245, 158, 11, 0.25)"
              : "transparent",
            borderRadius: boldHighlight ? "2px" : "0",
            position: "relative",
          }}
        >
          {boldText}
          {boldHighlight && boldHighlight.usageCount > 0 && (
            <sup
              style={{
                position: "absolute",
                fontSize: "9px",
                fontWeight: "600",
                top: "-2px",
                marginLeft: "1px",
                color: boldHighlight.type === "phrase" ? "#2563eb" : "#ca8a04",
              }}
            >
              {boldHighlight.usageCount}
            </sup>
          )}
        </strong>
      )
    } else if (fmt.highlight) {
      // Collect consecutive highlighted characters
      let highlightText = ''
      const highlight = fmt.highlight
      const startIdx = i
      
      while (i < chars.length && formatting[i].highlight === highlight && !formatting[i].isBold && !formatting[i].isAsterisk) {
        highlightText += chars[i]
        i++
      }

      elements.push(
        <mark
          key={`highlight-${startIdx}`}
          style={{
            backgroundColor: highlight.type === "phrase"
              ? "rgba(6, 182, 212, 0.25)"
              : "rgba(245, 158, 11, 0.25)",
            color: "#1e293b",
            borderRadius: "2px",
            padding: 0,
            position: "relative",
          }}
        >
          {highlightText}
          {highlight.usageCount > 0 && (
            <sup
              style={{
                position: "absolute",
                fontSize: "9px",
                fontWeight: "600",
                top: "-2px",
                marginLeft: "1px",
                color: highlight.type === "phrase" ? "#2563eb" : "#ca8a04",
              }}
            >
              {highlight.usageCount}
            </sup>
          )}
        </mark>
      )
    } else {
      // Regular text
      let regularText = ''
      const startIdx = i
      
      while (i < chars.length && !formatting[i].isBold && !formatting[i].highlight && !formatting[i].isAsterisk) {
        regularText += chars[i]
        i++
      }

      elements.push(
        <span key={`text-${startIdx}`} style={{ color: "#1e293b" }}>
          {regularText}
        </span>
      )
    }
  }

  return <>{elements}</>
}
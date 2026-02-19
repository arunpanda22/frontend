"use client"

import React, { useRef, useMemo, useEffect } from "react"
import { Copy } from "lucide-react"

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

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  usedKeywords,
  usedWords,
  keywordUsage,
  wordUsage,
  maxLength,
  minHeight = 80,
  maxHeight = 400,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const highlightRanges = useMemo(() => {
    if (!value) return []

    const ranges: HighlightRange[] = []
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
            text: m[0],
            usageCount: keywordUsage.get(m[0].toLowerCase()) || 0,
          })
        }
      })
    })

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
              text: m[0],
              usageCount: wordUsage.get(m[0].toLowerCase()) || 0,
            })
          }
        }
      })
    })

    return ranges.sort((a, b) => a.start - b.start)
  }, [value, usedKeywords, usedWords, keywordUsage, wordUsage])

  const wordCount = value.split(/\s+/).filter((w) => w).length
  const charCount = value.length
  const byteCount = new TextEncoder().encode(value).length
  
  const isOverLimit = byteCount > maxLength

  // Sync scroll on mount
  useEffect(() => {
    if (textareaRef.current && highlightRef.current) {
      handleScroll()
    }
  }, [])

  const handleScroll = () => {
    // Sync highlight overlay scroll position with textarea scroll
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const transformText = (transform: "uppercase" | "lowercase" | "camelcase") => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const hasSelection = start !== end

    let transformed = value

    if (!hasSelection) {
      if (transform === "uppercase") {
        transformed = value.toUpperCase()
      } else if (transform === "lowercase") {
        transformed = value.toLowerCase()
      } else if (transform === "camelcase") {
        transformed = value
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }
    } else {
      const selectedText = value.substring(start, end)
      let transformedSelection = selectedText

      if (transform === "uppercase") {
        transformedSelection = selectedText.toUpperCase()
      } else if (transform === "lowercase") {
        transformedSelection = selectedText.toLowerCase()
      } else if (transform === "camelcase") {
        transformedSelection = selectedText
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }

      transformed = value.substring(0, start) + transformedSelection + value.substring(end)
    }

    onChange(transformed)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
  }

  // Shared text style constants - exact same for both layers
  const textStyle: React.CSSProperties = {
    fontFamily: 'var(--font-montserrat), ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: 'normal',
    wordSpacing: 'normal',
  }

  const sharedPadding = '10px'

  return (
    // data-highlight-scope marks this as the boundary for highlight rendering.
    // Any ancestor with data-no-highlight="true" will suppress highlighting
    // via the renderHighlights guard, preventing leakage into drawers/portals.
    <div data-highlight-scope="true">
      {/* Toolbar row - above textarea */}
      <div className="flex items-center justify-between border border-b-0 border-slate-200 rounded-t-md bg-slate-50 px-2 py-1">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => transformText("uppercase")}
            title="UPPERCASE"
            className="px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors"
          >
            AB
          </button>
          <button
            onClick={() => transformText("lowercase")}
            title="lowercase"
            className="px-1.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors"
          >
            ab
          </button>
          <button
            onClick={() => transformText("camelcase")}
            title="Title Case"
            className="px-1.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors"
          >
            Ab
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className={byteCount > maxLength ? "text-red-600 font-semibold" : ""}>
            {byteCount}/{maxLength} bytes
          </span>
          <span className={charCount > maxLength ? "text-red-600 font-semibold" : ""}>
            {charCount} chars
          </span>
          <span>{wordCount} words</span>
        </div>
      </div>

      {/* Editor area — height is driven by the overlay div in normal flow.
          The textarea is absolute on top, stretching to match. This ensures
          the wrapper always has the right height and selection never misaligns. */}
      <div
        className="relative w-full border border-slate-200 rounded-b-md bg-white focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300/50"
        style={{ isolation: "isolate" }}
      >
        {/* Overlay — IN normal flow, drives the wrapper height.
            pointer-events:none so the textarea above receives all input.
            data-no-highlight guards against external DOM walkers. */}
        <div
          data-no-highlight="true"
          aria-hidden="true"
          className="pointer-events-none"
          style={{
            ...textStyle,
            padding: sharedPadding,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            color: "#0f172a",
            boxSizing: "border-box",
            overflowY: "hidden",
            margin: 0,
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            // Visibility hidden — it takes up space and drives height,
            // but we paint over it with the textarea layer above
            visibility: "hidden",
          }}
        >
          {/* Extra trailing space ensures the last line always has height */}
          {value + " "}
        </div>

        {/* Highlight overlay — absolute, sits between the invisible spacer div
            and the textarea. Renders colored spans + border-bottom highlights. */}
        <div
          ref={highlightRef}
          data-no-highlight="true"
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            ...textStyle,
            padding: sharedPadding,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            color: "#0f172a",
            zIndex: 1,
            boxSizing: "border-box",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {renderHighlights(value, highlightRanges)}
        </div>

        {/* Textarea — absolute, fills the wrapper exactly.
            Transparent text so the highlight overlay shows through.
            caretColor keeps the cursor visible. */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full bg-transparent placeholder:text-slate-400 resize-none outline-none"
          style={{
            ...textStyle,
            padding: sharedPadding,
            boxSizing: "border-box",
            overflowY: "auto",
            color: "transparent",
            caretColor: "#0f172a",
            zIndex: 2,
            margin: 0,
          }}
        />
      </div>
    </div>
  )
}

function renderHighlights(text: string, ranges: HighlightRange[]) {
  if (!text) return null

  const elements: React.ReactNode[] = []
  let pos = 0
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start)

  while (pos < text.length) {
    const nextHL = sortedRanges.find((r) => r.start >= pos)

    if (!nextHL) {
      // Non-highlighted text — renders in normal text color
      elements.push(
        <span key={`text-${pos}`} style={{ color: "#0f172a" }}>
          {text.substring(pos)}
        </span>
      )
      break
    }

    if (nextHL.start > pos) {
      // Gap between highlights — normal text color
      elements.push(
        <span key={`text-${pos}`} style={{ color: "#0f172a" }}>
          {text.substring(pos, nextHL.start)}
        </span>
      )
    }

    const isPhrase = nextHL.type === "phrase"
    const color = isPhrase ? "#0ea5e9" : "#f59e0b"

    // Highlighted span: text takes the highlight color, border-bottom is the
    // underline. This mirrors mwl-text-input-highlight exactly —
    // color + border-bottom in the same color, no text-decoration involved.
    elements.push(
      <span
        key={`hl-${nextHL.start}`}
        style={{
          color: color,
          borderBottom: `0.8px solid ${color}`,
          boxSizing: "border-box",
        }}
      >
        {text.substring(nextHL.start, nextHL.end)}
      </span>
    )

    if (nextHL.usageCount > 0) {
      elements.push(
        <sup
          key={`sup-${nextHL.start}`}
          style={{
            fontSize: "7px",
            fontWeight: "700",
            color: color,
            marginLeft: "1px",
            lineHeight: "0",
            verticalAlign: "super",
          }}
        >
          {nextHL.usageCount}
        </sup>
      )
    }

    pos = nextHL.end
  }

  return <>{elements}</>
}
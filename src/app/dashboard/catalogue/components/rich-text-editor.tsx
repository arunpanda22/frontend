"use client"

import React, { useRef, useMemo, useEffect, useId, useState } from "react"
import { Copy, Check } from "lucide-react"

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

interface TextToken {
  start: number
  end: number
  bold: boolean
  marker: boolean
}

// ─── Token Parser ─────────────────────────────────────────────────────────────

function parseTokens(text: string): TextToken[] {
  const tokens: TextToken[] = []
  const re = /\*\*/g
  let match: RegExpExecArray | null
  let pos = 0
  let bold = false

  while ((match = re.exec(text)) !== null) {
    if (match.index > pos) {
      tokens.push({ start: pos, end: match.index, bold, marker: false })
    }
    tokens.push({ start: match.index, end: match.index + 2, bold: false, marker: true })
    bold = !bold
    pos = match.index + 2
  }

  if (pos < text.length) {
    tokens.push({ start: pos, end: text.length, bold, marker: false })
  }

  return tokens
}

// ─── Content Renderer ─────────────────────────────────────────────────────────
// Renders the contentEditable innerHTML with proper keyword highlighting and bold

function renderContent(text: string, ranges: HighlightRange[]): string {
  if (!text) return ""

  const tokens = parseTokens(text)
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start)
  let html = ""

  tokens.forEach((token) => {
    if (token.marker) {
      // ** markers are visibility:hidden — occupy space but invisible
      html += `<span style="visibility:hidden">**</span>`
      return
    }

    let localPos = token.start

    while (localPos < token.end) {
      const hl = sortedRanges.find((r) => r.end > localPos && r.start < token.end)

      if (!hl) {
        // Plain text
        const content = text.substring(localPos, token.end)
        const escaped = escapeHtml(content)
        html += token.bold ? `<strong>${escaped}</strong>` : escaped
        localPos = token.end
        break
      }

      // Plain text before highlight
      if (hl.start > localPos) {
        const end = Math.min(hl.start, token.end)
        const content = text.substring(localPos, end)
        const escaped = escapeHtml(content)
        html += token.bold ? `<strong>${escaped}</strong>` : escaped
        localPos = hl.start
        if (localPos >= token.end) break
      }

      // Highlighted portion
      const hlStart = Math.max(hl.start, localPos)
      const hlEnd = Math.min(hl.end, token.end)
      const color = hl.type === "phrase" ? "#0ea5e9" : "#f59e0b"
      const content = text.substring(hlStart, hlEnd)
      const escaped = escapeHtml(content)
      
      const style = `color:${color};border-bottom:0.8px solid ${color};`
      const innerHtml = token.bold ? `<strong>${escaped}</strong>` : escaped
      html += `<span style="${style}">${innerHtml}</span>`

      // Usage count superscript - wrapped in non-editable span for isolation
      if (hlEnd === hl.end && hl.usageCount > 0) {
        html += `<span contenteditable="false" data-usage-count="true" style="user-select:none;pointer-events:none;"><sup style="font-size:7px;font-weight:700;color:${color};margin-left:1px;">${hl.usageCount}</sup></span>`
      }

      localPos = hlEnd
    }
  })

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>")
}

// ─── Text Extraction ──────────────────────────────────────────────────────────
// Extract plain text from contentEditable div, preserving newlines
// Skip non-editable elements like usage count superscripts

function extractText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ""
  }
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    
    // Skip usage count superscripts entirely
    if (el.hasAttribute("data-usage-count")) {
      return ""
    }
    
    // <br> becomes newline
    if (el.tagName === "BR") {
      return "\n"
    }
    
    // Block elements get trailing newline
    if (el.tagName === "DIV" || el.tagName === "P") {
      let text = ""
      el.childNodes.forEach((child) => {
        text += extractText(child)
      })
      return text + (el.nextSibling ? "\n" : "")
    }
    
    // Inline elements — just extract children
    let text = ""
    el.childNodes.forEach((child) => {
      text += extractText(child)
    })
    return text
  }
  
  return ""
}

// ─── Cursor Position Utilities ────────────────────────────────────────────────

function saveCursorPosition(element: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  
  const range = sel.getRangeAt(0)
  
  // Calculate character offset by walking text nodes only
  let charCount = 0
  let startOffset = 0
  let endOffset = 0
  let foundStart = false
  let foundEnd = false
  
  function traverse(node: Node): boolean {
    if (foundEnd) return true
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text
      
      if (!foundStart) {
        if (node === range.startContainer) {
          startOffset = charCount + range.startOffset
          foundStart = true
        } else {
          charCount += text.length
        }
      }
      
      if (foundStart && !foundEnd) {
        if (node === range.endContainer) {
          endOffset = charCount + range.endOffset
          foundEnd = true
          return true
        } else {
          charCount += text.length
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Traverse children
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) return true
      }
    }
    
    return false
  }
  
  traverse(element)
  
  if (!foundStart) return null
  if (!foundEnd) endOffset = startOffset
  
  return { start: startOffset, end: endOffset }
}

function restoreCursorPosition(element: HTMLElement, position: { start: number; end: number }) {
  const sel = window.getSelection()
  if (!sel) return
  
  const range = document.createRange()
  let charCount = 0
  let foundStart = false
  let foundEnd = false
  
  function traverse(node: Node): boolean {
    if (foundEnd) return true
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text
      const nextCount = charCount + text.length
      
      if (!foundStart && nextCount >= position.start) {
        const offset = position.start - charCount
        range.setStart(text, Math.min(offset, text.length))
        foundStart = true
      }
      
      if (foundStart && nextCount >= position.end) {
        const offset = position.end - charCount
        range.setEnd(text, Math.min(offset, text.length))
        foundEnd = true
        return true
      }
      
      charCount = nextCount
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) return true
      }
    }
    
    return false
  }
  
  traverse(element)
  
  // If we didn't find the exact position, set cursor at the end
  if (!foundEnd && foundStart) {
    range.collapse(false)
  }
  
  try {
    sel.removeAllRanges()
    sel.addRange(range)
  } catch (e) {
    // Silently fail if range is invalid
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const editorRef = useRef<HTMLDivElement>(null)
  const instanceId = useId().replace(/:/g, "")
  const [copied, setCopied] = useState(false)
  const lastValueRef = useRef(value)
  const lastHighlightRangesRef = useRef<HighlightRange[]>([])
  const isComposingRef = useRef(false)
  const isUpdatingFromInputRef = useRef(false)

  const highlightRanges = useMemo(() => {
    if (!value) return []
    const ranges: HighlightRange[] = []

    const sortedKeywords = [...usedKeywords].sort((a, b) => b.length - a.length)
    sortedKeywords.forEach((keyword) => {
      const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      Array.from(value.matchAll(re)).forEach((m) => {
        if (m.index !== undefined && m[0]) {
          ranges.push({
            start: m.index,
            end: m.index + m[0].length,
            type: "phrase",
            text: m[0],
            usageCount: keywordUsage.get(m[0].toLowerCase()) ?? 0,
          })
        }
      })
    })

    usedWords.forEach((word) => {
      const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi")
      Array.from(value.matchAll(re)).forEach((m) => {
        if (m.index !== undefined && m[0]) {
          const covered = ranges.some(
            (r) => r.type === "phrase" && m.index! >= r.start && m.index! + m[0].length <= r.end
          )
          if (!covered) {
            ranges.push({
              start: m.index,
              end: m.index + m[0].length,
              type: "word",
              text: m[0],
              usageCount: wordUsage.get(m[0].toLowerCase()) ?? 0,
            })
          }
        }
      })
    })

    return ranges.sort((a, b) => a.start - b.start)
  }, [value, usedKeywords, usedWords, keywordUsage, wordUsage])

  const wordCount = value.split(/\s+/).filter(Boolean).length
  const charCount = value.length
  const byteCount = new TextEncoder().encode(value).length
  const isOverLimit = byteCount > maxLength

  // Set initial content on mount
  useEffect(() => {
    if (!editorRef.current) return
    const html = renderContent(value, highlightRanges)
    editorRef.current.innerHTML = html || ""
    lastValueRef.current = value
  }, []) // Empty deps — runs once on mount

  // Update editor HTML when value or highlights change
  useEffect(() => {
    if (!editorRef.current) return
    
    // Don't update during composition (IME input)
    if (isComposingRef.current) return
    
    // Check if this is just a user typing the same value (no actual change)
    const valueChanged = lastValueRef.current !== value
    const highlightsChanged = lastHighlightRangesRef.current !== highlightRanges
    
    // Skip if nothing changed
    if (!valueChanged && !highlightsChanged) return
    
    // If highlights changed but value didn't, or if value changed externally, update
    const shouldUpdate = highlightsChanged || !isUpdatingFromInputRef.current
    
    if (shouldUpdate) {
      const cursorPos = saveCursorPosition(editorRef.current)
      const html = renderContent(value, highlightRanges)
      
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html || ""
        
        if (cursorPos && value) {
          restoreCursorPosition(editorRef.current, cursorPos)
        }
      }
    }
    
    lastValueRef.current = value
    lastHighlightRangesRef.current = highlightRanges
  }, [value, highlightRanges])

  const handleInput = () => {
    if (!editorRef.current) return
    isUpdatingFromInputRef.current = true // Mark as user input
    const newText = extractText(editorRef.current)
    lastValueRef.current = newText
    onChange(newText)
    // Reset flag after a tick to allow external updates
    setTimeout(() => {
      isUpdatingFromInputRef.current = false
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent editing usage count elements
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    
    // Check if cursor is inside or adjacent to a usage count element
    let node: Node | null = container
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.hasAttribute('data-usage-count')) {
          // Move cursor after the usage count element
          e.preventDefault()
          const newRange = document.createRange()
          newRange.setStartAfter(el)
          newRange.collapse(true)
          sel.removeAllRanges()
          sel.addRange(newRange)
          return
        }
      }
      node = node.parentNode
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const transformText = (transform: "upper" | "lower" | "title") => {
    const apply = (str: string) => {
      if (transform === "upper") return str.toUpperCase()
      if (transform === "lower") return str.toLowerCase()
      return str.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    }
    
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      onChange(apply(value))
      return
    }
    
    const range = sel.getRangeAt(0)
    const selectedText = range.toString()
    
    if (!selectedText) {
      onChange(apply(value))
      return
    }
    
    // Find selection in value string
    const start = value.indexOf(selectedText)
    if (start === -1) {
      onChange(apply(value))
      return
    }
    
    const end = start + selectedText.length
    const transformed = value.substring(0, start) + apply(selectedText) + value.substring(end)
    onChange(transformed)
  }

  const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    letterSpacing: "normal",
    wordSpacing: "normal",
  }

  return (
    <div data-highlight-scope={instanceId}>
      <div className="flex items-center justify-between border border-b-0 border-slate-200 rounded-t-md bg-slate-50 px-2 py-1">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => transformText("upper")}
            title="UPPERCASE"
            className="px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors"
          >
            AB
          </button>
          <button
            onClick={() => transformText("lower")}
            title="lowercase"
            className="px-1.5 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors"
          >
            ab
          </button>
          <button
            onClick={() => transformText("title")}
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
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className={isOverLimit ? "text-red-600 font-semibold" : ""}>
            {byteCount}/{maxLength} bytes
          </span>
          <span className={charCount > maxLength ? "text-red-600 font-semibold" : ""}>
            {charCount} chars
          </span>
          <span>{wordCount} words</span>
        </div>
      </div>

      <div
        className="relative w-full border border-slate-200 rounded-b-md bg-white focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300/50"
        style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px`, overflowY: "auto" }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => { isComposingRef.current = true }}
          onCompositionEnd={() => { isComposingRef.current = false; handleInput() }}
          data-placeholder={placeholder}
          className="outline-none"
          style={{
            ...textStyle,
            padding: "10px",
            minHeight: `${minHeight}px`,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#0f172a",
          }}
          suppressContentEditableWarning
        />
      </div>

      <style jsx>{`
        [contentEditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          position: absolute;
        }
        [data-usage-count] {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
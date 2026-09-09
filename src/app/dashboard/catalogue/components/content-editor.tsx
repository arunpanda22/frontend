"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "./rich-text-editor"
import { Sparkles, Loader2, Image, LayoutTemplate, Download } from "lucide-react"

interface ContentEditorProps {
  title: string
  setTitle: (title: string) => void
  bullets: string[]
  setBullets: (bullets: string[]) => void
  description: string
  setDescription: (description: string) => void
  backendKeywords: string
  setBackendKeywords: (keywords: string) => void
  usedKeywords: string[]
  usedWords: string[]
  keywordUsage: Map<string, number>
  wordUsage: Map<string, number>
  onOptimize: () => void
  isOptimizing: boolean
}

export function ContentEditor({
  title, setTitle, bullets, setBullets, description, setDescription,
  backendKeywords, setBackendKeywords, usedKeywords, usedWords,
  keywordUsage, wordUsage, onOptimize, isOptimizing,
}: ContentEditorProps) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Title</h2>
        <RichTextEditor
          value={title} onChange={setTitle}
          placeholder="Enter product title..."
          usedKeywords={usedKeywords} usedWords={usedWords}
          keywordUsage={keywordUsage} wordUsage={wordUsage}
          maxLength={200}
        />
      </section>

      {/* Bullet Points */}
      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Bullet Points</h2>
        <div className="space-y-4">
          {bullets.map((bullet, index) => (
            <div key={`bullet-${index}`}>
              <h3 className="text-xs font-medium text-slate-500 mb-1.5">Bullet Point #{index + 1}</h3>
              <RichTextEditor
                value={bullet}
                onChange={(val) => {
                  const newBullets = [...bullets]
                  newBullets[index] = val
                  setBullets(newBullets)
                }}
                placeholder={`Enter bullet point ${index + 1}...`}
                usedKeywords={usedKeywords} usedWords={usedWords}
                keywordUsage={keywordUsage} wordUsage={wordUsage}
                maxLength={500} maxHeight={300}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Description</h2>
        <RichTextEditor
          value={description} onChange={setDescription}
          placeholder="Enter product description..."
          usedKeywords={usedKeywords} usedWords={usedWords}
          keywordUsage={keywordUsage} wordUsage={wordUsage}
          maxLength={2000} minHeight={120} maxHeight={600}
        />
      </section>

      {/* Optimize Button */}
      <div className="pt-1">
        <Button
          onClick={onOptimize} disabled={isOptimizing}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          size="sm"
        >
          {isOptimizing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Optimizing Content...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Optimize Content</>
          )}
        </Button>
      </div>

      {/* Backend Keywords */}
      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">Backend Keywords</h2>
        <div className="border border-slate-200 rounded-md bg-white">
          <Textarea
            value={backendKeywords}
            onChange={(e) => setBackendKeywords(e.target.value.substring(0, 250))}
            placeholder="Keywords not used in content will appear here after optimization..."
            className="min-h-[100px] border-0 bg-transparent text-slate-900 placeholder:text-slate-400 resize-none focus:ring-0 focus:outline-none"
            maxLength={250}
          />
          <div className="border-t border-slate-200 bg-slate-50 px-2 py-1 flex items-center justify-end">
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>{backendKeywords.length}/250 chars</span>
              <span>{backendKeywords.split(/\s+/).filter(w => w).length} words</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
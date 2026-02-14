"use client"

import { Card } from "@/components/ui/card"
import { RichTextEditor } from "./rich-text-editor"

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
}

export function ContentEditor({
  title,
  setTitle,
  bullets,
  setBullets,
  description,
  setDescription,
  backendKeywords,
  setBackendKeywords,
  usedKeywords,
  usedWords,
  keywordUsage,
  wordUsage,
}: ContentEditorProps) {
  return (
    <div className="space-y-3">
      {/* Title */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Product Title</h2>
          <RichTextEditor
            value={title}
            onChange={setTitle}
            placeholder="Enter product title..."
            usedKeywords={usedKeywords}
            usedWords={usedWords}
            keywordUsage={keywordUsage}
            wordUsage={wordUsage}
            maxLength={200}
          />
        </div>
      </Card>

      {/* Bullet Points */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Bullet Points</h2>
          <div className="space-y-3">
            {bullets.map((bullet, index) => (
              <div key={`bullet-${index}`} className="space-y-1.5">
                <h3 className="text-[10px] font-medium text-slate-600 uppercase">Point #{index + 1}</h3>
                <RichTextEditor
                  value={bullet}
                  onChange={(value) => {
                    const newBullets = [...bullets]
                    newBullets[index] = value
                    setBullets(newBullets)
                  }}
                  placeholder={`Enter bullet point ${index + 1}...`}
                  usedKeywords={usedKeywords}
                  usedWords={usedWords}
                  keywordUsage={keywordUsage}
                  wordUsage={wordUsage}
                  maxLength={500}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Description - Taller */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Description</h2>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Enter product description..."
            usedKeywords={usedKeywords}
            usedWords={usedWords}
            keywordUsage={keywordUsage}
            wordUsage={wordUsage}
            maxLength={2000}
            // minHeight="min-h-48"
          />
        </div>
      </Card>

      {/* Backend Keywords */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Backend Keywords</h2>
          <RichTextEditor
            value={backendKeywords}
            onChange={setBackendKeywords}
            placeholder="Enter backend keywords..."
            usedKeywords={usedKeywords}
            usedWords={usedWords}
            keywordUsage={keywordUsage}
            wordUsage={wordUsage}
            maxLength={250}
          />
        </div>
      </Card>
    </div>
  )
}
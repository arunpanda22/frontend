"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "./rich-text-editor"
import { Sparkles } from "lucide-react"

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
  const handleOptimizeBullets = () => {
    // TODO: API call will be added later
    console.log("Optimize bullets clicked")
  }

  const handleOptimizeDescription = () => {
    // TODO: API call will be added later
    console.log("Optimize description clicked")
  }

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
          
          {/* Optimize Bullet Points Button */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              onClick={handleOptimizeBullets}
              variant="outline"
              size="sm"
              className="w-full bg-white hover:bg-slate-50 text-slate-900"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Optimize Bullet Points
            </Button>
          </div>
        </div>
      </Card>

      {/* Description */}
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
          />
          
          {/* Optimize Description Button */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              onClick={handleOptimizeDescription}
              variant="outline"
              size="sm"
              className="w-full bg-white hover:bg-slate-50 text-slate-900"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Optimize Description
            </Button>
          </div>
        </div>
      </Card>

      {/* Backend Keywords */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Backend Keywords</h2>
          <Textarea
            value={backendKeywords}
            onChange={(e) => setBackendKeywords(e.target.value.substring(0, 250))}
            placeholder="Keywords not used in content will appear here after optimization..."
            className="min-h-[100px] bg-white border-slate-300 text-black resize-none"
            maxLength={250}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{backendKeywords.length}/250 characters</span>
            <span>{backendKeywords.split(/\s+/).filter(w => w).length} words</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
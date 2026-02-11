"use client"

interface KeywordsListProps {
  keywords: string[]
  usage: Map<string, number>
  onRemove?: (keyword: string) => void
  type?: "words" | "phrases"
}

export function KeywordsList({ keywords, usage, onRemove, type = "phrases" }: KeywordsListProps) {
  return (
    <div className="space-y-3">
      {keywords.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
          <span>No keywords to display</span>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => {
              const lowerKeyword = keyword.toLowerCase()
              const count = usage.get(lowerKeyword) || 0
              const isUsed = count > 0

              return (
                <span key={keyword} className="inline-flex items-center">
                  <span
                    className={`text-sm font-medium transition-all ${
                      isUsed ? "text-cyan-700 line-through decoration-2" : "text-slate-700"
                    }`}
                  >
                    {keyword}
                    {isUsed && <sup className="text-xs ml-0.5 text-cyan-600 no-underline">{count}</sup>}
                  </span>
                  {index < keywords.length - 1 && <span className="text-slate-400 mx-1.5">,</span>}
                </span>
              )
            })}
          </div>
          {/* Copy button integrated at the bottom */}
          <div className="mt-3 text-xs text-slate-500">
            {keywords.length} {type === "words" ? "word" : "phrase"}
            {keywords.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  )
}

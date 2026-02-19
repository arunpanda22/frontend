"use client"

interface KeywordsListProps {
  keywords: string[]
  usage: Map<string, number>
  onRemove?: (keyword: string) => void
  type?: "words" | "phrases"
}

export function KeywordsList({ keywords, usage, onRemove, type = "phrases" }: KeywordsListProps) {
  if (keywords.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-3">No {type} to display</p>
    )
  }

  return (
    <div className="bg-slate-50 rounded-md p-3 border border-slate-100 max-h-52 overflow-y-auto">
      <div className="flex flex-wrap items-center">
        {keywords.map((keyword, index) => {
          const lowerKeyword = keyword.toLowerCase()
          const count = usage.get(lowerKeyword) || 0
          const isUsed = count > 0

          return (
            <span key={keyword} className="inline-flex items-baseline">
              <span
                className={`text-[13px] transition-colors ${
                  isUsed
                    ? "text-emerald-700 line-through decoration-emerald-400/60 decoration-1"
                    : "text-slate-700"
                }`}
              >
                {keyword}
              </span>
              {isUsed && (
                <sup className="text-[9px] font-bold text-emerald-600 ml-px relative -top-1">
                  {count}
                </sup>
              )}
              {index < keywords.length - 1 && (
                <span className="text-slate-400 mr-1">,</span>
              )}
            </span>
          )
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        {keywords.length} {type === "words" ? "word" : "phrase"}{keywords.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}
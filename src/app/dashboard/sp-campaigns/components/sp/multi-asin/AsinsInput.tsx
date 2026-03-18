'use client'

import { Plus, Trash2 } from 'lucide-react'

interface AsinsInputProps {
  asins:    string[]
  onChange: (asins: string[]) => void
  error?:   string
}

export function AsinsInput({ asins, onChange, error }: AsinsInputProps) {
  function updateAsin(index: number, value: string) {
    onChange(asins.map((a, i) => (i === index ? value.trim() : a)))
  }

  function addAsin() {
    onChange([...asins, ''])
  }

  function removeAsin(index: number) {
    onChange(asins.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {asins.map((asin, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={asin}
              onChange={(e) => updateAsin(index, e.target.value)}
              placeholder="e.g. B009GCTZWC"
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-[13px] text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
            <button
              type="button"
              onClick={() => removeAsin(index)}
              disabled={asins.length === 1}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addAsin}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add ASIN
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
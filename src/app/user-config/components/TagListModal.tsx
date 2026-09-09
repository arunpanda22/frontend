'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface Props {
  data: Record<string, string>[]
  columns: [string, string]
  onClose: () => void
}

export function TagListModal({ data, columns, onClose }: Props) {
  const [query, setQuery] = useState('')

  const filtered = data.filter((r) =>
    columns.some((c) =>
      String(r[c] ?? '').toLowerCase().includes(query.toLowerCase())
    )
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter rows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-hidden overflow-y-auto rounded-xl border border-slate-100 max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{r[columns[0]]}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{r[columns[1]]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400 py-6">
          {data.length === 0 ? 'No tags added yet.' : 'No rows match your filter.'}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400">
          {filtered.length} of {data.length} row{data.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </div>

    </div>
  )
}
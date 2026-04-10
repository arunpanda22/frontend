'use client'

import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

interface Row {
  key: string
  value: string
  errors: string[]
}

interface Props {
  title: string
  columns: [string, string]
  onSubmit: (rows: Omit<Row, 'errors'>[]) => Promise<void>
  onClose: () => void
}

const ASIN_RE = /^[A-Z0-9]{10}$/

function validateRow(key: string, value: string, columns: [string, string]): string[] {
  const errs: string[] = []
  const [colKey, colValue] = columns

  if (!key.trim())   errs.push(`${colKey} is required`)
  if (!value.trim()) errs.push(`${colValue} is required`)

  if (colKey === 'asin') {
    // ASIN Tags section: key must be an ASIN
    if (key.trim() && !ASIN_RE.test(key.trim().toUpperCase()))
      errs.push('ASIN must be 10 uppercase letters/digits')

    // Warn if the value looks like an ASIN — user may have swapped the columns
    if (value.trim() && ASIN_RE.test(value.trim().toUpperCase()))
      errs.push(`"${colValue}" looks like an ASIN — did you swap the columns?`)

  } else if (colKey === 'campaign_name') {
    // Campaign Tags section: key should NOT be a bare ASIN
    if (key.trim() && ASIN_RE.test(key.trim().toUpperCase()))
      errs.push(`Campaign name looks like an ASIN — did you swap the columns?`)
  }

  return errs
}

export function TagBulkPasteModal({ title, columns, onSubmit, onClose }: Props) {
  const [rows,    setRows]    = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [pasted,  setPasted]  = useState(false)

  const invalidCount = rows.filter((r) => r.errors.length > 0).length
  const canSave      = rows.length > 0 && invalidCount === 0

  function handlePaste(text: string) {
    const parsed = text
      .split('\n')
      .map((l) => l.split('\t'))
      .filter((p) => p.length >= 2 && (p[0].trim() || p[1].trim()))
      .map((p) => {
        const key   = p[0].trim()
        const value = p[1].trim().toLowerCase()
        return { key, value, errors: validateRow(key, value, columns) }
      })
    setRows(parsed)
    setPasted(true)
  }

  async function handleSave() {
    if (!canSave) return
    setLoading(true)
    await onSubmit(rows.map(({ key, value }) => ({ key, value })))
    setLoading(false)
    setRows([])
    setPasted(false)
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Paste area */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-600">
          Paste two columns from a spreadsheet: <span className="font-mono">{columns[0]}</span> and <span className="font-mono">{columns[1]}</span>
        </p>
        <textarea
          onPaste={(e) => { e.preventDefault(); handlePaste(e.clipboardData.getData('text')) }}
          onChange={() => {}}
          className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          placeholder={`${columns[0]}\t${columns[1]}\npaste rows here...`}
          readOnly={pasted}
        />
      </div>

      {/* Validation summary */}
      {rows.length > 0 && invalidCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">
            {invalidCount} row{invalidCount > 1 ? 's have' : ' has'} validation errors — fix or remove before saving.
          </p>
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {c}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={r.errors.length > 0 ? 'bg-red-50' : 'bg-white'}
                >
                  <td className={`px-4 py-2.5 font-mono text-xs ${r.errors.length > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                    {r.key || <span className="italic text-slate-400">empty</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-xs ${r.errors.length > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                    {r.value || <span className="italic text-slate-400">empty</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.errors.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {r.errors.map((err, j) => (
                          <span key={j} className="inline-flex items-center gap-1 text-[10px] text-red-500">
                            <AlertCircle className="h-3 w-3 shrink-0" /> {err}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-600">✓ Valid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400">
          {rows.length > 0
            ? `${rows.length - invalidCount} of ${rows.length} rows valid`
            : 'No rows pasted yet'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setRows([]); setPasted(false); onClose() }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : `Save ${rows.length - invalidCount > 0 ? `(${rows.length - invalidCount})` : ''}`
            }
          </button>
        </div>
      </div>

    </div>
  )
}
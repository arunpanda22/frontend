'use client'

import { useState, useCallback } from 'react'
import {
  ClipboardPaste, Trash2, XCircle, CheckCircle2,
  AlertCircle, Loader2, Film, BadgeCheck,
} from 'lucide-react'
import { Image } from 'lucide-react'
import { useCreateAsset, type AssetType, type CreateAssetPayload } from '@/lib/hooks/queries/use-assets-brands'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssetRow {
  _id:        string
  asset_type: AssetType
  asin:       string        // also holds brand name for BRAND_LOGO
  asset_id:   string
  asset_name: string
  asset_url:  string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'VIDEO',      label: 'Video'       },
  { value: 'IMAGE',      label: 'Image'       },
  { value: 'BRAND_LOGO', label: 'Brand Logo'  },
]

const ASSET_TYPE_ICONS: Record<AssetType, React.ReactNode> = {
  VIDEO:      <Film       className="h-3 w-3" />,
  IMAGE:      <Image      className="h-3 w-3" />,
  BRAND_LOGO: <BadgeCheck className="h-3 w-3" />,
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ── Asset type normaliser ─────────────────────────────────────────────────────

function normaliseAssetType(raw: string): AssetType {
  const s = raw?.toLowerCase().trim() ?? ''
  if (s.includes('video'))                                            return 'VIDEO'
  if (s.includes('logo'))                                             return 'BRAND_LOGO'
  if (s.includes('image') || s.includes('img') || s.includes('photo') || s.includes('banner'))
                                                                      return 'IMAGE'
  return 'IMAGE' // safe fallback
}

// ── Paste area ────────────────────────────────────────────────────────────────

function PasteArea({ onPaste }: { onPaste: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [flash,      setFlash]      = useState(false)

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text')
      if (text.trim()) {
        onPaste(text)
        setFlash(true)
        setTimeout(() => setFlash(false), 600)
      }
    },
    [onPaste],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      className={`relative rounded-xl border-2 border-dashed transition-all
        ${isDragging ? 'border-indigo-400 bg-indigo-50'
          : flash    ? 'border-emerald-400 bg-emerald-50'
          : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}
    >
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-6 pointer-events-none select-none">
        <ClipboardPaste className={`h-6 w-6 transition-colors ${isDragging || flash ? 'text-indigo-500' : 'text-slate-300'}`} />
        <p className="text-sm font-semibold text-slate-600">Paste Excel data here</p>
        <div className="text-[11px] text-slate-400 text-center space-y-0.5">
          <p className="font-mono font-semibold">
            Asset Type &nbsp;·&nbsp; ASIN / Brand &nbsp;·&nbsp; Asset ID &nbsp;·&nbsp; Asset Name &nbsp;·&nbsp; URL
          </p>
          <p>All 5 columns required &nbsp;·&nbsp; ASIN column accepts brand names for Brand Logo assets</p>
          <p>Asset Type accepts: VIDEO, IMAGE, BRAND_LOGO, "Other Image", "Other Video", etc.</p>
        </div>
      </div>
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for bulk asset data"
      />
    </div>
  )
}

// ── Editable table ────────────────────────────────────────────────────────────

function AssetTable({
  rows,
  onChange,
}: {
  rows:     AssetRow[]
  onChange: (rows: AssetRow[]) => void
}) {
  function updateRow(id: string, patch: Partial<AssetRow>) {
    onChange(rows.map((r) => r._id === id ? { ...r, ...patch } : r))
  }

  function deleteRow(id: string) {
    onChange(rows.filter((r) => r._id !== id))
  }

  const cellCls = "h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[12px] text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-100"

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-28">Type</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-32">ASIN / Brand</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Asset ID</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-36">Asset Name</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-36">URL</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row._id} className="group hover:bg-slate-50/50">
              {/* Asset Type */}
              <td className="px-2 py-1.5">
                <select
                  value={row.asset_type}
                  onChange={(e) => updateRow(row._id, { asset_type: e.target.value as AssetType })}
                  className={`${cellCls} appearance-none`}
                >
                  {ASSET_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </td>
              {/* ASIN / Brand */}
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={row.asin}
                  onChange={(e) => updateRow(row._id, { asin: e.target.value })}
                  placeholder={row.asset_type === 'BRAND_LOGO' ? 'Brand name' : 'B009GCTZWC'}
                  className={`${cellCls} font-mono`}
                />
              </td>
              {/* Asset ID */}
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={row.asset_id}
                  onChange={(e) => updateRow(row._id, { asset_id: e.target.value })}
                  placeholder="amzn1.assetlibrary…"
                  className={`${cellCls} font-mono text-[11px]`}
                />
              </td>
              {/* Asset Name */}
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={row.asset_name}
                  onChange={(e) => updateRow(row._id, { asset_name: e.target.value })}
                  placeholder="Friendly name"
                  className={cellCls}
                />
              </td>
              {/* URL */}
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={row.asset_url}
                  onChange={(e) => updateRow(row._id, { asset_url: e.target.value })}
                  placeholder="https://..."
                  className={cellCls}
                />
              </td>
              {/* Delete */}
              <td className="px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => deleteRow(row._id)}
                  className="flex h-7 w-7 items-center justify-center rounded text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AssetBulkPasteSectionProps {
  /** Called when assets have been saved so parent can refetch */
  onSaved?: () => void
}

export function AssetBulkPasteSection({ onSaved }: AssetBulkPasteSectionProps) {
  const createAsset = useCreateAsset()

  const [rows,       setRows]       = useState<AssetRow[]>([])
  const [parseInfo,  setParseInfo]  = useState<{ added: number; skipped: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,    setSummary]    = useState<{ success: number; failed: number } | null>(null)

  // ── Parse ──────────────────────────────────────────────────────────────────

  const handlePaste = useCallback((text: string) => {
    const lines = text.trim().split('\n').filter((l) => l.trim())
    const parsed: AssetRow[] = []
    let skipped = 0

    for (const line of lines) {
      const parts = line.split('\t').map((p) => p.trim())

      // Support 4-col (no name) and 5-col layouts
      let rawType: string, asin: string, asset_id: string, asset_name: string, asset_url: string

      if (parts.length >= 5) {
        ;[rawType, asin, asset_id, asset_name, asset_url] = parts
      } else if (parts.length === 4) {
        ;[rawType, asin, asset_id, asset_url] = parts
        asset_name = ''
      } else {
        skipped++
        continue
      }

      if (!asset_id?.trim()) { skipped++; continue }

      const asset_type = normaliseAssetType(rawType)
      const resolvedName = asset_name?.trim()
        || (asin?.trim() ? `${asin.trim()} - ${asset_type}` : asset_id.trim().slice(-12))

      parsed.push({
        _id:        uid(),
        asset_type,
        asin:       asin?.trim()      ?? '',
        asset_id:   asset_id.trim(),
        asset_name: resolvedName,
        asset_url:  asset_url?.trim() ?? '',
      })
    }

    setRows((prev) => [...prev, ...parsed])
    setParseInfo({ added: parsed.length, skipped })
    setTimeout(() => setParseInfo(null), 4000)
  }, [])

  // ── Validate ───────────────────────────────────────────────────────────────

  function validate(): boolean {
    return rows.every(
      (r) => r.asset_id.trim() && r.asset_name.trim() && r.asin.trim() && r.asset_url.trim(),
    )
  }

  const invalidCount = rows.filter(
    (r) => !r.asset_id.trim() || !r.asset_name.trim() || !r.asin.trim() || !r.asset_url.trim(),
  ).length

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validate()) return
    setIsSubmitting(true)
    setSummary(null)
    let success = 0, failed = 0

    for (const row of rows) {
      const payload: CreateAssetPayload = {
        asset_type: row.asset_type,
        asset_id:   row.asset_id,
        asset_name: row.asset_name,
        asin:       row.asin       || undefined,
        asset_url:  row.asset_url  || undefined,
      }
      try {
        await createAsset.mutateAsync(payload)
        success++
      } catch {
        failed++
      }
    }

    setSummary({ success, failed })
    setIsSubmitting(false)

    if (failed === 0) {
      setRows([])
      onSaved?.()
    }
  }

  function clearAll() {
    setRows([])
    setParseInfo(null)
    setSummary(null)
  }

  const hasRows   = rows.length > 0
  const canSubmit = hasRows && !isSubmitting && invalidCount === 0

  return (
    <div className="flex flex-col gap-4">

      {/* Paste area */}
      <PasteArea onPaste={handlePaste} />

      {/* Parse feedback */}
      {parseInfo && (
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-emerald-600">
            ✓ {parseInfo.added} row{parseInfo.added !== 1 ? 's' : ''} added
          </span>
          {parseInfo.skipped > 0 && (
            <span className="text-amber-600">
              ⚠ {parseInfo.skipped} skipped — not enough columns or missing Asset ID
            </span>
          )}
        </div>
      )}

      {/* Editable table */}
      {hasRows && (
        <>
          {/* Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-700">
                {rows.length} asset{rows.length !== 1 ? 's' : ''}
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {invalidCount} row{invalidCount !== 1 ? 's' : ''} missing required fields
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" /> Clear all
            </button>
          </div>

          <AssetTable rows={rows} onChange={setRows} />

          {/* Validation hint */}
          {invalidCount > 0 && (
            <p className="text-xs text-amber-600">
              All 5 columns are required. ASIN / Brand can be a brand name for Brand Logo assets.
            </p>
          )}

          {/* Summary banner */}
          {summary && (
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3
              ${summary.failed === 0
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'}`}
            >
              {summary.failed === 0
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0" />
              }
              <p className="text-sm font-medium text-slate-700">
                {summary.success} saved successfully
                {summary.failed > 0 && ` · ${summary.failed} failed — check the rows and retry`}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? 'Saving…'
                : `Save ${rows.length} asset${rows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
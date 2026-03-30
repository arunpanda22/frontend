'use client'

import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Search, RotateCcw, XCircle } from 'lucide-react'
import type { SDResult, SDAudience } from '@/lib/hooks/sdCampaignHooks'

// ── Shared cell style ─────────────────────────────────────────────────────────

export const cell = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition'

// ── Result banner ─────────────────────────────────────────────────────────────

export function SDResultBanner({ result }: { result: SDResult | null }) {
  if (!result) return null
  if (result.success) {
    const data = result.data as Record<string, string> | undefined
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Campaign created successfully</p>
          {data?.campaign_id && (
            <p className="mt-1 font-mono text-xs text-emerald-700">
              Campaign ID: {data.campaign_id}
              {data.ad_group_id && ` · Ad Group: ${data.ad_group_id}`}
            </p>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <div className="text-sm">
        <p className="font-semibold text-red-800">
          {result.failed_step ? `Failed at: ${result.failed_step}` : 'Campaign creation failed'}
        </p>
        <p className="mt-1 text-red-700">{result.error}</p>
      </div>
    </div>
  )
}

// ── Summary banner (bulk) ─────────────────────────────────────────────────────

export function SDBulkSummaryBanner({
  summary, onRetry, onDismiss,
}: {
  summary:   { total: number; success: number; failed: number }
  onRetry:   () => void
  onDismiss: () => void
}) {
  const allSuccess = summary.failed === 0
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3
      ${allSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-3">
        {allSuccess
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0"  />
        }
        <p className="text-sm font-medium text-slate-700">
          {summary.success} of {summary.total} campaigns created successfully
          {summary.failed > 0 && ` · ${summary.failed} failed`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {summary.failed > 0 && (
          <button type="button" onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
            <RotateCcw className="h-3 w-3" /> Retry Failed
          </button>
        )}
        <button type="button" onClick={onDismiss}
          className="rounded-lg px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── ASIN list input ───────────────────────────────────────────────────────────

interface AsinListProps {
  asins:    string[]
  onChange: (asins: string[]) => void
  error?:   string
  label?:   string
}

export function AsinListInput({ asins, onChange, error, label = 'Advertised ASINs' }: AsinListProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {asins.map((asin, i) => (
        <div key={i} className="grid grid-cols-[1fr_32px] gap-2 items-center">
          <input type="text" value={asin}
            onChange={(e) => onChange(asins.map((a, j) => j === i ? e.target.value.trim().toUpperCase() : a))}
            placeholder="e.g. B0XXXXXXXX" className={`${cell} font-mono`} />
          <button type="button" onClick={() => onChange(asins.filter((_, j) => j !== i))}
            disabled={asins.length === 1}
            className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange([...asins, ''])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add ASIN
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

// ── Expression type toggle (views / purchases) ────────────────────────────────

export type ExpressionType = 'views' | 'purchases'

export function ExpressionTypeToggle({
  value, onChange,
}: { value: ExpressionType; onChange: (v: ExpressionType) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Retargeting Type</span>
      <div className="flex gap-2">
        {([
          { value: 'views',     label: 'Views',     sub: 'Re-engage viewers'      },
          { value: 'purchases', label: 'Purchases',  sub: 'Re-engage past buyers'  },
        ] as { value: ExpressionType; label: string; sub: string }[]).map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`flex flex-col items-start rounded-xl border px-5 py-2.5 text-left transition-all
              ${value === opt.value
                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}>
            <span className={`text-[13px] font-semibold ${value === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</span>
            <span className={`text-[11px] ${value === opt.value ? 'text-indigo-500' : 'text-slate-400'}`}>{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Contextual type toggle (product / category) ───────────────────────────────

export type ContextualType = 'product' | 'category'

export function ContextualTypeToggle({
  value, onChange,
}: { value: ContextualType; onChange: (v: ContextualType) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contextual Targeting Type</span>
      <div className="flex gap-2">
        {([
          { value: 'product',  label: 'Product',  sub: 'Target competitor or related product pages' },
          { value: 'category', label: 'Category', sub: 'Target a category — resolved from ASIN'     },
        ] as { value: ContextualType; label: string; sub: string }[]).map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`flex flex-col items-start rounded-xl border px-5 py-2.5 text-left transition-all
              ${value === opt.value
                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}>
            <span className={`text-[13px] font-semibold ${value === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</span>
            <span className={`text-[11px] ${value === opt.value ? 'text-indigo-500' : 'text-slate-400'}`}>{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Audience type toggle (IN_MARKET / INTEREST) ───────────────────────────────

export type AudienceType = 'IN_MARKET' | 'INTEREST'

export function AudienceTypeToggle({
  value, onChange,
}: { value: AudienceType; onChange: (v: AudienceType) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Audience Type</span>
      <div className="flex gap-2">
        {([
          { value: 'IN_MARKET', label: 'In-Market', sub: 'Actively shopping for related products' },
          { value: 'INTEREST',  label: 'Interest',  sub: 'Browse interest-based audiences'        },
        ] as { value: AudienceType; label: string; sub: string }[]).map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`flex flex-col items-start rounded-xl border px-5 py-2.5 text-left transition-all
              ${value === opt.value
                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}>
            <span className={`text-[13px] font-semibold ${value === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</span>
            <span className={`text-[11px] ${value === opt.value ? 'text-indigo-500' : 'text-slate-400'}`}>{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Audience multi-select picker ──────────────────────────────────────────────

interface AudiencePickerProps {
  audiences:   SDAudience[]
  selected:    string[]
  onChange:    (ids: string[]) => void
  loading:     boolean
  error?:      string
  fetchError?: string | null
}

export function AudiencePicker({ audiences, selected, onChange, loading, error, fetchError }: AudiencePickerProps) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Fetching audiences…
      </div>
    )
  }
  if (fetchError) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{fetchError}</div>
  }
  if (!audiences.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
        Enter an ASIN above and click <span className="font-semibold">Fetch Audiences</span> to see suggestions.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Select Audiences ({selected.length} / {audiences.length})
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(audiences.map((a) => a.audienceId))}
            className="text-xs font-semibold text-indigo-600 hover:underline">Select all</button>
          <span className="text-slate-300">·</span>
          <button type="button" onClick={() => onChange([])}
            className="text-xs font-semibold text-slate-500 hover:underline">Clear</button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {audiences.map((aud) => {
          const isSelected = selected.includes(aud.audienceId)
          return (
            <button key={aud.audienceId} type="button" onClick={() => toggle(aud.audienceId)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors
                ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
              <div className={`h-4 w-4 shrink-0 rounded border-2 transition-colors
                ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white'}`}>
                {isSelected && (
                  <svg viewBox="0 0 10 10" className="h-full w-full text-white" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-[13px] ${isSelected ? 'font-medium text-indigo-700' : 'text-slate-700'}`}>
                {aud.audienceName}
              </span>
              <span className="ml-auto font-mono text-[10px] text-slate-400 shrink-0">{aud.audienceId}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Fetch audiences trigger ───────────────────────────────────────────────────

export function AudienceFetchTrigger({
  asin, audienceType, loading, onFetch,
}: { asin: string; audienceType: AudienceType; loading: boolean; onFetch: () => void }) {
  return (
    <button type="button" onClick={onFetch} disabled={!asin.trim() || loading}
      className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      {loading ? 'Fetching…' : `Fetch ${audienceType === 'IN_MARKET' ? 'In-Market' : 'Interest'} Audiences`}
    </button>
  )
}
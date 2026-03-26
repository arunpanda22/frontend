'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Select } from '../../sp-campaigns/components/shared/FormFields'
import { useSBAssets, useSBBrands, type SBResult } from '@/lib/hooks/sbCampaignHooks'
import type { AmazonAsset } from '@/lib/hooks/queries/use-assets-brands'
import { CheckCircle2, AlertCircle } from 'lucide-react'

// ── Asset selector ────────────────────────────────────────────────────────────

function assetOptions(assets: AmazonAsset[]) {
  return assets.map((a) => ({ value: a.asset_id, label: a.asset_name }))
}

interface AssetSelectProps {
  label:    string
  assets:   AmazonAsset[]
  value:    string
  onChange: (id: string) => void
  error?:   string
}

export function AssetSelect({ label, assets, value, onChange, error }: AssetSelectProps) {
  return (
    <Select
      label={label}
      options={[{ value: '', label: 'Select asset…' }, ...assetOptions(assets)]}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  )
}

// ── Brand selector ────────────────────────────────────────────────────────────

interface BrandSelectProps {
  label?:        string
  value:         string
  onChange:      (name: string) => void
  onEntityId?:   (id: string) => void
  error?:        string
}

export function BrandSelect({ label = 'Brand', value, onChange, onEntityId, error }: BrandSelectProps) {
  const { data: brands = [] } = useSBBrands()
  return (
    <Select
      label={label}
      options={[{ value: '', label: 'Select brand…' }, ...brands.map((b) => ({ value: b.brand_name, label: b.brand_name }))]}
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        if (onEntityId) {
          const brand = brands.find((b) => b.brand_name === e.target.value)
          onEntityId(brand?.brand_entity_id ?? '')
        }
      }}
      error={error}
    />
  )
}

// ── Flat keywords table (shared bid + match_type) ─────────────────────────────
// Used by Product Collection + Store Spotlight

export type MatchType = 'exact' | 'phrase' | 'broad'

const MATCH_OPTIONS = [
  { value: 'exact',  label: 'Exact'  },
  { value: 'phrase', label: 'Phrase' },
  { value: 'broad',  label: 'Broad'  },
]

interface FlatKeywordsProps {
  keywords:   string[]
  matchType:  MatchType
  bid:        number | string
  onKeywords: (kws: string[]) => void
  onMatch:    (m: MatchType) => void
  onBid:      (b: string) => void
  error?:     string
  minBid:     number
  currency:   string
}

export function FlatKeywordsTable({
  keywords, matchType, bid, onKeywords, onMatch, onBid, error, minBid, currency,
}: FlatKeywordsProps) {
  const cell = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition'

  return (
    <div className="flex flex-col gap-3">
      {/* Shared match type + bid */}
      <div className="grid grid-cols-2 gap-3 max-w-xs">
        <Select
          label="Match Type"
          options={MATCH_OPTIONS}
          value={matchType}
          onChange={(e) => onMatch(e.target.value as MatchType)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Bid ({currency})
          </label>
          <input
            type="number"
            value={bid}
            min={minBid}
            step={minBid}
            onChange={(e) => onBid(e.target.value)}
            className={cell}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Keyword rows */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_32px] gap-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Keyword</span>
          <span />
        </div>
        {keywords.map((kw, i) => (
          <div key={i} className="grid grid-cols-[1fr_32px] gap-2 items-center">
            <input
              type="text"
              value={kw}
              onChange={(e) => onKeywords(keywords.map((k, j) => j === i ? e.target.value : k))}
              placeholder="e.g. kids toy"
              className={cell}
            />
            <button
              type="button"
              onClick={() => onKeywords(keywords.filter((_, j) => j !== i))}
              disabled={keywords.length === 1}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onKeywords([...keywords, ''])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add keyword
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

// ── Per-keyword table (individual bids) ───────────────────────────────────────
// Used by SBV Single ASIN Multi KW

export interface KWRow {
  text:      string
  matchType: MatchType
  bid:       number | string
}

interface PerKWTableProps {
  rows:     KWRow[]
  onChange: (rows: KWRow[]) => void
  error?:   string
  minBid:   number
  currency: string
}

export function PerKeywordTable({ rows, onChange, error, minBid, currency }: PerKWTableProps) {
  const cell = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition'

  function update(i: number, patch: Partial<KWRow>) {
    onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Keyword</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid ({currency})</span>
        <span />
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
            <input type="text" value={row.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="e.g. kids toy" className={cell} />
            <select value={row.matchType} onChange={(e) => update(i, { matchType: e.target.value as MatchType })} className={cell}>
              {MATCH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="number" value={row.bid} min={minBid} step={minBid} onChange={(e) => update(i, { bid: e.target.value })} placeholder="0.00" className={cell} />
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} disabled={rows.length === 1}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange([...rows, { text: '', matchType: 'exact', bid: '' }])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add keyword
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

// ── Target ASINs table (with per-target bid + match type) ────────────────────

export interface SBTargetRow {
  asin:      string
  bid:       number | string
  matchType: 'EXACT' | 'EXPANDED'
}

const PT_MATCH_OPTIONS = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

// ── Target ASINs table ────────────────────────────────────────────────────────

interface TargetAsinsProps {
  rows:     SBTargetRow[]
  onChange: (rows: SBTargetRow[]) => void
  error?:   string
  minBid:   number
  currency: string
}

export function TargetAsinsTable({ rows, onChange, error, minBid, currency }: TargetAsinsProps) {
  const cell = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition'

  function update(i: number, patch: Partial<SBTargetRow>) {
    onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target ASIN</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid ({currency})</span>
        <span />
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
            <input type="text" value={row.asin}
              onChange={(e) => update(i, { asin: e.target.value.trim() })}
              placeholder="e.g. B009GCTZWC" className={`${cell} font-mono`} />
            <select value={row.matchType} onChange={(e) => update(i, { matchType: e.target.value as SBTargetRow['matchType'] })} className={cell}>
              {PT_MATCH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="number" value={row.bid} min={minBid} step={minBid}
              onChange={(e) => update(i, { bid: e.target.value })}
              placeholder="0.00" className={cell} />
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} disabled={rows.length === 1}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange([...rows, { asin: '', matchType: 'EXACT', bid: '' }])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add target
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

// ── Sub-pages table (Spotlight only) ─────────────────────────────────────────

export interface SubPage {
  pageTitle: string
  asin:      string
  url:       string
}

interface SubPagesProps {
  pages:    SubPage[]
  onChange: (pages: SubPage[]) => void
  error?:   string
}

export function SubPagesTable({ pages, onChange, error }: SubPagesProps) {
  const cell = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition'

  function update(i: number, patch: Partial<SubPage>) {
    onChange(pages.map((p, j) => j === i ? { ...p, ...patch } : p))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_1fr_2fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Page Title</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ASIN</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Store Page URL</span>
        <span />
      </div>
      <div className="flex flex-col gap-2">
        {pages.map((page, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2fr_32px] gap-2 items-center">
            <input type="text" value={page.pageTitle} onChange={(e) => update(i, { pageTitle: e.target.value })} placeholder="e.g. Toy Collection" className={cell} />
            <input type="text" value={page.asin}      onChange={(e) => update(i, { asin: e.target.value.trim() })} placeholder="B009GCTZWC" className={`${cell} font-mono`} />
            <input type="text" value={page.url}       onChange={(e) => update(i, { url: e.target.value })} placeholder="https://amazon.com/stores/..." className={cell} />
            <button type="button" onClick={() => onChange(pages.filter((_, j) => j !== i))} disabled={pages.length === 1}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange([...pages, { pageTitle: '', asin: '', url: '' }])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add page
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
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
  const cell = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 font-mono text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {asins.map((asin, i) => (
        <div key={i} className="grid grid-cols-[1fr_32px] gap-2 items-center">
          <input type="text" value={asin}
            onChange={(e) => onChange(asins.map((a, j) => j === i ? e.target.value.trim() : a))}
            placeholder="e.g. B009GCTZWC" className={cell} />
          <button type="button" onClick={() => onChange(asins.filter((_, j) => j !== i))} disabled={asins.length === 1}
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

// ── Result banner ─────────────────────────────────────────────────────────────

export function SBResultBanner({ result }: { result: SBResult | null }) {
  if (!result) return null
  if (result.success) {
    const data = result.data as Record<string, string> | undefined
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Campaign created successfully</p>
          {data?.campaign_id && (
            <p className="mt-1 text-emerald-700 font-mono text-xs">
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
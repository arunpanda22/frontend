'use client'

import React, { useMemo, useState } from 'react'
import { Activity, TrendingUp, MousePointer, BarChart2, RefreshCw } from 'lucide-react'
import { useHeatmapData } from '@/lib/hooks/queries/use-order-analytics'
import type { AdType, HeatMetric, HeatmapCell } from '@/lib/api/services/order-analytics.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT:  Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

const AD_TYPES: { key: AdType; label: string; description: string }[] = [
  { key: 'sp', label: 'Sponsored Products', description: 'SP' },
  { key: 'sb', label: 'Sponsored Brands',   description: 'SB' },
  { key: 'sd', label: 'Sponsored Display',  description: 'SD' },
]

const METRICS: { key: HeatMetric; label: string; icon: React.FC<any>; format: (v: number) => string }[] = [
  { key: 'traffic',    label: 'Impressions',  icon: Activity,      format: v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(Math.round(v)) },
  { key: 'conversion', label: 'Conversions',  icon: TrendingUp,    format: v => String(Math.round(v)) },
  { key: 'clicks',     label: 'Clicks',       icon: MousePointer,  format: v => String(Math.round(v)) },
  { key: 'cpc',        label: 'CPC',          icon: BarChart2,     format: v => `₹${v.toFixed(2)}` },
  { key: 'cr',         label: 'Conv. Rate',   icon: RefreshCw,     format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'roas',       label: 'ROAS',         icon: TrendingUp,    format: v => `${v.toFixed(2)}x` },
]

// ─── Color scale ──────────────────────────────────────────────────────────────
// Ocean-toned scale: near-white → deep teal, matching the dashboard palette.

function getIntensity(value: number, min: number, max: number): number {
  if (max === min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

function getCellStyle(intensity: number): { bg: string; text: string } {
  if (intensity === 0)        return { bg: '#f8fafc', text: '#cbd5e1' }
  if (intensity < 0.15)       return { bg: '#e0f2fe', text: '#0369a1' }
  if (intensity < 0.30)       return { bg: '#bae6fd', text: '#0369a1' }
  if (intensity < 0.45)       return { bg: '#7dd3fc', text: '#0c4a6e' }
  if (intensity < 0.60)       return { bg: '#38bdf8', text: '#0c4a6e' }
  if (intensity < 0.72)       return { bg: '#0ea5e9', text: '#ffffff' }
  if (intensity < 0.84)       return { bg: '#0284c7', text: '#ffffff' }
  if (intensity < 0.93)       return { bg: '#0369a1', text: '#ffffff' }
  return                             { bg: '#0c4a6e', text: '#ffffff' }
}

// ─── Build full 7×24 grid ─────────────────────────────────────────────────────

function buildGrid(cells: HeatmapCell[]): Map<string, HeatmapCell> {
  const map = new Map<string, HeatmapCell>()
  cells.forEach(c => map.set(`${c.day}-${c.hour}`, c))
  return map
}

function getMetricValue(cell: HeatmapCell | undefined, metric: HeatMetric): number {
  if (!cell) return 0
  // clicks is not a HeatMetric key but is on the cell — handle gracefully
  return cell[metric] ?? 0
}

// ─── Hour label ───────────────────────────────────────────────────────────────

function hourLabel(h: number): string {
  if (h === 0)  return '12am'
  if (h < 12)   return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipData {
  cell:  HeatmapCell
  x:     number
  y:     number
}

function CellTooltip({ data, metricFmt }: { data: TooltipData; metricFmt: (v: number) => string }) {
  const { cell, x, y } = data
  const leftSide = x > window.innerWidth / 2

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ top: y + 12, [leftSide ? 'right' : 'left']: leftSide ? window.innerWidth - x + 8 : x + 8 }}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2.5 text-xs min-w-[160px]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important" as any }}>
        <p className="font-semibold mb-1.5 text-gray-100">{cell.day}, {hourLabel(cell.hour)}–{hourLabel(cell.hour + 1)}</p>
        <div className="space-y-1 text-gray-300">
          <div className="flex justify-between gap-4"><span>Impressions</span><span className="text-white font-medium">{cell.traffic.toLocaleString()}</span></div>
          <div className="flex justify-between gap-4"><span>Clicks</span><span className="text-white font-medium">{cell.clicks.toLocaleString()}</span></div>
          <div className="flex justify-between gap-4"><span>Conversions</span><span className="text-white font-medium">{cell.conversion.toLocaleString()}</span></div>
          <div className="flex justify-between gap-4"><span>Spend</span><span className="text-white font-medium">₹{cell.cost.toFixed(2)}</span></div>
          <div className="flex justify-between gap-4"><span>CPC</span><span className="text-white font-medium">₹{cell.cpc.toFixed(2)}</span></div>
          <div className="flex justify-between gap-4"><span>Conv. Rate</span><span className="text-white font-medium">{(cell.cr * 100).toFixed(1)}%</span></div>
          <div className="flex justify-between gap-4"><span>ROAS</span><span className="text-white font-medium">{cell.roas.toFixed(2)}x</span></div>
        </div>
      </div>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function HeatLegend({ min, max, metricFmt }: { min: number; max: number; metricFmt: (v: number) => string }) {
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1]
  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-xs text-gray-400 shrink-0">Low</span>
      <div className="flex gap-px">
        {steps.map(s => (
          <div
            key={s}
            className="w-7 h-3 rounded-sm"
            style={{ backgroundColor: getCellStyle(s).bg, border: '1px solid rgba(0,0,0,0.06)' }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 shrink-0">High</span>
      <span className="text-xs text-gray-400 ml-1">
        ({metricFmt(min)} → {metricFmt(max)})
      </span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* hour col */}
        <div className="flex flex-col gap-px shrink-0">
          <div className="h-5 w-8" />
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="h-5 w-8 bg-gray-100 rounded-sm" />
          ))}
        </div>
        {/* day cols */}
        {DAYS_ORDER.map(d => (
          <div key={d} className="flex flex-col gap-px flex-1 min-w-[42px]">
            <div className="h-5 bg-gray-200 rounded-sm" />
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="h-5 bg-gray-100 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdsHeatmap() {
  const [adType,  setAdType]  = useState<AdType>('sp')
  const [metric,  setMetric]  = useState<HeatMetric>('traffic')
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  // No date range — aggregate all available data for day/hour trend patterns
  const params = { ad_types: adType }

  const { data, isLoading, isError, refetch } = useHeatmapData(params)

  const cells: HeatmapCell[] = data?.[adType] ?? []

  const grid = useMemo(() => buildGrid(cells), [cells])

  const { min, max } = useMemo(() => {
    if (!cells.length) return { min: 0, max: 0 }
    const values = cells.map(c => getMetricValue(c, metric)).filter(v => v > 0)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [cells, metric])

  const currentMetric = METRICS.find(m => m.key === metric)!

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">Ad Performance Heatmap</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
              All time · hourly trends
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Impressions, clicks and conversions by day &amp; hour</p>
        </div>

        {/* Ad type tabs */}
        <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-100 self-start">
          {AD_TYPES.map(at => (
            <button
              key={at.key}
              onClick={() => setAdType(at.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                adType === at.key
                  ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {at.description}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metric selector ── */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {METRICS.map(m => {
          const Icon = m.icon
          const active = metric === m.key
          return (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                active
                  ? 'bg-ocean-50 border-ocean-200 text-ocean-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
              style={active ? { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1' } : undefined}
            >
              <Icon size={12} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <HeatmapSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-sm text-gray-500">Failed to load heatmap data.</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : cells.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">No data available for the selected period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid gap-px"
            style={{
              display:             'grid',
              gridTemplateColumns: `44px repeat(7, minmax(42px, 1fr))`,
              minWidth:            400,
            }}
          >
            {/* ── Column headers ── */}
            <div /> {/* empty corner */}
            {DAYS_ORDER.map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 pb-1.5 uppercase tracking-wide"
              >
                {DAY_SHORT[day]}
              </div>
            ))}

            {/* ── Hour rows ── */}
            {Array.from({ length: 24 }, (_, hour) => (
              <React.Fragment key={hour}>
                {/* Hour label */}
                <div className="flex items-center justify-end pr-2 text-right">
                  <span className="text-[10px] text-gray-400 leading-none">{hourLabel(hour)}</span>
                </div>

                {/* Day cells */}
                {DAYS_ORDER.map(day => {
                  const cell      = grid.get(`${day}-${hour}`)
                  const value     = getMetricValue(cell, metric)
                  const intensity = getIntensity(value, min, max)
                  const style     = getCellStyle(intensity)

                  return (
                    <div
                      key={day}
                      className="relative h-5 rounded-[3px] cursor-default transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: style.bg,
                        border:          '1px solid rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={e => {
                        if (cell) {
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top })
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Show value text only when cell is wide enough and value is non-zero */}
                      {value > 0 && (
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-medium leading-none select-none pointer-events-none"
                          style={{ color: style.text, opacity: intensity > 0.1 ? 1 : 0 }}
                        >
                          {currentMetric.format(value)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {!isLoading && !isError && cells.length > 0 && (
        <HeatLegend min={min} max={max} metricFmt={currentMetric.format} />
      )}

      {/* ── Tooltip (portal-free, fixed positioning) ── */}
      {tooltip && (
        <CellTooltip data={tooltip} metricFmt={currentMetric.format} />
      )}
    </div>
  )
}

export default AdsHeatmap
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import type { RevenueMapResponse, RevenueByState, OrderAnalyticsParams } from '@/lib/api/services/order-analytics.service'
import { useStateRevenueDetail } from '@/lib/hooks/queries/use-order-analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoJSONFeature {
  type: string
  properties: Record<string, any>
  geometry: { type: string; coordinates: any }
}

interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
}

interface GeoFeature {
  type: string
  properties: Record<string, any>  // ← change from { NAME_1: string }
  geometry: { type: string; coordinates: any }
}

interface GeoData {
  type: string
  features: GeoFeature[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRevenue(value: number | string | undefined | null): string {
  const v = Number(value ?? 0)
  if (isNaN(v)) return '₹0'
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`
  return `₹${v.toFixed(0)}`
}

function getColor(revenue: number | string, min: number | string, max: number | string): string {
  const r = Number(revenue), mn = Number(min), mx = Number(max)
  if (r === 0)   return '#EFF6FF'
  if (mx === mn) return '#BFDBFE'
  const t = Math.pow((r - mn) / (mx - mn), 0.5)
  const rv = Math.round(219 - (219 - 29)  * t)
  const g  = Math.round(234 - (234 - 78)  * t)
  const b  = Math.round(254 - (254 - 216) * t)
  return `rgb(${rv},${g},${b})`
}

// ─── GeoJSON → SVG projection (Mercator-fitted to India) ─────────────────────

const MIN_LON = 68,  MAX_LON = 97.5
const MIN_LAT = 7.5, MAX_LAT = 37
const SVG_W = 500,   SVG_H = 560, PAD = 16

function projectPoint(lon: number, lat: number): [number, number] {
  const x = PAD + ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (SVG_W - 2 * PAD)
  const y = PAD + ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (SVG_H - 2 * PAD)
  return [x, y]
}

function coordinatesToPath(coords: any, type: string): string {
  const ring2path = (ring: number[][]): string =>
    ring.map((c, i) => {
      const [x, y] = projectPoint(c[0], c[1])
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ') + ' Z'

  if (type === 'Polygon')      return (coords as number[][][]).map(ring2path).join(' ')
  if (type === 'MultiPolygon') return (coords as number[][][][]).flatMap(poly => poly.map(ring2path)).join(' ')
  return ''
}

// ─── Name normalisation: TopoJSON NAME_1 → your API state names ──────────────
// The GeoJSON uses older names; map them to what your API returns.
const NAME_MAP: Record<string, string> = {
  'orissa':                    'Odisha',
  'uttaranchal':               'Uttarakhand',
  'pondicherry':               'Puducherry',
  'jammu & kashmir':           'Jammu and Kashmir',
  'andaman and nicobar':       'Andaman and Nicobar Islands',
  'dadra and nagar haveli':    'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu':             'Dadra and Nagar Haveli and Daman and Diu',
}

function normalise(rawName: string): string {
  const lower = rawName.toLowerCase().trim()
  if (NAME_MAP[lower]) return NAME_MAP[lower]
  // Title-case as fallback (GeoJSON already has good names like "Maharashtra")
  return rawName.trim()
}

// ─── State detail panel (shown when a state is selected) ─────────────────────

interface StatePanelProps {
  state: RevenueByState
  params?: OrderAnalyticsParams
  onClose: () => void
}

function StatePanel({ state, params, onClose }: StatePanelProps) {
  const { data, isLoading } = useStateRevenueDetail(state.state, params)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-0.5">
            Selected State
          </p>
          <h3 className="text-base font-semibold text-gray-900 leading-tight">{state.state}</h3>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 shrink-0">
        {[
          { label: 'Revenue', value: formatRevenue(state.revenue) },
          { label: 'Orders',  value: Number(state.orders).toLocaleString() },
          { label: 'AOV',     value: formatRevenue(state.aov) },
          { label: 'Share',   value: `${Number(state.revenue_share).toFixed(1)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Share bar */}
      <div className="px-5 py-3 border-b border-gray-50 shrink-0">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Number(state.revenue_share))}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {Number(state.revenue_share).toFixed(1)}% of total revenue
        </p>
      </div>

      {/* Drill-down */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-7 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            {data.top_skus?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Top SKUs</p>
                <div className="space-y-2">
                  {data.top_skus.slice(0, 5).map((sku) => (
                    <div key={sku.sku} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-700 truncate">{sku.sku}</p>
                        <p className="text-[10px] text-gray-400 truncate">{sku.product_name}</p>
                      </div>
                      <p className="text-xs font-semibold text-blue-600 ml-3 shrink-0">{formatRevenue(sku.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.cities?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Cities</p>
                <div className="space-y-2">
                  {data.cities.slice(0, 8).map((city) => {
                    const pct = Math.min(100, (Number(city.revenue) / Number(data.revenue)) * 100)
                    return (
                      <div key={city.city}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs text-gray-600 truncate">{city.city}</span>
                          <span className="text-[10px] text-gray-400 ml-2 shrink-0">{formatRevenue(city.revenue)}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── Default sidebar: ranked list of all states ───────────────────────────────

interface TopStatesSidebarProps {
  states: RevenueByState[]
  activeState: RevenueByState | null
  onSelect: (s: RevenueByState) => void
  minRevenue: number | string
  maxRevenue: number | string
}

function TopStatesSidebar({ states, activeState, onSelect, minRevenue, maxRevenue }: TopStatesSidebarProps) {
  const mn = Number(minRevenue), mx = Number(maxRevenue)
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Top States by Revenue
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {states.slice(0, 15).map((s, i) => {
          const rev = Number(s.revenue)
          const pct = mx === mn ? 0 : Math.min(100, ((rev - mn) / (mx - mn)) * 100)
          const isActive = activeState?.state === s.state
          return (
            <button
              key={s.state}
              onClick={() => onSelect(s)}
              className={`w-full text-left px-5 py-2.5 transition-colors ${
                isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono w-4 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                      {s.state}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 ml-2 shrink-0">
                      {formatRevenue(s.revenue)}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActive ? 'bg-blue-500' : 'bg-blue-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RevenueMapProps {
  data: RevenueMapResponse
  params?: OrderAnalyticsParams
  isLoading?: boolean
}

export function RevenueMap({ data, params, isLoading }: RevenueMapProps) {
  const [activeState, setActiveState] = useState<RevenueByState | null>(null)
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; state: RevenueByState } | null>(null)
  const [geoData, setGeoData]         = useState<GeoData | null>(null)
  const [geoError, setGeoError]       = useState(false)
  

  // Lookup map: lowercase state name → revenue data
  const stateMap = useMemo(() => {
    const m = new Map<string, RevenueByState>()
    data.states.forEach((s) => m.set(s.state.toLowerCase().trim(), s))
    return m
  }, [data.states])

  // Load TopoJSON from /public/india-states.json
  useEffect(() => {
    fetch('/india-states.json')
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
        .then((geo: GeoData) => setGeoData(geo))
        .catch((e) => { console.error('[RevenueMap]', e); setGeoError(true) })
    }, [])

  if (isLoading) {
    return (
      <div className="w-full h-[520px] bg-white rounded-xl border border-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading map…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Revenue by State</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatRevenue(data.total_revenue)} across {Number(data.total_orders).toLocaleString()} orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{formatRevenue(data.min_revenue)}</span>
          <div
            className="w-28 h-2.5 rounded-full border border-gray-100"
            style={{ background: 'linear-gradient(to right, #EFF6FF, #1D4ED8)' }}
          />
          <span className="text-[10px] text-gray-400">{formatRevenue(data.max_revenue)}</span>
        </div>
      </div>

      {/* ── Body: map 2/3 + sidebar 1/3 ── */}
      <div className="flex min-h-[520px]">

        {/* Map — flex-1 ≈ 2/3 */}
        <div className="flex-1 relative overflow-hidden border-r border-gray-50">
          {geoError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400">
              Map data unavailable — place <code>india-states.json</code> in <code>/public</code>
            </div>
          )}
          {!geoData && !geoError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-full"
            style={{ display: 'block' }}
          >
            {geoData?.features.map((feat, idx) => {
              // TopoJSON property key is NAME_1 in our generated file
              const rawName  = feat.properties?.NAME_1 ?? feat.properties?.st_nm ?? feat.properties?.name ?? ''
              const dispName = normalise(rawName)
              const stData   = stateMap.get(dispName.toLowerCase().trim())
              const revenue  = Number(stData?.revenue ?? 0)
              const fill     = getColor(revenue, data.min_revenue, data.max_revenue)
              const isActive = activeState?.state === dispName
              const pathD    = coordinatesToPath(feat.geometry.coordinates, feat.geometry.type)
              if (!pathD) return null

              return (
                <path
                  key={`${dispName}-${idx}`}
                  d={pathD}
                  fill={fill}
                  stroke={isActive ? '#1D4ED8' : '#CBD5E1'}
                  strokeWidth={isActive ? 1.2 : 0.4}
                  style={{
                    cursor:     stData ? 'pointer' : 'default',
                    filter:     isActive ? 'drop-shadow(0 1px 4px rgba(29,78,216,0.25))' : 'none',
                    transition: 'fill 150ms, stroke 150ms',
                  }}
                  onClick={() => {
                    if (stData) setActiveState(isActive ? null : stData)
                  }}
                  onMouseEnter={(e) => {
                    if (!stData) return
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect()
                    if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, state: stData })
                  }}
                  onMouseMove={(e) => {
                    if (!stData) return
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect()
                    if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, state: stData })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </svg>

          {tooltip && (
            <div
              className="absolute z-20 pointer-events-none bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg"
              style={{ left: tooltip.x + 14, top: tooltip.y - 56, transform: 'translateY(-50%)' }}
            >
              <p className="font-semibold leading-snug">{tooltip.state.state}</p>
              <p className="text-gray-300 mt-0.5">
                {formatRevenue(tooltip.state.revenue)} · {Number(tooltip.state.orders).toLocaleString()} orders
              </p>
              <p className="text-gray-400">AOV {formatRevenue(tooltip.state.aov)}</p>
            </div>
          )}
        </div>

        {/* Sidebar — fixed w-72 ≈ 1/3 */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          {activeState ? (
            <StatePanel
              state={activeState}
              params={params}
              onClose={() => setActiveState(null)}
            />
          ) : (
            <TopStatesSidebar
              states={data.states}
              activeState={activeState}
              onSelect={setActiveState}
              minRevenue={data.min_revenue}
              maxRevenue={data.max_revenue}
            />
          )}
        </div>
      </div>
    </div>
  )
}
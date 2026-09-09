'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { format, parse, subMonths, startOfMonth } from 'date-fns'
import { Download } from 'lucide-react'
import type { CohortOrder } from '@/lib/api/services/order-analytics.service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CohortCell {
  revenue: number
  orderCount: number
  uniqueCustomers: number
}

type MetricType      = 'revenue' | 'orders'
type CalculationType = 'total' | 'per-customer' | 'percentage'

interface CohortTableProps {
  orders: CohortOrder[]
  isLoading?: boolean
}

interface TooltipState {
  orderMonth:  string
  cohortMonth: string
  x: number
  y: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lastNMonths(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(startOfMonth(subMonths(new Date(), i)), 'yyyy-MM')
  )
}

function fmtMonth(ym: string): string {
  return format(parse(ym, 'yyyy-MM', new Date()), 'MMM yy')
}

function fmtRevenue(v: number): string {
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`
  return `₹${v.toFixed(0)}`
}

function cellOpacity(isNewCustomer: boolean, cohortAge: number): number {
  if (isNewCustomer) return 0.92
  const ramp = [0.70, 0.52, 0.38, 0.28, 0.20, 0.14]
  return ramp[Math.min(cohortAge - 1, ramp.length - 1)]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CohortSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
      <div className="h-px bg-gray-100" />
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4, 5, 6].map((cols, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-12 w-20 bg-gray-200 rounded-lg animate-pulse shrink-0" />
            <div className="h-12 w-24 bg-gray-100 rounded-lg animate-pulse shrink-0" />
            {Array.from({ length: cols }, (_, j) => (
              <div key={j} className="h-12 w-20 rounded-lg animate-pulse"
                style={{ backgroundColor: `rgba(29,78,216,${0.92 - j * 0.14})` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CohortTable({ orders, isLoading }: CohortTableProps) {
  const [metric,   setMetric]   = useState<MetricType>('revenue')
  const [calcType, setCalcType] = useState<CalculationType>('total')
  const [tooltip,  setTooltip]  = useState<TooltipState | null>(null)

  // ── Build matrix ─────────────────────────────────────────────────────────
  // NOTE: matrix and orderMonths/maxCohortAge do NOT depend on metric/calcType —
  // those only affect display. maxRawValue is always the raw metric max (no
  // per-customer or percentage scaling applied), so percentage view is stable.
  const { matrix, orderMonths, maxCohortAge } = useMemo(() => {
    const windowMonths = lastNMonths(6)

    const matrix = new Map<string, Map<string, CohortCell>>()
    windowMonths.forEach(m => matrix.set(m, new Map()))

    orders.forEach(o => {
      const orderMonth  = format(new Date(o['purchase-date']), 'yyyy-MM')
      const cohortMonth = o['first-purchase-month']
      const revenue     = parseFloat(o['item-price']) || 0

      if (!matrix.has(orderMonth)) return

      const row = matrix.get(orderMonth)!
      if (!row.has(cohortMonth)) {
        row.set(cohortMonth, { revenue: 0, orderCount: 0, uniqueCustomers: 0 })
      }
      const cell = row.get(cohortMonth)!
      cell.revenue    += revenue
      cell.orderCount += 1
      cell.uniqueCustomers += 1
    })

    const orderMonths = windowMonths.filter(m => {
      const row = matrix.get(m)
      return row && row.size > 0
    })

    let maxCohortAge = 0
    orderMonths.forEach(om => {
      const row = matrix.get(om)!
      row.forEach((_, cm) => {
        const cohortDate = parse(cm, 'yyyy-MM', new Date())
        const orderDate  = parse(om, 'yyyy-MM', new Date())
        const age = (orderDate.getFullYear() - cohortDate.getFullYear()) * 12
                  + (orderDate.getMonth()    - cohortDate.getMonth())
        if (age > maxCohortAge) maxCohortAge = age
      })
    })

    return { matrix, orderMonths, maxCohortAge }
  }, [orders])

  // ── Row totals — used for row-relative percentage (all cells in a row sum to 100%) ──
  const rowTotals = useMemo(() => {
    const m = new Map<string, number>()
    orderMonths.forEach(om => {
      const row = matrix.get(om)!
      let total = 0
      row.forEach(cell => { total += metric === 'revenue' ? cell.revenue : cell.orderCount })
      m.set(om, total)
    })
    return m
  }, [matrix, orderMonths, metric])

  // ── Cell value ────────────────────────────────────────────────────────────
  // percentage = cell base / row total × 100  →  all cells in a row sum to 100%
  // per-customer = cell base / cell unique customers
  // total = raw base
  const getCellValue = useCallback((cell: CohortCell, orderMonth: string): number => {
    const base = metric === 'revenue' ? cell.revenue : cell.orderCount
    if (calcType === 'per-customer') return base / Math.max(1, cell.uniqueCustomers)
    if (calcType === 'percentage') {
      const rowTotal = rowTotals.get(orderMonth) ?? 0
      return rowTotal > 0 ? (base / rowTotal) * 100 : 0
    }
    return base
  }, [metric, calcType, rowTotals])

  const formatValue = useCallback((v: number): string => {
    if (calcType === 'percentage') return `${v.toFixed(1)}%`
    if (metric === 'revenue')      return fmtRevenue(v)
    return v.toFixed(0)
  }, [metric, calcType])

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback((e: React.MouseEvent, orderMonth: string, cohortMonth: string) => {
    setTooltip({ orderMonth, cohortMonth, x: e.clientX, y: e.clientY })
  }, [])
  const handleMouseMove = useCallback((e: React.MouseEvent, orderMonth: string, cohortMonth: string) => {
    setTooltip({ orderMonth, cohortMonth, x: e.clientX, y: e.clientY })
  }, [])
  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  // ── CSV ───────────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const headers = ['Order Month', 'Total', ...Array.from({ length: maxCohortAge + 1 }, (_, i) => `Month -${i}`)]
    let csv = headers.join(',') + '\n'
    orderMonths.forEach(om => {
      const row = matrix.get(om)!
      const rowRevenue = Array.from(row.values()).reduce((s, c) => s + c.revenue, 0)
      const rowOrders  = Array.from(row.values()).reduce((s, c) => s + c.orderCount, 0)
      const totalVal   = metric === 'revenue' ? fmtRevenue(rowRevenue) : rowOrders.toLocaleString()

      const cellsByAge = new Map<number, CohortCell>()
      row.forEach((cell, cm) => {
        const cohortDate = parse(cm, 'yyyy-MM', new Date())
        const orderDate  = parse(om, 'yyyy-MM', new Date())
        const age = (orderDate.getFullYear() - cohortDate.getFullYear()) * 12
                  + (orderDate.getMonth() - cohortDate.getMonth())
        cellsByAge.set(age, cell)
      })

      const ageCells = Array.from({ length: maxCohortAge + 1 }, (_, i) => {
        const cell = cellsByAge.get(i)
        return cell ? formatValue(getCellValue(cell, om)) : ''
      })

      csv += [fmtMonth(om), totalVal, ...ageCells].join(',') + '\n'
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `cohort-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (isLoading) return <CohortSkeleton />

  if (!orders.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-12 flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-gray-500">No cohort data available</p>
        <p className="text-xs text-gray-400">No orders found in the last 6 months</p>
      </div>
    )
  }

  const tooltipCell = tooltip
    ? matrix.get(tooltip.orderMonth)?.get(tooltip.cohortMonth)
    : null

  const headerOffsets = Array.from({ length: maxCohortAge + 1 }, (_, i) => i)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-300">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Customer Cohorts</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Last 6 months · {new Set(orders.map(o => o['buyer-email'])).size.toLocaleString()} unique customers
          </p>
        </div>
        <button onClick={downloadCSV}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Export CSV">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mr-2">Show</span>
          {(['revenue', 'orders'] as MetricType[]).map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                metric === m ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mr-2">View</span>
          {([
            ['total',        'Total'],
            ['per-customer', 'Per customer'],
            ['percentage',   'Percentage'],
          ] as [CalculationType, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setCalcType(v)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                calcType === v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {label}
            </button>
          ))}
        </div>
        {/* <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-gray-400">New customers</span>
          <div className="flex gap-0.5">
            {[0.92, 0.70, 0.52, 0.38, 0.28, 0.20].map(o => (
              <div key={o} className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(29,78,216,${o})` }} />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">Older cohorts</span>
        </div> */}
      </div>

      {/* ── Grid ── */}
      <div className="overflow-x-auto">
        <div className="p-4" style={{ minWidth: 'max-content' }}>

          {/* Column headers */}
          <div className="flex gap-1.5 mb-2">
            <div style={{ width: 88, flexShrink: 0 }} />
            <div className="shrink-0 text-center" style={{ width: 84 }}>
              <span className="text-[10px] font-semibold text-gray-700">Total</span>
              <p className="text-[9px] text-gray-400">all cohorts</p>
            </div>
            {headerOffsets.map(offset => (
              <div key={offset} className="shrink-0 text-center" style={{ width: 84 }}>
                <span className="text-[10px] font-medium text-gray-500">Month -{offset}</span>
                <p className="text-[9px] text-gray-400">
                  {offset === 0 ? 'new customers' : `${offset}mo ago`}
                </p>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-1.5">
            {orderMonths.map(om => {
              const row = matrix.get(om)!

              const cellsByAge = new Map<number, { cell: CohortCell; cohortMonth: string }>()
              row.forEach((cell, cm) => {
                const cohortDate = parse(cm, 'yyyy-MM', new Date())
                const orderDate  = parse(om, 'yyyy-MM', new Date())
                const age = (orderDate.getFullYear() - cohortDate.getFullYear()) * 12
                          + (orderDate.getMonth() - cohortDate.getMonth())
                cellsByAge.set(age, { cell, cohortMonth: cm })
              })

              const rowRevenue = Array.from(row.values()).reduce((s, c) => s + c.revenue, 0)
              const rowOrders  = Array.from(row.values()).reduce((s, c) => s + c.orderCount, 0)

              return (
                <div key={om} className="flex items-stretch gap-1.5">

                  {/* Row label */}
                  <div className="shrink-0 flex flex-col justify-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                    style={{ width: 88 }}>
                    <p className="text-xs font-semibold text-gray-700">{fmtMonth(om)}</p>
                    {/* <p className="text-[10px] text-gray-400 mt-0.5">orders</p> */}
                  </div>

                  {/* Total cell */}
                  <div className="rounded-lg flex flex-col items-center justify-center shrink-0"
                    style={{ width: 84, height: 52, backgroundColor: '#1e293b' }}>
                    <span className="text-[11px] font-semibold text-white leading-none">
                      {metric === 'revenue' ? fmtRevenue(rowRevenue) : rowOrders.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">
                      {rowOrders.toLocaleString()} orders
                    </span>
                  </div>

                  {/* Month offset cells */}
                  {headerOffsets.map(offset => {
                    const entry = cellsByAge.get(offset)

                    if (!entry) {
                      // Determine if this offset is just beyond this row's reach
                      let maxAge = 0
                      cellsByAge.forEach((_, age) => { if (age > maxAge) maxAge = age })
                      if (offset > maxAge) {
                        return <div key={offset} className="rounded-lg bg-gray-50/50"
                          style={{ width: 84, height: 52, flexShrink: 0 }} />
                      }
                      return <div key={offset} className="rounded-lg"
                        style={{ width: 84, height: 52, flexShrink: 0, border: '1.5px dashed #e5e7eb' }} />
                    }

                    const { cell, cohortMonth: cm } = entry
                    const isNew     = offset === 0
                    const isHovered = tooltip?.orderMonth === om && tooltip?.cohortMonth === cm
                    const opacity   = cellOpacity(isNew, offset)
                    const value     = getCellValue(cell, om)

                    return (
                      <div key={offset}
                        className="rounded-lg flex flex-col items-center justify-center transition-all duration-150 cursor-default"
                        style={{
                          width:           84,
                          height:          52,
                          flexShrink:      0,
                          backgroundColor: `rgba(29,78,216,${opacity})`,
                          outline:         isHovered ? '2px solid rgba(29,78,216,0.7)' : 'none',
                          outlineOffset:   '1px',
                          transform:       isHovered ? 'scale(1.04)' : 'scale(1)',
                        }}
                        onMouseEnter={e => handleMouseEnter(e, om, cm)}
                        onMouseMove={e  => handleMouseMove(e, om, cm)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <span className="text-[11px] font-semibold text-white leading-none">
                          {formatValue(value)}
                        </span>
                        <span className="text-[9px] text-blue-200/80 mt-0.5 leading-none">
                          {isNew ? 'new' : `${offset}mo ago`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-50 px-6 py-3 flex items-center gap-8">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total revenue</p>
          <p className="text-sm font-semibold text-gray-800">
            {fmtRevenue(orders.reduce((s, o) => s + (parseFloat(o['item-price']) || 0), 0))}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Returning customers</p>
          <p className="text-sm font-semibold text-gray-800">
            {(() => {
              const counts = new Map<string, number>()
              orders.forEach(o => counts.set(o['buyer-email'], (counts.get(o['buyer-email']) ?? 0) + 1))
              const returning = Array.from(counts.values()).filter(v => v > 1).length
              const total = counts.size
              return `${returning.toLocaleString()} / ${total.toLocaleString()} (${total > 0 ? ((returning / total) * 100).toFixed(1) : 0}%)`
            })()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Avg orders / customer</p>
          <p className="text-sm font-semibold text-gray-800">
            {(() => {
              const customers = new Set(orders.map(o => o['buyer-email'])).size
              return customers > 0 ? (orders.length / customers).toFixed(2) : '—'
            })()}
          </p>
        </div>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && tooltipCell && (() => {
        const cohortDate = parse(tooltip.cohortMonth, 'yyyy-MM', new Date())
        const orderDate  = parse(tooltip.orderMonth,  'yyyy-MM', new Date())
        const age        = (orderDate.getFullYear() - cohortDate.getFullYear()) * 12
                         + (orderDate.getMonth() - cohortDate.getMonth())
        const TOOLTIP_W  = 220
        const left = Math.min(
          Math.max(8, tooltip.x - TOOLTIP_W / 2),
          (typeof window !== 'undefined' ? window.innerWidth : 1200) - TOOLTIP_W - 8
        )
        const top = tooltip.y - 155

        return (
          <div className="fixed z-50 pointer-events-none" style={{ left, top, width: TOOLTIP_W }}>
            <div className="bg-gray-900 text-white rounded-lg px-3 py-2.5 text-xs shadow-2xl">
              <p className="font-semibold">{fmtMonth(tooltip.orderMonth)} revenue</p>
              <p className="text-gray-400 mt-0.5">
                from customers first acquired in {fmtMonth(tooltip.cohortMonth)}
                {age === 0 ? ' (new this month)' : ` (${age} month${age > 1 ? 's' : ''} ago)`}
              </p>
              <div className="border-t border-gray-700 mt-2 pt-2 space-y-1">
                {([
                  ['Revenue', fmtRevenue(tooltipCell.revenue)],
                  ['Orders',  String(tooltipCell.orderCount)],
                  // Always show the raw % vs global max in tooltip for transparency
                  ['% of row', (() => { const rt = rowTotals.get(tooltip.orderMonth) ?? 0; const base = tooltipCell[metric === 'revenue' ? 'revenue' : 'orderCount']; return rt > 0 ? `${((base / rt) * 100).toFixed(1)}%` : '—' })()],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium tabular-nums">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
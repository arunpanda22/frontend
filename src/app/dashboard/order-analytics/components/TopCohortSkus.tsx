import React, { useState } from 'react'
import { useCurrency } from '@/lib/context/CurrencyContext'
import type { CohortTopSku } from '@/lib/api/services/order-analytics.service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopCohortSkusProps {
  data?:      CohortTopSku[]
  isLoading?: boolean
  isError?:   boolean
  maxItems?:  number
}

// ─── Color palette ────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  'bg-gradient-to-r from-emerald-400 to-emerald-600',
  'bg-gradient-to-r from-blue-400 to-blue-600',
  'bg-gradient-to-r from-purple-400 to-purple-600',
  'bg-gradient-to-r from-orange-400 to-orange-600',
  'bg-gradient-to-r from-pink-400 to-pink-600',
  'bg-gradient-to-r from-cyan-400 to-cyan-600',
  'bg-gradient-to-r from-indigo-400 to-indigo-600',
  'bg-gradient-to-r from-teal-400 to-teal-600',
  'bg-gradient-to-r from-rose-400 to-rose-600',
  'bg-gradient-to-r from-amber-400 to-amber-600',
]

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface SkuTooltipProps {
  sku:      CohortTopSku
  children: React.ReactNode
  formatCurrency: (v: number) => string
}

function SkuTooltip({ sku, children, formatCurrency }: SkuTooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-56 bg-gray-900 text-white rounded-lg px-3 py-2.5 text-xs shadow-2xl pointer-events-none">
          <p className="font-semibold leading-snug truncate">{sku.product_name || sku.sku}</p>
          {sku.asin && <p className="text-gray-400 mt-0.5">ASIN: {sku.asin}</p>}
          <p className="text-gray-400">SKU: {sku.sku}</p>
          <div className="border-t border-gray-700 mt-2 pt-2 space-y-1">
            {([
              ['Revenue',            formatCurrency(parseFloat(sku.revenue))],
              ['Orders',             String(sku.orders)],
              ['Unique customers',   String(sku.unique_customers)],
              ['Returning',          `${sku.returning_customers} (${sku.returning_pct.toFixed(1)}%)`],
              ['Avg orders/customer',sku.avg_orders_per_customer.toFixed(2)],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-3">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium tabular-nums">{val}</span>
              </div>
            ))}
          </div>
          {/* Caret */}
          <div className="absolute -top-1.5 left-4 border-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const TopCohortSkus: React.FC<TopCohortSkusProps> = ({
  data      = [],
  isLoading = false,
  isError   = false,
  maxItems  = 10,
}) => {
  const { formatCurrencyNoDecimal } = useCurrency()

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-24 mt-1.5 animate-pulse" />
        </div>
        <div className="p-4 flex-1 space-y-3 overflow-hidden">
          {Array.from({ length: maxItems }, (_, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2 animate-pulse" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-8 animate-pulse flex-shrink-0" />
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
          <h6 className="text-sm font-semibold text-gray-900">Top SKUs — Returning Customers</h6>
          <p className="text-xs text-gray-400 mt-0.5">By revenue · % shows returning rate</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="text-gray-300 text-3xl mb-2">📦</div>
          <p className="text-gray-500 text-sm">No SKU data available for this period</p>
        </div>
      </div>
    )
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  const items = data.slice(0, maxItems)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-sm font-semibold text-gray-900">Top SKUs — Returning Customers</h6>
        <p className="text-xs text-gray-400 mt-0.5">By revenue · hover for details</p>
      </div>

      {/* Scrollable list — grows to fill remaining height, never overflows card */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-3">
        {items.map((sku, index) => (
          <SkuTooltip
            key={sku.sku}
            sku={sku}
            formatCurrency={formatCurrencyNoDecimal}
          >
            <div className="cursor-default">

              {/* Row */}
              <div className="flex items-center gap-2 mb-1">

                {/* Image */}
                <div className="w-7 h-7 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                  {sku.image_url ? (
                    <img
                      src={sku.image_url}
                      alt={sku.product_name || sku.sku}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-semibold">
                      {(sku.product_name || sku.sku).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name — single line, truncated */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate leading-tight">
                    {sku.product_name || sku.sku}
                  </p>
                  {/* ONE concise meta line — no wrapping */}
                  <p className="text-[10px] text-gray-400 truncate leading-tight">
                    {formatCurrencyNoDecimal(parseFloat(sku.revenue))}
                    {' · '}
                    {sku.avg_orders_per_customer.toFixed(2)} ord/cust
                  </p>
                </div>

                {/* Returning % — right-aligned, fixed width */}
                <span className="text-xs font-semibold text-gray-800 flex-shrink-0 w-10 text-right tabular-nums">
                  {sku.returning_pct.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar — no left margin, full width of content area */}
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${COLOR_PALETTE[index % COLOR_PALETTE.length]}`}
                  style={{ width: `${Math.min(sku.returning_pct, 100)}%` }}
                />
              </div>

            </div>
          </SkuTooltip>
        ))}
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-shrink-0">
          <p className="text-red-700 text-xs">Failed to load SKU data</p>
        </div>
      )}

    </div>
  )
}

export default TopCohortSkus
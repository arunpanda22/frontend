'use client'

import React, { useMemo, useState } from 'react'
import FilterBar from '../../../components/dashboard/ui/FilterBar'
import { DateRangeProvider, useDateRange } from '@/lib/context/DateRangeContext'
import type { Range } from 'react-date-range'
import { RevenueMap } from './components/RevenueMap'
import { CohortTable } from './components/CohortTable'
import TopCohortSkus from './components/TopCohortSkus'
import { AdsHeatmap } from './components/AdsHeatmap'
import { WeekdaySalesChart } from './components/WeekdaySalesChart'
import { useWeekdaySales }    from '@/lib/hooks/queries/use-order-analytics'
import MetricsCard from '@/components/dashboard/ui/MetricsCard'
import { useRevenueMap, useCohortOrders, useCohortTopSkus } from '@/lib/hooks/queries/use-order-analytics'
import {
  Users,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
} from 'lucide-react'
import type { CohortOrder } from '@/lib/api/services/order-analytics.service'

// ─── Cohort metric derivations ────────────────────────────────────────────────

interface CohortMetrics {
  totalRevenue:          number
  avgLTV:                number
  avgOrdersPerCustomer:  number
  retentionRate:         number
  uniqueCustomers:       number
  totalOrders:           number
}

function deriveCohortMetrics(orders: CohortOrder[]): CohortMetrics {
  if (!orders.length) {
    return { totalRevenue: 0, avgLTV: 0, avgOrdersPerCustomer: 0, retentionRate: 0, uniqueCustomers: 0, totalOrders: 0 }
  }

  const orderCountByEmail = new Map<string, number>()
  let totalRevenue = 0

  orders.forEach(o => {
    totalRevenue += parseFloat(o['item-price']) || 0
    orderCountByEmail.set(
      o['buyer-email'],
      (orderCountByEmail.get(o['buyer-email']) ?? 0) + 1
    )
  })

  const uniqueCustomers      = orderCountByEmail.size
  const totalOrders          = orders.length
  const returningCount       = Array.from(orderCountByEmail.values()).filter(v => v > 1).length

  return {
    totalRevenue,
    avgLTV:               uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0,
    avgOrdersPerCustomer: uniqueCustomers > 0 ? totalOrders  / uniqueCustomers : 0,
    retentionRate:        uniqueCustomers > 0 ? (returningCount / uniqueCustomers) * 100 : 0,
    uniqueCustomers,
    totalOrders,
  }
}

function fmtRevenue(v: number): string {
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`
  return `₹${v.toFixed(0)}`
}

// ─── Metric cards row ─────────────────────────────────────────────────────────

function CohortMetricsRow({ orders, isLoading }: { orders: CohortOrder[]; isLoading: boolean }) {
  const m = useMemo(() => deriveCohortMetrics(orders), [orders])

  const cards = [
    {
      title:    'Average LTV',
      value:    isLoading ? '—' : fmtRevenue(m.avgLTV),
      icon:     IndianRupee,
      bgColor:  "bg-white",
      color:    "bg-ocean-300",
      subtitle: 'Revenue per unique customer',
    },
    {
      title:    'Total Revenue',
      value:    isLoading ? '—' : fmtRevenue(m.totalRevenue),
      icon:     TrendingUp,
      bgColor:  "bg-white",
      color:    "bg-gold-400",
      subtitle: 'Last 6 months',
    },
    {
      title:    'Orders / Customer',
      value:    isLoading ? '—' : m.avgOrdersPerCustomer.toFixed(2),
      icon:     ShoppingCart,
      bgColor:  "bg-white",
      color:    "bg-ocean-300",
      subtitle: 'Avg across all customers',
    },
    {
      title:    'Retention Rate',
      value:    isLoading ? '—' : `${m.retentionRate.toFixed(1)}%`,
      icon:     RefreshCw,
      bgColor:  "bg-white",
      color:    "bg-gold-400",
      subtitle: 'Customers with > 1 order',
    },
    {
      title:    'Unique Customers',
      value:    isLoading ? '—' : m.uniqueCustomers.toLocaleString(),
      icon:     Users,
      bgColor:  "bg-white",
      color:    "bg-ocean-300",
      subtitle: 'Last 6 months',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <MetricsCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          bgColor={card.bgColor}
          color={card.color}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrderAnalyticsPage = () => {
  const { dateRange, updateCustomDates } = useDateRange()

  const [asinFilter, setAsinFilter] = useState<string | undefined>(undefined)

  const analyticsParams = {
    date_from: dateRange.startDate ?? undefined,
    date_to:   dateRange.endDate   ?? undefined,
    ...(asinFilter ? { asin: asinFilter } : {}),  // only include when set
  }

  const handleAsinChange = (asin: string) => {
    setAsinFilter(asin || undefined)
  }

  const hasDateRange  = !!dateRange.startDate && !!dateRange.endDate
  const revenueMap    = useRevenueMap(analyticsParams, hasDateRange)
  const cohortOrders  = useCohortOrders()
  const cohortTopSkus = useCohortTopSkus()

  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate:   dateRange.endDate   ? new Date(dateRange.endDate)   : undefined,
    key: 'selection' as const,
  }

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
      const fmt = (d: Date) => {
        const y   = d.getFullYear()
        const m   = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      updateCustomDates(fmt(newRange.startDate), fmt(newRange.endDate))
    }
  }

  const weekdaySales = useWeekdaySales(
    hasDateRange ? analyticsParams : undefined,
    true   // always fetch — falls back to all-time when no date range selected
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full transition-all duration-300 space-y-6">

        <FilterBar
          title="Order Analytics"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* ── Cohort metrics summary ── */}
        <CohortMetricsRow
          orders={cohortOrders.data?.orders ?? []}
          isLoading={cohortOrders.isLoading}
        />

        {/* ── Cohort table (2/3) + Top SKUs card (1/3) ── */}
        <div className="flex gap-6 items-stretch">
          <div className="flex-[2] min-w-0 overflow-hidden">
            {cohortOrders.isError ? (
              <div className="bg-red-50 border border-red-100 rounded-xl px-6 py-4 text-sm text-red-500">
                Failed to load cohort data. Please try again.
              </div>
            ) : (
              <CohortTable
                orders={cohortOrders.data?.orders ?? []}
                isLoading={cohortOrders.isLoading}
              />
            )}
          </div>

          <div className="flex-[1] min-w-0">
            <TopCohortSkus
              data={cohortTopSkus.data?.skus}
              isLoading={cohortTopSkus.isLoading}
              isError={cohortTopSkus.isError}
            />
          </div>
        </div>

        {/* ── Revenue Map ── */}
        {revenueMap.isError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-6 py-4 text-sm text-red-500">
            Failed to load revenue map. Please try again.
          </div>
        ) : (
          <RevenueMap
            data={revenueMap.data ?? { total_revenue: 0, total_orders: 0, min_revenue: 0, max_revenue: 0, states: [] }}
            params={analyticsParams}
            onAsinChange={handleAsinChange}   
            isLoading={revenueMap.isLoading}
          />
        )}

        {/* ── Ads Performance Heatmap ── */}
        {/* No date props — component uses its own rolling 7-day window */}
        <div className="flex gap-6 items-stretch">
          {/* Heatmap — takes ~2/3 */}
          <div className="flex-[2] min-w-0">
            <AdsHeatmap />
          </div>

          {/* Weekday bar chart — takes ~1/3 */}
          <div className="flex-[1] min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Sales by Day of Week</h3>
              <p className="text-xs text-slate-400 mt-0.5">% share of total revenue</p>
            </div>
            <div className="flex-1 min-h-0">
              <WeekdaySalesChart
                days={weekdaySales.data?.days ?? []}
                isLoading={weekdaySales.isLoading}
                isError={weekdaySales.isError}
                metric="revenue"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderAnalyticsLayout() {
  return (
    <DateRangeProvider>
      <OrderAnalyticsPage />
    </DateRangeProvider>
  )
}
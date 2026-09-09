'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import type { WeekdaySalesDay } from '@/lib/api/services/order-analytics.service'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Props {
  days:      WeekdaySalesDay[]
  isLoading: boolean
  isError:   boolean
  metric?:   'revenue' | 'orders'
}

const SKELETON_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeekdaySalesChart({ days, isLoading, isError, metric = 'revenue' }: Props) {
  // Sort by day_index so bars always run Sun→Sat
  const sorted = useMemo(
    () => [...days].sort((a, b) => a.day_index - b.day_index),
    [days]
  )

  const { categories, pctValues, absValues } = useMemo(() => {
    const sorted = [...days].sort((a, b) => a.day_index - b.day_index)
    return {
        categories: sorted.map(d => d.day.slice(0, 3)),
        pctValues:  sorted.map(d =>
        metric === 'revenue'
            ? parseFloat(String(d.revenue_pct))
            : parseFloat(String(d.orders_pct))
        ),
        absValues: sorted.map(d =>
        metric === 'revenue' ? Number(d.revenue) : d.orders
        ),
    }
    }, [days, metric])
  

  const options: ApexOptions = {
    chart: {
      type:    'bar',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 400 },
    },
    plotOptions: {
      bar: {
        horizontal:   true,
        borderRadius: 4,
        barHeight:    '58%',
        distributed:  false,
      },
    },
    colors: ['#3b82f6'],   // Tailwind blue-500 — matches AdsHeatmap palette
    dataLabels: {
      enabled:   true,
      formatter: (val: number) => `${val}%`,
      style: {
        fontSize:    '11px',
        fontFamily:  'Montserrat, sans-serif',
        fontWeight:  '600',
        colors:      ['#fff'],
      },
      offsetX: -4,
    },
    xaxis: {
      categories,
      labels: {
        formatter: (val: string) => `${val}%`,
        style: { fontSize: '11px', fontFamily: 'Montserrat, sans-serif', colors: '#64748b' },
      },
      axisBorder: { show: false },
      axisTicks:  { show: false },
      max: 25,   // percentages never exceed ~25% for 7 days; keeps bars readable
    },
    yaxis: {
      labels: {
        style: {
          fontSize:   '12px',
          fontFamily: 'Montserrat, sans-serif',
          colors:     '#334155',
          fontWeight: '500',
        },
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: true  } },
      yaxis: { lines: { show: false } },
      padding: { left: 0, right: 12 },
    },
    tooltip: {
      theme: 'light',
      style: { fontFamily: 'Montserrat, sans-serif' },
      y: {
        formatter: (_pct, { dataPointIndex }) => {
          const abs = absValues[dataPointIndex]
          const pct = pctValues[dataPointIndex]
          if (metric === 'revenue') {
            const fmt = abs >= 1_000_000
              ? `₹${(abs / 1_000_000).toFixed(2)}M`
              : abs >= 1_000
              ? `₹${(abs / 1_000).toFixed(1)}K`
              : `₹${abs.toFixed(0)}`
            return `${fmt} (${pct}%)`
          }
          return `${abs.toLocaleString()} orders (${pct}%)`
        },
        title: { formatter: () => '' },
      },
    },
    states: {
        hover:  { filter: { type: 'lighten' } },
        active: { filter: { type: 'darken'  } },
    },
  }

  const series = [{ name: metric === 'revenue' ? 'Revenue share' : 'Order share', data: pctValues }]

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center gap-3 px-2 py-1 h-full">
        {SKELETON_DAYS.map(d => (
          <div key={d} className="flex items-center gap-2">
            <span className="w-7 text-xs text-slate-400 font-medium shrink-0">{d}</span>
            <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
          </div>
        ))}
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-400">
        Failed to load weekday data.
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!days.length) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        No data for selected period.
      </div>
    )
  }

  return (
    <ReactApexChart
      type="bar"
      series={series}
      options={options}
      height="100%"
      width="100%"
    />
  )
}
'use client'

import { useState } from 'react'
import { Box, Boxes } from 'lucide-react'
import { AutoTargetingForm } from './AutoTargetingForm'

// ── Types ─────────────────────────────────────────────────────────────────────

type AsinVariant = 'single' | 'multi'

// ── Mode toggle ───────────────────────────────────────────────────────────────

function VariantToggle({
  variant,
  onChange,
}: {
  variant:  AsinVariant
  onChange: (v: AsinVariant) => void
}) {
  return (
    <div className="flex gap-1.5">
      {([
        { value: 'single' as AsinVariant, label: 'Single ASIN', sublabel: '1 product', icon: Box },
        { value: 'multi'  as AsinVariant, label: 'Multi ASIN',  sublabel: '2+ products', icon: Boxes },
      ] as const).map((opt) => {
        const Icon     = opt.icon
        const isActive = variant === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              flex items-center gap-2 rounded-xl border px-4 py-2.5
              transition-all duration-150
              ${isActive
                ? 'border-indigo-300 bg-indigo-600 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}
            `}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <div className="text-left">
              <p className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>
                {opt.label}
              </p>
              <p className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                {opt.sublabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AutoTargetingPage() {
  const [variant, setVariant] = useState<AsinVariant>('single')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
      <AutoTargetingForm variant={variant} onVariantChange={setVariant} />
    </div>
  )
}
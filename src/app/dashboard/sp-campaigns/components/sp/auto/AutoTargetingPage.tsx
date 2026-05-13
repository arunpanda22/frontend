'use client'

import { useState } from 'react'
import { FileText, ClipboardList } from 'lucide-react'
import { AutoTargetingForm } from './AutoTargetingForm'
import { BulkAutoSection } from './BulkAutoSection'

// ── Types ─────────────────────────────────────────────────────────────────────

type AsinVariant  = 'single' | 'multi'
type CreationMode = 'individual' | 'bulk'

// ── Mode toggle ───────────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode:     CreationMode
  onChange: (m: CreationMode) => void
}) {
  return (
    <div className="flex gap-1.5">
      {([
        { value: 'individual' as CreationMode, label: 'Individual',  sublabel: 'One at a time',    icon: FileText      },
        { value: 'bulk'       as CreationMode, label: 'Bulk Paste',  sublabel: 'Many from Excel',  icon: ClipboardList },
      ] as const).map((opt) => {
        const Icon     = opt.icon
        const isActive = mode === opt.value
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
  const [mode,    setMode]    = useState<CreationMode>('individual')
  const [variant, setVariant] = useState<AsinVariant>('single')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">

      {/* Mode toggle */}
      <ModeToggle mode={mode} onChange={setMode} />

      {/* Content */}
      {mode === 'individual'
        ? <AutoTargetingForm variant={variant} onVariantChange={setVariant} />
        : <BulkAutoSection />
      }

    </div>
  )
}
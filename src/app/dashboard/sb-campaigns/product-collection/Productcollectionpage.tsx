'use client'

import { useState } from 'react'
import { ProductCollectionBulkSection } from './ProductCollectionBulkSection'
import { ProductCollectionForm } from './ProductCollectionForm'

type Mode = 'individual' | 'bulk'

export function ProductCollectionPage() {
  const [mode, setMode] = useState<Mode>('individual')
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {([
          { value: 'individual' as Mode, label: 'Individual',  sub: 'Create a single campaign with full control' },
          { value: 'bulk'       as Mode, label: 'Bulk Paste',  sub: 'Paste from Excel to create multiple campaigns' },
        ]).map((m) => (
          <button key={m.value} type="button" onClick={() => setMode(m.value)}
            className={`flex flex-col rounded-xl border px-5 py-3 text-left transition-all duration-150
              ${mode === m.value ? 'border-indigo-300 bg-indigo-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <p className={`text-xs font-semibold leading-none ${mode === m.value ? 'text-white' : 'text-slate-700'}`}>{m.label}</p>
            <p className={`text-[10px] leading-none mt-1 ${mode === m.value ? 'text-indigo-200' : 'text-slate-400'}`}>{m.sub}</p>
          </button>
        ))}
      </div>
      {mode === 'individual' && <ProductCollectionForm />}
      {mode === 'bulk'       && <ProductCollectionBulkSection />}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { ContextualTypeToggle, type ContextualType } from '../shared/SDFormComponents'
import { SDContextualProductForm }   from './SDContextualProductForm'
import { SDContextualCategoryForm }  from './SDContextualCategoryForm'
import { SDContextualBulkSection }   from './SDContextualBulkSection'

type View = 'form' | 'bulk'

const VIEW_TABS: { value: View; label: string }[] = [
  { value: 'form', label: 'Single Campaign' },
  { value: 'bulk', label: 'Bulk Create'     },
]

export function SDContextualPage() {
  const [contextualType, setContextualType] = useState<ContextualType>('product')
  const [view,           setView]           = useState<View>('form')

  return (
    <div className="flex flex-col gap-5">
      {/* Contextual type toggle */}
      <ContextualTypeToggle value={contextualType} onChange={setContextualType} />

      {/* Single / Bulk tab row */}
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {VIEW_TABS.map((t) => (
          <button key={t.value} type="button" onClick={() => setView(t.value)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors
              ${view === t.value
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'form' && contextualType === 'product'  && <SDContextualProductForm />}
      {view === 'form' && contextualType === 'category' && <SDContextualCategoryForm />}
      {view === 'bulk' && <SDContextualBulkSection contextualType={contextualType} />}
    </div>
  )
}
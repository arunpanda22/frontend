'use client'

import { useState } from 'react'
import { SDRetargetForm }        from './SDRetargetForm'
import { SDRetargetBulkSection } from './SDRetargetBulkSection'

type View = 'form' | 'bulk'

export function SDRetargetPage() {
  const [view, setView] = useState<View>('form')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {(['form', 'bulk'] as View[]).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors
              ${view === v
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-700'}`}>
            {v === 'form' ? 'Single Campaign' : 'Bulk Create'}
          </button>
        ))}
      </div>
      {view === 'form' && <SDRetargetForm />}
      {view === 'bulk' && <SDRetargetBulkSection />}
    </div>
  )
}
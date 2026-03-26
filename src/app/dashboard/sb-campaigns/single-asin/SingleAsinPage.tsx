'use client'

import { useState } from 'react'
import { SBVSingleAsinKeywordPage } from './keyword-targeting/Sbvsingleasinkeywordpage'
import { SBVSingleAsinProductpage } from './product-targeting/SBVSingleAsinProductpage'
import { SBVCategoryPage } from './category-targeting/SBVCategorypage'

type SubTab = 'keyword' | 'product' | 'category'

const TABS: { value: SubTab; label: string; description: string }[] = [
  { value: 'keyword',  label: 'Keyword Targeting',  description: 'Video ad — target shoppers by keywords with individual bids' },
  { value: 'product',  label: 'Product Targeting',  description: 'Video ad — target shoppers browsing competitor or related ASINs' },
  { value: 'category', label: 'Category Targeting', description: 'Video ad — target shoppers browsing an entire category' },
]

export function SingleAsinPage() {
  const [tab, setTab] = useState<SubTab>('keyword')

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tab picker */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`flex flex-col rounded-xl border px-5 py-3 text-left transition-all duration-150
              ${tab === t.value
                ? 'border-indigo-300 bg-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <p className={`text-xs font-semibold leading-none ${tab === t.value ? 'text-white' : 'text-slate-700'}`}>
              {t.label}
            </p>
            <p className={`text-[10px] leading-none mt-1 ${tab === t.value ? 'text-indigo-200' : 'text-slate-400'}`}>
              {t.description}
            </p>
          </button>
        ))}
      </div>

      {tab === 'keyword'  && <SBVSingleAsinKeywordPage />}
      {tab === 'product'  && <SBVSingleAsinProductpage />}
      {tab === 'category' && <SBVCategoryPage/>}
    </div>
  )
}
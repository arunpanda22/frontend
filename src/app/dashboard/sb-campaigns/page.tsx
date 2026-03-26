'use client'

import { useState } from 'react'
import { ProductCollectionForm } from './product-collection/ProductCollectionForm'
import { SingleAsinPage } from './single-asin/SingleAsinPage'
import { StoreSpotlightPage } from './store-spotlight/StoreSpotlightPage'

type Tab = 'collection' | 'spotlight' | 'single'

const TABS: { value: Tab; label: string; sublabel: string }[] = [
  { value: 'single',     label: 'Single ASIN',         sublabel: 'Video ad — keyword, product or category targeting' },
  { value: 'collection', label: 'Product Collection',  sublabel: 'Brand logo + image — keyword targeting' },
  { value: 'spotlight',  label: 'Store Spotlight',     sublabel: 'Store page — keyword targeting'         },
]

export default function SBCampaignPage() {
  const [tab, setTab] = useState<Tab>('collection')

  return (
    <div className="flex flex-col gap-6 m-12">
      {/* Tab row */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`flex flex-col rounded-xl border px-5 py-3 text-left transition-all duration-150
              ${tab === t.value
                ? 'border-indigo-300 bg-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <p className={`text-xs font-semibold leading-none ${tab === t.value ? 'text-white' : 'text-slate-700'}`}>
              {t.label}
            </p>
            <p className={`text-[10px] leading-none mt-1 ${tab === t.value ? 'text-indigo-200' : 'text-slate-400'}`}>
              {t.sublabel}
            </p>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'single'     && <SingleAsinPage />}
      {tab === 'collection' && <ProductCollectionForm />}
      {tab === 'spotlight'  && <StoreSpotlightPage />}
    </div>
  )
}
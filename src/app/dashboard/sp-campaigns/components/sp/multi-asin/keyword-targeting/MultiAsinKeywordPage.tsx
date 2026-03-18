'use client'

import type { CampaignMode } from '../MultiAsinPage'
import { IndividualForm } from './IndividualForm'

interface Props {
  mode: CampaignMode
}

export function MultiAsinKeywordPage({ mode }: Props) {
  // Bulk for multi-asin keyword — coming soon
  if (mode === 'bulk') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-24 shadow-sm text-center">
        <p className="text-sm font-semibold text-slate-700">Bulk Upload</p>
        <p className="mt-1 text-xs text-slate-400 max-w-xs">
          Bulk creation for Multi ASIN Keyword campaigns is coming soon.
        </p>
      </div>
    )
  }

  return <IndividualForm />
}
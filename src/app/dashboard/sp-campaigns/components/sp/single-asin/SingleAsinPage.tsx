'use client'

import { useState } from 'react'
import {
  Search, Target, LayoutGrid,
  FileText, TableProperties,
  ArrowLeft, type LucideProps,
} from 'lucide-react'
import { SingleAsinKeywordPage } from './keyword-targeting/SingleAsinKeywordPage'
import { SingleAsinProductPage } from './product-targeting/SingleAsinProductPage'
import { CategoryForm }           from './category-targeting/CategoryForm'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SingleAsinSubtype = 'keyword' | 'product' | 'category'
export type CampaignMode      = 'individual' | 'bulk'

interface SubtypeTab {
  id:          SingleAsinSubtype
  label:       string
  sublabel:    string
  icon:        React.ComponentType<LucideProps>
}

// ── Config ────────────────────────────────────────────────────────────────────

const SUBTYPES: SubtypeTab[] = [
  {
    id:       'keyword',
    label:    'Keyword Targeting',
    sublabel: 'SK · MK',
    icon:     Search,
  },
  {
    id:       'product',
    label:    'Product Targeting',
    sublabel: 'SPT · MPT',
    icon:     Target,
  },
  {
    id:       'category',
    label:    'Category Targeting',
    sublabel: 'SCT · MCT',
    icon:     LayoutGrid,
  },
]

// ── Subtype tab bar ───────────────────────────────────────────────────────────

function SubtypeTabBar({
  selected,
  onSelect,
}: {
  selected: SingleAsinSubtype | null
  onSelect: (id: SingleAsinSubtype) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {SUBTYPES.map((tab) => {
        const Icon     = tab.icon
        const isActive = selected === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`
              flex items-center gap-2 rounded-xl border px-4 py-2.5
              transition-all duration-150
              ${isActive
                ? 'border-indigo-300 bg-indigo-600 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
            `}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <div className="text-left">
              <p className={`text-sm font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>
                {tab.label}
              </p>
              <p className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                {tab.sublabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Mode Picker ───────────────────────────────────────────────────────────────

function ModePicker({ onSelect }: { onSelect: (mode: CampaignMode) => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <p className="text-sm font-semibold text-slate-800">How would you like to create campaigns?</p>
        <p className="text-xs text-slate-400 mt-0.5">Choose a creation method to continue</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('individual')}
          className="group flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-indigo-100">
            <FileText className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Individual</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Fill in a form to create one campaign at a time
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('bulk')}
          className="group flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-indigo-100">
            <TableProperties className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Bulk Upload</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Paste data from Excel to create dozens of campaigns at once
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SingleAsinPage() {
  const [selectedSubtype, setSelectedSubtype] = useState<SingleAsinSubtype | null>(null)
  const [selectedMode,    setSelectedMode]    = useState<CampaignMode | null>(null)

  // Category goes straight to the form — no bulk mode needed
  const DIRECT_TO_FORM: SingleAsinSubtype[] = ['category']

  const showForm = selectedSubtype !== null &&
    (selectedMode !== null || DIRECT_TO_FORM.includes(selectedSubtype))

  function handleSubtypeSelect(id: SingleAsinSubtype) {
    if (selectedSubtype === id && !showForm) return  // already selected, waiting for mode
    setSelectedSubtype(id)
    setSelectedMode(DIRECT_TO_FORM.includes(id) ? 'individual' : null)
  }

  function handleBack() {
    if (selectedMode !== null && !DIRECT_TO_FORM.includes(selectedSubtype!)) {
      setSelectedMode(null)
    } else {
      setSelectedSubtype(null)
      setSelectedMode(null)
    }
  }

  const activeTab = SUBTYPES.find((t) => t.id === selectedSubtype) ?? null

  return (
    <div className="mx-8 px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">

      {/* Tab bar — always visible */}
      <div className="flex flex-col gap-1">
        <SubtypeTabBar selected={selectedSubtype} onSelect={handleSubtypeSelect} />
        {selectedSubtype && !showForm && (
          <p className="text-[11px] text-slate-400 pl-1 mt-0.5">
            {activeTab?.label} · Select creation method below
          </p>
        )}
      </div>

      {/* Content */}
      {!selectedSubtype ? (
        // ── Nothing selected yet ───────────────────────────────────────────────
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-400">Select a targeting type above to get started</p>
        </div>
      ) : showForm ? (
        // ── Form ──────────────────────────────────────────────────────────────
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Single ASIN</span>
              <span>·</span>
              <span className="text-slate-600 font-medium">{activeTab?.label}</span>
              {!DIRECT_TO_FORM.includes(selectedSubtype) && (
                <>
                  <span>·</span>
                  <span className="capitalize text-slate-600 font-medium">{selectedMode}</span>
                </>
              )}
            </div>
          </div>

          {selectedSubtype === 'keyword'  && <SingleAsinKeywordPage mode={selectedMode!} />}
          {selectedSubtype === 'product'  && <SingleAsinProductPage mode={selectedMode!} />}
          {selectedSubtype === 'category' && <CategoryForm />}
        </>
      ) : (
        // ── Mode picker ────────────────────────────────────────────────────────
        <ModePicker onSelect={(mode) => setSelectedMode(mode)} />
      )}
    </div>
  )
}
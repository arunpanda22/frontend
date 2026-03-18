'use client'

import type { GroupingMode } from '@/lib/hooks/campaignCreationHooks'

interface GroupingToggleProps {
  mode:     GroupingMode
  onChange: (mode: GroupingMode) => void
  groupedLabel:    string
  groupedSublabel: string
  /** When true, the grouped option is greyed out and unselectable */
  disableGrouped?: boolean
}

export function GroupingToggle({ mode, onChange, groupedLabel, groupedSublabel, disableGrouped }: GroupingToggleProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
        Campaign mode
      </span>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="grouping-mode"
            value="individual"
            checked={mode === 'individual'}
            onChange={() => onChange('individual')}
            className="h-3.5 w-3.5 accent-indigo-600 cursor-pointer"
          />
          <div>
            <p className={`text-xs font-semibold leading-none transition-colors ${mode === 'individual' ? 'text-indigo-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
              Individual
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
              One target per campaign
            </p>
          </div>
        </label>

        <label className={`flex items-center gap-2 ${disableGrouped ? 'cursor-not-allowed opacity-40' : 'cursor-pointer group'}`}>
          <input
            type="radio"
            name="grouping-mode"
            value="grouped"
            checked={mode === 'grouped'}
            disabled={disableGrouped}
            onChange={() => !disableGrouped && onChange('grouped')}
            className="h-3.5 w-3.5 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
          />
          <div>
            <p className={`text-xs font-semibold leading-none transition-colors ${mode === 'grouped' && !disableGrouped ? 'text-indigo-700' : 'text-slate-700'}`}>
              {groupedLabel}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
              {disableGrouped ? 'No groupable ASINs in current data' : groupedSublabel}
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
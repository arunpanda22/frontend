'use client'

import { useCampaignCreationStore } from "@/lib/store/campaignCreationStore"
import { NumberInput, Select, DatePicker } from '../../../shared/FormFields'

const DYNAMIC_BIDDING_OPTIONS = [
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'MANUAL',           label: 'Manual'           },
]

export function SharedSettingsPanel() {
  const { sharedDefaults, setSharedDefault } = useCampaignCreationStore()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Shared Defaults</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Applied to all pasted rows — editable per row in the table
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Select
          label="Bidding Strategy"
          options={DYNAMIC_BIDDING_OPTIONS}
          value={sharedDefaults.dynamic_bidding}
          onChange={(e) =>
            setSharedDefault('dynamic_bidding', e.target.value as typeof sharedDefaults.dynamic_bidding)
          }
        />
        <DatePicker
          label="Start Date"
          value={sharedDefaults.start_date}
          onChange={(v) => setSharedDefault('start_date', v)}
        />
        {/* Placement adjustments — compact inline labels */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2 grid grid-cols-2 gap-3">
          <NumberInput
            label="TOS %"
            value={sharedDefaults.TOS_bidding}
            min={0}
            max={900}
            onChange={(e) => setSharedDefault('TOS_bidding', Number(e.target.value))}
          />
          <NumberInput
            label="ROS %"
            value={sharedDefaults.ROS_bidding}
            min={0}
            max={900}
            onChange={(e) => setSharedDefault('ROS_bidding', Number(e.target.value))}
          />
          <NumberInput
            label="PP %"
            value={sharedDefaults.PP_bidding}
            min={0}
            max={900}
            onChange={(e) => setSharedDefault('PP_bidding', Number(e.target.value))}
          />
          <NumberInput
            label="AB %"
            value={sharedDefaults.AB_bidding}
            min={0}
            max={900}
            onChange={(e) => setSharedDefault('AB_bidding', Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
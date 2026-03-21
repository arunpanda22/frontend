'use client'

import type { CampaignMode } from '../MultiAsinPage'
import { IndividualForm }    from './IndividualForm'
import { BulkPasteSection }  from './BulkPasteSection'
import { SharedSettingsPanel } from '../SharedSettingsPanel'

interface Props { mode: CampaignMode }

export function MultiAsinProductPage({ mode }: Props) {
  if (mode === 'bulk') {
    return (
      <div className="flex flex-col gap-6">
        <SharedSettingsPanel />
        <BulkPasteSection />
      </div>
    )
  }
  return <IndividualForm />
}
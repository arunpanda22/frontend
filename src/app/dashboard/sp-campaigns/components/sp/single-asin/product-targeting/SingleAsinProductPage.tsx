'use client'

import type { CampaignMode } from '../SingleAsinPage'
import { SharedSettingsPanel } from './SharedSettingsPanel'
import { IndividualForm } from './IndividualForm'
import { BulkPasteSection } from './BulkPasteSection'

interface SingleAsinSPPageProps {
  mode: CampaignMode
}

export function SingleAsinProductPage({ mode }: SingleAsinSPPageProps) {
  return (
    <div className="flex flex-col gap-6">
      {mode === 'individual' ? (
        <IndividualForm />
      ) : (
        <>
          <SharedSettingsPanel />
          <BulkPasteSection />
        </>
      )}
    </div>
  )
}
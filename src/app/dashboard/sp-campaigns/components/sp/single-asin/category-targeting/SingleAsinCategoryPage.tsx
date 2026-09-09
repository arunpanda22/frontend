'use client'

import type { CampaignMode } from '../SingleAsinPage'
import { SharedSettingsPanel } from '../keyword-targeting/SharedSettingsPanel'
import { CategoryForm } from './CategoryForm'
import { CategoryBulkPasteSection } from './CategoryBulkPasteSection'

interface CategoryPageProps {
  mode: CampaignMode
}

export function SingleAsinCategoryPage({ mode }: CategoryPageProps) {
  return (
    <div className="flex flex-col gap-6">
      {mode === 'individual' ? (
        <CategoryForm />
      ) : (
        <>
          <SharedSettingsPanel />
          <CategoryBulkPasteSection />
        </>
      )}
    </div>
  )
}
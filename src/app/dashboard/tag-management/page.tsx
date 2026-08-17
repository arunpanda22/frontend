// app/dashboard/tag-management/page.tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Pencil, X, Upload, Loader2, Tag as TagIcon } from 'lucide-react'
import {
  EntityType,
  TagType,
  useTagTypesQuery,
  useEntityTagsQuery,
  useRenameTagTypeMutation,
  useDeleteTagTypeMutation,
  useApplyTagMutation,
} from '@/lib/hooks/queries/use-entity-tags'
import { BulkUploadModal } from './components/BulkUploadModal'
import { AddTagTypeModal } from './components/AddTagTypeModal'
import { EditableTagCell } from './components/EditableTagCell'

const ENTITY_TABS: { label: string; value: EntityType }[] = [
  { label: 'ASINs', value: 'ASIN' },
  { label: 'Campaigns', value: 'CAMPAIGN' },
  { label: 'Targets', value: 'TARGET' },
]

export default function TagManagementPage() {
  const searchParams = useSearchParams()
  const initialEntity = (searchParams.get('entity') as EntityType) || 'ASIN'

  const [activeEntity, setActiveEntity] = useState<EntityType>(initialEntity)
  const [showAddTagType, setShowAddTagType] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const { data: tagTypes = [], isLoading: tagTypesLoading } = useTagTypesQuery(activeEntity)
  const { data: entityTags = [], isLoading: tagsLoading } = useEntityTagsQuery(activeEntity)

  const renameTagType = useRenameTagTypeMutation(activeEntity)
  const deleteTagType = useDeleteTagTypeMutation(activeEntity)
  const applyTag = useApplyTagMutation(activeEntity)

  const loading = tagTypesLoading || tagsLoading

  async function handleCellSave(entityKey: string, tagTypeName: string, value: string) {
    await applyTag.mutateAsync({ entity_key: entityKey, tags: { [tagTypeName]: value } })
  }

  async function handleRenameCommit(tagType: TagType) {
    if (renameValue.trim() && renameValue !== tagType.name) {
      await renameTagType.mutateAsync({ id: tagType.id, name: renameValue.trim() })
    }
    setRenamingId(null)
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-8 py-10 font-montserrat">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a2b3c]">Tag Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Define tag columns and assign values for ASINs, campaigns, and targets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1a2b3c] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a2b3c]/90"
          >
            <Upload className="size-4" /> Bulk Upload
          </button>
        </header>

        <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {ENTITY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveEntity(tab.value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                activeEntity === tab.value
                  ? 'bg-[#1a2b3c] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Entity</th>
                    {tagTypes.map((tagType) => (
                      <th key={tagType.id} className="px-4 py-3 font-medium">
                        {renamingId === tagType.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameCommit(tagType)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameCommit(tagType)}
                            className="w-28 rounded border border-slate-300 px-1.5 py-0.5 text-xs normal-case"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            {tagType.name}
                            {!tagType.is_system && (
                              <>
                                <button
                                  onClick={() => {
                                    setRenamingId(tagType.id)
                                    setRenameValue(tagType.name)
                                  }}
                                  aria-label={`Rename ${tagType.name}`}
                                >
                                  <Pencil className="size-3 text-slate-400 hover:text-slate-700" />
                                </button>
                                <button
                                  onClick={() => deleteTagType.mutate(tagType.id)}
                                  aria-label={`Remove ${tagType.name}`}
                                >
                                  <X className="size-3 text-slate-400 hover:text-rose-600" />
                                </button>
                              </>
                            )}
                          </span>
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3">
                      <button
                        onClick={() => setShowAddTagType(true)}
                        aria-label="Add tag type"
                        className="flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Plus className="size-4" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entityTags.length === 0 ? (
                    <tr>
                      <td colSpan={tagTypes.length + 2} className="px-5 py-16 text-center text-sm text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <TagIcon className="size-5 text-slate-300" />
                          No {activeEntity.toLowerCase()}s tagged yet — use Bulk Upload or apply a tag to get started.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    entityTags.map((row) => (
                      <tr key={row.entity_key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-medium text-slate-800">{row.entity_key}</td>
                        {tagTypes.map((tagType) => (
                          <td key={tagType.id} className="px-4 py-3">
                            <EditableTagCell
                              value={row.tags[tagType.slug]}
                              onSave={(value) => handleCellSave(row.entity_key, tagType.name, value)}
                            />
                          </td>
                        ))}
                        <td />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showAddTagType && (
        <AddTagTypeModal entityType={activeEntity} onClose={() => setShowAddTagType(false)} />
      )}
      {showBulkUpload && (
        <BulkUploadModal entityType={activeEntity} onClose={() => setShowBulkUpload(false)} />
      )}
    </main>
  )
}
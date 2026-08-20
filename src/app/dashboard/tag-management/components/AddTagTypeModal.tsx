'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { EntityType, useCreateTagTypeMutation, isReservedTagTypeName } from '@/lib/hooks/queries/use-entity-tags'

export function AddTagTypeModal({ entityType, onClose }: { entityType: EntityType; onClose: () => void }) {
  const [name, setName] = useState('')
  const [allowMultiple, setAllowMultiple] = useState(false)

  const createTagType = useCreateTagTypeMutation(entityType)

  const reserved = isReservedTagTypeName(name)

  async function handleCreate() {
    if (!name.trim() || reserved) return
    await createTagType.mutateAsync({ name: name.trim(), allow_multiple: allowMultiple })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a2b3c]">New Tag Type</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="size-4 text-slate-400 hover:text-slate-700" />
          </button>
        </div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Segment"
          className={`mb-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a2b3c] ${
            reserved ? 'border-rose-400' : 'border-slate-300'
          }`}
        />
        {reserved && (
          <p className="mb-3 text-xs text-rose-600">
            &quot;campaign_id&quot; is reserved — it&apos;s populated automatically for targets, not used as a tag.
          </p>
        )}
        <label className={`mb-4 flex items-center gap-2 text-sm text-slate-600 ${reserved ? 'mt-3' : ''}`}>
          <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} />
          Allow multiple values per entity
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || reserved || createTagType.isPending}
            className="rounded-lg bg-[#1a2b3c] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {createTagType.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
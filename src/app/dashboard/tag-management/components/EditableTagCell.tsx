'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TagType, useCreateTagValueMutation, useTagValuesQuery } from '@/lib/hooks/queries/use-entity-tags'

interface EditorProps {
  tagType: TagType
  values: string[]
  saving: boolean
  setSaving: (v: boolean) => void
  onDone: () => void
  onSave: (values: string[]) => Promise<void>
}

export function EditableTagCell({
  tagType,
  values,
  onSave,
}: {
  tagType: TagType
  values: string[]
  onSave: (values: string[]) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const displayValue = values.join(', ')

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`w-full rounded px-2 py-1 text-left text-sm transition hover:bg-slate-100 ${
          displayValue ? 'text-slate-700' : 'text-slate-400'
        }`}
      >
        {displayValue || '---'}
      </button>
    )
  }

  const props: EditorProps = { tagType, values, saving, setSaving, onDone: () => setEditing(false), onSave }

  return (
    <div className="relative">
      {tagType.restrict_to_existing_values ? <RestrictedEditor {...props} /> : <FreeformEditor {...props} />}
    </div>
  )
}

// Ordinary freeform TagType (restrict_to_existing_values=false) — plain
// text input. allow_multiple ones accept a comma-separated list.
function FreeformEditor({ tagType, values, saving, setSaving, onDone, onSave }: EditorProps) {
  const [draft, setDraft] = useState(values.join(', '))

  async function commit() {
    const next = tagType.allow_multiple
      ? draft.split(',').map((v) => v.trim()).filter(Boolean)
      : draft.trim()
        ? [draft.trim()]
        : []
    if (next.join('|') !== values.join('|')) {
      setSaving(true)
      await onSave(next)
      setSaving(false)
    }
    onDone()
  }

  return (
    <input
      autoFocus
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      placeholder={tagType.allow_multiple ? 'value1, value2' : undefined}
      className="w-full rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-[#1a2b3c]"
    />
  )
}

// restrict_to_existing_values=true — a closed vocabulary. Values must
// already exist as Tag rows (or get created right here, inline) before
// they can be assigned; free typing an arbitrary value is not allowed,
// which is the whole point of this flag.
function RestrictedEditor({ tagType, values, saving, setSaving, onDone, onSave }: EditorProps) {
  const { data: options = [], isLoading } = useTagValuesQuery(tagType.id)
  const createValue = useCreateTagValueMutation()
  const [newValue, setNewValue] = useState('')

  async function toggle(name: string) {
    const next = tagType.allow_multiple
      ? values.includes(name)
        ? values.filter((v) => v !== name)
        : [...values, name]
      : [name]
    setSaving(true)
    await onSave(next)
    setSaving(false)
    if (!tagType.allow_multiple) onDone()
  }

  async function addValue() {
    if (!newValue.trim()) return
    const created = await createValue.mutateAsync({ tag_type: tagType.id, name: newValue.trim() })
    setNewValue('')
    await toggle(created.name)
  }

  return (
    <div
      className="absolute z-10 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onDone()
      }}
    >
      {isLoading ? (
        <div className="px-2 py-1 text-xs text-slate-400">Loading values...</div>
      ) : (
        <div className="max-h-40 overflow-y-auto">
          {options.length === 0 && <div className="px-2 py-1 text-xs text-slate-400">No values defined yet</div>}
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggle(opt.name)}
              disabled={saving}
              className={`block w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100 ${
                values.includes(opt.name) ? 'font-medium text-[#1a2b3c]' : 'text-slate-600'
              }`}
            >
              {values.includes(opt.name) ? `✓ ${opt.name}` : opt.name}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2">
        <input
          autoFocus={options.length === 0}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addValue()}
          placeholder="Add new value"
          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs outline-none focus:border-[#1a2b3c]"
        />
        <button
          onClick={addValue}
          aria-label="Add value"
          className="flex size-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
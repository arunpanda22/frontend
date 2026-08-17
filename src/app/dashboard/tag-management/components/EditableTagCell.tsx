'use client'

import { useState } from 'react'

export function EditableTagCell({ value, onSave }: { value?: string | string[]; onSave: (value: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(Array.isArray(value) ? value.join(', ') : value || '')
  const [saving, setSaving] = useState(false)

  const displayValue = Array.isArray(value) ? value.join(', ') : value

  async function commit() {
    if (draft.trim() && draft !== displayValue) {
      setSaving(true)
      await onSave(draft.trim())
      setSaving(false)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-[#1a2b3c]"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-full rounded px-2 py-1 text-left text-sm transition hover:bg-slate-100 ${displayValue ? 'text-slate-700' : 'text-slate-400'}`}
    >
      {displayValue || '---'}
    </button>
  )
}
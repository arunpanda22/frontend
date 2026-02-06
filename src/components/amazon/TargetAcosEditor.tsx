'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '../dashboard/ui/table/input'
import { Pencil, X } from 'lucide-react'
import { useUpdateTargetAcos } from '@/lib/hooks/queries/use-update-target-acos'

interface TargetAcosEditorProps {
  targetAcos: string | null
}

export function TargetAcosEditor({ targetAcos }: TargetAcosEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(targetAcos ?? '')
  const updateMutation = useUpdateTargetAcos()

  const save = () => {
    const numericValue = Number(value)

    if (isNaN(numericValue) || numericValue <= 0 ) {
      alert('Target ACOS must be above 0 ')
      return
    }

    updateMutation.mutate(
      { target_acos: numericValue },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  const cancel = () => {
    setValue(targetAcos ?? '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }

    if (e.key === 'Escape') {
      cancel()
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {targetAcos ? `${targetAcos}%` : 'Not set'}
        </span>
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.1"
        min="0"
        max="100"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-24"
        disabled={updateMutation.isPending}
      />

      <Button
        size="icon"
        variant="default"
        onClick={cancel}
        disabled={updateMutation.isPending}
      >
        <X className="h-4 w-4 text-gray-500" />
      </Button>
    </div>
  )
}

import React, { useState } from 'react'

interface UserDetailsFormProps {
  user: {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    is_active: boolean
    current_role?: {
      role_code: string
      role_name: string
    }
  }
  onUpdate: (data: {
    first_name?: string
    last_name?: string
    username?: string
    is_active?: boolean
  }) => Promise<void>
  isUpdating: boolean
}

export default function UserDetailsForm({ user, onUpdate, isUpdating }: UserDetailsFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    is_active: user.is_active
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSuperAdmin = user.current_role?.role_code === 'super_admin'
  const canDeactivate = !isSuperAdmin

  const hasChanges = () => {
    return (
      formData.first_name !== (user.first_name || '') ||
      formData.last_name !== (user.last_name || '') ||
      formData.username !== (user.username || '') ||
      formData.is_active !== user.is_active
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username cannot be empty'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!hasChanges()) {
      setIsEditing(false)
      return
    }

    try {
      const updates: any = {}
      
      if (formData.first_name !== user.first_name) {
        updates.first_name = formData.first_name
      }
      if (formData.last_name !== user.last_name) {
        updates.last_name = formData.last_name
      }
      if (formData.username !== user.username) {
        updates.username = formData.username
      }
      if (formData.is_active !== user.is_active) {
        updates.is_active = formData.is_active
      }

      await onUpdate(updates)
      setIsEditing(false)
    } catch (error: any) {
      if (error?.response?.data?.error) {
        setErrors({ submit: error.response.data.error })
      }
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      is_active: user.is_active
    })
    setErrors({})
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Details
          </button>
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Username</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.first_name || <span className="text-gray-400 italic">Not set</span>}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.last_name || <span className="text-gray-400 italic">Not set</span>}
              </dd>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                user.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Edit User Details</h3>
      </div>

      {errors.submit && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, username: e.target.value }))
              if (errors.username) {
                setErrors(prev => ({ ...prev, username: '' }))
              }
            }}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.username 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Enter username"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600">{errors.username}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={formData.is_active}
                onChange={() => canDeactivate && setFormData(prev => ({ ...prev, is_active: true }))}
                disabled={!canDeactivate}
                className="h-4 w-4 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={!formData.is_active}
                onChange={() => canDeactivate && setFormData(prev => ({ ...prev, is_active: false }))}
                disabled={!canDeactivate}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Inactive</span>
            </label>
          </div>
          {isSuperAdmin && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Super admin users cannot be deactivated
            </p>
          )}
        </div>

        {hasChanges() && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              You have unsaved changes
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUpdating || !hasChanges()}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
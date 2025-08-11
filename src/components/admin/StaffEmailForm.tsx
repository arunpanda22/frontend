'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import { useAdminQueryRefresh, useAdminUsers } from '@/lib/hooks/queries/use-admin'
import type { AdminUser } from '@/lib/api/services/admin-dashboard.service'

interface StaffEmailFormProps {
  onClose: () => void
  onSuccess?: () => void
}

interface StaffEmailInput {
  email: string
  description: string
}

export default function StaffEmailForm({ onClose, onSuccess }: StaffEmailFormProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [staffEmails, setStaffEmails] = useState<StaffEmailInput[]>([
    { email: '', description: '' }
  ])
  const [isActive, setIsActive] = useState(true)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const { refreshStaffEmails, refreshStaffEmailStats } = useAdminQueryRefresh()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Fetch users for selection - match the pattern used in main users page
  const usersQuery = useAdminUsers({ search: userSearch, page: 1 })
  
  const data = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Staff Email Form - Raw API Response:', usersQuery.data);
    }
    return usersQuery.data || { count: 0, results: [] };
  }, [usersQuery.data])

  const users = useMemo(() => {
    // Match the exact same pattern as the main users page
    const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Staff Email Form - Processed Users:', {
        isLoading: usersQuery.isLoading,
        isError: usersQuery.isError,
        error: usersQuery.error,
        dataCount: results.length,
        searchTerm: userSearch,
        rawData: data,
      });
    }
    
    return results;
  }, [data, usersQuery.isLoading, usersQuery.isError, usersQuery.error, userSearch])

  // No need for computed selectedUser anymore - we store it directly in state

  const filteredUsers = useMemo(() => {
    // Always show all users when search is empty or contains selection format
    if (!userSearch.trim() || userSearch.includes('(')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Staff Email Form - Showing all users:', {
          totalUsers: users.length,
          searchTerm: userSearch,
          reason: !userSearch.trim() ? 'empty search' : 'formatted selection',
        });
      }
      return users;
    }
    
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Staff Email Form - Filtered Users:', {
        totalUsers: users.length,
        filteredCount: filtered.length,
        searchTerm: userSearch,
      });
    }
    
    return filtered;
  }, [users, userSearch])

  const handleAddStaffEmail = () => {
    setStaffEmails([...staffEmails, { email: '', description: '' }])
  }

  const handleRemoveStaffEmail = (index: number) => {
    if (staffEmails.length > 1) {
      setStaffEmails(staffEmails.filter((_, i) => i !== index))
    }
  }

  const handleStaffEmailChange = (index: number, field: keyof StaffEmailInput, value: string) => {
    const updated = [...staffEmails]
    updated[index][field] = value
    setStaffEmails(updated)
  }

  const handleSelectUser = (user: AdminUser) => {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Staff Email Form - User Selected:', {
        user,
        userName: `${user.first_name} ${user.last_name}`,
        userEmail: user.email,
      });
    }
    
    setSelectedUser(user)
    setUserSearch(`${user.first_name} ${user.last_name} (${user.email})`.trim())
    setShowUserDropdown(false)
  }

  const handleUserInputFocus = () => {
    setShowUserDropdown(true)
    // If a user is already selected, clear the search to show all users
    if (selectedUser && userSearch.includes('(')) {
      setUserSearch('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Staff Email Form - Form Submission:', {
        selectedUser,
        userSearch,
        hasSelectedUser: !!selectedUser,
      });
    }

    try {
      if (!selectedUser) {
        throw new Error('Please select a user')
      }

      const validStaffEmails = staffEmails.filter(se => se.email.trim())
      if (validStaffEmails.length === 0) {
        throw new Error('At least one staff email is required')
      }

      if (isBulkMode) {
        // Bulk create multiple staff emails
        await adminDashboardService.bulkCreateStaffEmails({
          user_email: selectedUser.email,
          staff_emails: validStaffEmails.map(se => ({
            email: se.email.trim(),
            description: se.description.trim()
          }))
        })
      } else {
        // Create single staff email
        const staffEmail = validStaffEmails[0]
        await adminDashboardService.createStaffEmailByEmail({
          user_email: selectedUser.email,
          email: staffEmail.email.trim(),
          description: staffEmail.description.trim(),
          is_active: isActive
        })
      }

      // Refresh data
      const refreshPromises = [refreshStaffEmails()]
      
      // Only refresh stats if endpoint is available
      try {
        refreshPromises.push(refreshStaffEmailStats())
        await Promise.all(refreshPromises)
      } catch (statsError) {
        // If stats refresh fails, just refresh the main data
        await refreshStaffEmails()
      }

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Failed to create staff email:', error)
      setError(error.message || 'Failed to create staff email')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Add Staff Email{isBulkMode ? 's' : ''}
              </h2>
              <p className="text-sm text-gray-600">
                {isBulkMode 
                  ? 'Create multiple staff email assignments for a user'
                  : 'Create a staff email assignment for a user'
                }
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select User *</label>
              {selectedUser && (
                <div className="flex items-center justify-between text-xs text-green-600 mb-1">
                  <span>✓ Selected: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null)
                      setUserSearch('')
                      setShowUserDropdown(true)
                    }}
                    className="text-red-500 hover:text-red-700 text-xs underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setUserSearch(newValue)
                    setShowUserDropdown(true)
                    
                    // If user starts typing something new (not the formatted selection), clear the selected user
                    if (selectedUser && !newValue.includes('(')) {
                      setSelectedUser(null)
                    }
                  }}
                  onFocus={handleUserInputFocus}
                  placeholder="Search for a user..."
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                  required
                />
                
                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {usersQuery.isLoading ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading users...
                        </div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                The user who will receive staff notifications
              </p>
            </div>

            {/* Bulk Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bulk Mode</label>
                <p className="text-xs text-gray-500">
                  Create multiple staff emails at once
                </p>
              </div>
              <input
                type="checkbox"
                checked={isBulkMode}
                onChange={(e) => setIsBulkMode(e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>

            {/* Staff Emails */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Staff Email{isBulkMode ? 's' : ''} *
                </label>
                {isBulkMode && (
                  <button
                    type="button"
                    onClick={handleAddStaffEmail}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Email
                  </button>
                )}
              </div>

              {staffEmails.map((staffEmail, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Staff Email {index + 1}
                      </span>
                      {isBulkMode && staffEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStaffEmail(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          value={staffEmail.email}
                          onChange={(e) => handleStaffEmailChange(index, 'email', e.target.value)}
                          placeholder="staff@example.com"
                          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={staffEmail.description}
                          onChange={(e) => handleStaffEmailChange(index, 'description', e.target.value)}
                          placeholder="e.g., Team Lead, Manager"
                          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Status (only for single mode) */}
            {!isBulkMode && (
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Active Status</label>
                  <p className="text-xs text-gray-500">
                    Whether this staff email should receive notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  `Create Staff Email${isBulkMode ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
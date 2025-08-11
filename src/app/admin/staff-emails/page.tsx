'use client'

import { useState, useMemo } from 'react'
import { useStaffEmails, useStaffEmailStats, useAdminQueryRefresh } from '@/lib/hooks/queries/use-admin'
import { adminDashboardService } from '@/lib/api/services/admin-dashboard.service'
import type { StaffEmail } from '@/lib/api/services/admin-dashboard.service'
import StaffEmailForm from '@/components/admin/StaffEmailForm'

export default function StaffEmailsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEmails, setSelectedEmails] = useState<number[]>([])
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)
  const [sendingTestTo, setSendingTestTo] = useState<string | null>(null)
  const [testMessageStatus, setTestMessageStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    userEmail: string
  }>({ type: null, message: '', userEmail: '' })

  const { refreshStaffEmails, refreshStaffEmailStats } = useAdminQueryRefresh()

  const staffEmailsQuery = useStaffEmails({ 
    search, 
    page, 
    page_size: 20,
    is_active: activeFilter 
  })
  
  const statsQuery = useStaffEmailStats()

  // Suppress stats errors to avoid console spam during development
  const hasStats = statsQuery.data && !statsQuery.isError

  const data = useMemo(() => {
    return staffEmailsQuery.data || { count: 0, results: [] }
  }, [staffEmailsQuery.data])

  const staffEmails = useMemo(() => {
    return Array.isArray(data.results) ? data.results : []
  }, [data])

  const loading = staffEmailsQuery.isLoading
  const error = staffEmailsQuery.isError ? 'Failed to load staff emails. Check console for details.' : null

  const totalPages = Math.max(1, Math.ceil(data.count / 20))
  const canPrev = page > 1
  const canNext = page < totalPages

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setShowRefreshSuccess(false)
    try {
      const refreshPromises = [refreshStaffEmails()]
      
      // Only refresh stats if they're available (backend endpoint exists)
      if (hasStats) {
        refreshPromises.push(refreshStaffEmailStats())
      }
      
      await Promise.all(refreshPromises)
      setShowRefreshSuccess(true)
      // Hide success message after 2 seconds
      setTimeout(() => setShowRefreshSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      await adminDashboardService.toggleStaffEmailActive(id)
      await refreshStaffEmails()
    } catch (error) {
      console.error('Failed to toggle active status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff email?')) return
    
    try {
      await adminDashboardService.deleteStaffEmail(id)
      await refreshStaffEmails()
      if (hasStats) {
        await refreshStaffEmailStats()
      }
    } catch (error) {
      console.error('Failed to delete staff email:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedEmails.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedEmails.length} staff email(s)?`)) return

    try {
      await adminDashboardService.bulkDeleteStaffEmails(selectedEmails)
      setSelectedEmails([])
      await refreshStaffEmails()
      if (hasStats) {
        await refreshStaffEmailStats()
      }
    } catch (error) {
      console.error('Failed to bulk delete:', error)
    }
  }

  const handleSelectEmail = (id: number) => {
    setSelectedEmails(prev => 
      prev.includes(id) 
        ? prev.filter(emailId => emailId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedEmails.length === staffEmails.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(staffEmails.map(email => email.id))
    }
  }

  const handleSendTestAlert = async (userEmail: string) => {
    setSendingTestTo(userEmail)
    setTestMessageStatus({ type: null, message: '', userEmail: '' })
    
    try {
      await adminDashboardService.sendTestStaffAlert({
        user_email: userEmail,
        subject: 'Test Alert from Admin Dashboard',
        message: 'This is a test alert to verify your staff email configuration is working correctly.'
      })
      
      setTestMessageStatus({
        type: 'success',
        message: 'Test alert sent successfully!',
        userEmail
      })
      
      // Clear success message after 4 seconds
      setTimeout(() => {
        setTestMessageStatus({ type: null, message: '', userEmail: '' })
      }, 4000)
      
    } catch (error) {
      console.error('Failed to send test alert:', error)
      setTestMessageStatus({
        type: 'error',
        message: 'Failed to send test alert. Please try again.',
        userEmail
      })
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setTestMessageStatus({ type: null, message: '', userEmail: '' })
      }, 5000)
    } finally {
      setSendingTestTo(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Test Message Status */}
      {(sendingTestTo || testMessageStatus.type) && (
        <div className={`p-4 rounded-md border ${
          testMessageStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : testMessageStatus.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-3">
            {sendingTestTo ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium">Sending test alert...</p>
                  <p className="text-sm">Sending test notification to {sendingTestTo}</p>
                </div>
              </>
            ) : testMessageStatus.type === 'success' ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium">{testMessageStatus.message}</p>
                  <p className="text-sm">Test alert sent to {testMessageStatus.userEmail}</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium">{testMessageStatus.message}</p>
                  <p className="text-sm">Failed to send test alert to {testMessageStatus.userEmail}</p>
                </div>
              </>
            )}
            {testMessageStatus.type && (
              <button
                onClick={() => setTestMessageStatus({ type: null, message: '', userEmail: '' })}
                className="ml-auto text-current hover:opacity-70"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header - matching users page pattern */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Staff Emails</h1>
        <div className="flex items-center gap-3">
          {/* Success notification */}
          {showRefreshSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md transition-all duration-300 ease-in-out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Refreshed!
            </div>
          )}
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff Email
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(loading || isRefreshing) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {loading ? 'Loading...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats - only show if available */}
      {hasStats && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{statsQuery.data.total_users}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-green-600">{statsQuery.data.users_with_staff_emails}</div>
              <div className="text-sm text-gray-600">With Staff Emails</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-blue-600">{statsQuery.data.total_staff_emails}</div>
              <div className="text-sm text-gray-600">Total Staff Emails</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-purple-600">{statsQuery.data.active_staff_emails}</div>
              <div className="text-sm text-gray-600">Active Emails</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters - matching users page pattern */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
              placeholder="Search by user email, staff email, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter(undefined)}
              className={`px-3 py-1.5 text-sm rounded border ${activeFilter === undefined ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter(true)}
              className={`px-3 py-1.5 text-sm rounded border ${activeFilter === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter(false)}
              className={`px-3 py-1.5 text-sm rounded border ${activeFilter === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Inactive
            </button>
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-gray-500 hover:text-gray-700 px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEmails.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedEmails.length} staff email(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Staff Emails Table - matching users page pattern */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-16">
                  <input
                    type="checkbox"
                    checked={selectedEmails.length === staffEmails.length && staffEmails.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">Staff Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading staff emails...
                  </div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-red-600">
                  {error}
                </td></tr>
              ) : staffEmails.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  {data.count === 0 ? 'No staff emails found' : 'No staff emails match your search'}
                </td></tr>
              ) : (
                staffEmails.map((staffEmail: StaffEmail) => (
                  <tr key={staffEmail.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(staffEmail.id)}
                        onChange={() => handleSelectEmail(staffEmail.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm truncate">
                      <div className="font-medium text-gray-900">{staffEmail.user_email}</div>
                      <div className="text-xs text-gray-500">ID: {staffEmail.user}</div>
                    </td>
                    <td className="px-4 py-3 text-sm truncate">
                      {staffEmail.email}
                    </td>
                    <td className="px-4 py-3 text-sm truncate">
                      {staffEmail.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${staffEmail.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {staffEmail.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-xs text-gray-700">
                        {new Date(staffEmail.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {staffEmail.created_by_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(staffEmail.id)}
                          disabled={sendingTestTo === staffEmail.user_email}
                          title={staffEmail.is_active ? 'Deactivate' : 'Activate'}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {staffEmail.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleSendTestAlert(staffEmail.user_email)}
                          disabled={sendingTestTo === staffEmail.user_email}
                          title="Send Test Alert"
                          className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                            sendingTestTo === staffEmail.user_email
                              ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {sendingTestTo === staffEmail.user_email ? (
                            <>
                              <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              Sending...
                            </>
                          ) : (
                            'Test'
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(staffEmail.id)}
                          disabled={sendingTestTo === staffEmail.user_email}
                          title="Delete"
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - matching users page pattern */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">Page {page} of {totalPages} • Total {data.count} staff emails</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!canPrev}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={!canNext}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Create Staff Email Form */}
      {showCreateForm && (
        <StaffEmailForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}